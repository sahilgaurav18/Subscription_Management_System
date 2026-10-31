from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.subscription import Subscription, SubscriptionStatus, QuotationTemplate, QuotationTemplateLine
from app.models.plan import Plan, BillingPeriod
from app.models.product import Product, ProductVariant
from app.models.customer import Customer
from app.models.audit import AuditLog


def test_quotation_template_crud(client: TestClient, staff_token: str, admin_token: str):
    headers = {"Authorization": f"Bearer {staff_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Setup Plan & Product
    plan_res = client.post("/api/plans", headers=admin_headers, json={
        "name": "Template Test Plan",
        "price": 4900,
        "billing_period": "monthly",
        "min_quantity": 1
    })
    plan_id = plan_res.json()["id"]

    prod_res = client.post("/api/products", headers=admin_headers, json={
        "name": "Template Software Core",
        "sales_price": 3000,
        "variants": [{"attribute": "edition", "value": "Standard", "extra_price": 500}]
    })
    prod = prod_res.json()
    prod_id = prod["id"]
    variant_id = prod["variants"][0]["id"]

    # 1. Staff creates quotation template
    create_res = client.post("/api/quotation-templates", headers=headers, json={
        "name": "Standard Enterprise Setup",
        "validity_days": 15,
        "plan_id": plan_id,
        "lines": [
            {"product_id": prod_id, "variant_id": variant_id, "quantity": 2}
        ]
    })
    assert create_res.status_code == 201
    tpl = create_res.json()
    assert tpl["validity_days"] == 15
    assert len(tpl["lines"]) == 1
    assert tpl["lines"][0]["product_id"] == prod_id
    assert tpl["lines"][0]["quantity"] == 2

    # 2. Staff views templates list
    list_res = client.get("/api/quotation-templates", headers=headers)
    assert list_res.status_code == 200
    assert any(t["id"] == tpl["id"] for t in list_res.json()["items"])

    # 3. Staff updates template validity
    up_res = client.patch(f"/api/quotation-templates/{tpl['id']}", headers=headers, json={
        "validity_days": 20
    })
    assert up_res.status_code == 200
    assert up_res.json()["validity_days"] == 20

    # 4. Staff deletes template
    del_res = client.delete(f"/api/quotation-templates/{tpl['id']}", headers=headers)
    assert del_res.status_code == 200


def test_create_quotation_from_template_and_price_snapshotting(
    client: TestClient,
    admin_token: str,
    staff_token: str,
    customer_user
):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # Setup
    plan = client.post("/api/plans", headers=admin_headers, json={
        "name": "Monthly SaaS",
        "price": 10000,
        "billing_period": "monthly",
        "min_quantity": 2
    }).json()

    prod = client.post("/api/products", headers=admin_headers, json={
        "name": "Analytics Pro",
        "sales_price": 5000,
        "variants": [{"attribute": "tier", "value": "Plus", "extra_price": 1000}]
    }).json()

    tpl = client.post("/api/quotation-templates", headers=staff_headers, json={
        "name": "Default 2-Seat Analytics",
        "validity_days": 30,
        "plan_id": plan["id"],
        "lines": [
            {"product_id": prod["id"], "variant_id": prod["variants"][0]["id"], "quantity": 2}
        ]
    }).json()

    # Create quotation from template for customer
    q_res = client.post("/api/subscriptions/from-template", headers=staff_headers, json={
        "template_id": tpl["id"],
        "customer_id": customer_user.customer_id,
        "payment_terms": "Net 30"
    })
    assert q_res.status_code == 201
    sub = q_res.json()
    assert sub["number"].startswith("SUB-")
    assert sub["status"] == "quotation"
    assert sub["customer_id"] == customer_user.customer_id
    assert sub["payment_terms"] == "Net 30"
    assert sub["expiry_date"] is not None
    assert len(sub["lines"]) == 1

    # Base price calculation: 5000 + 1000 = 6000 per unit; 6000 * 2 = 12000
    assert sub["lines"][0]["unit_price"] == 6000
    assert sub["lines"][0]["amount"] == 12000

    # Confirm the quotation
    conf_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={
        "action": "confirm"
    })
    assert conf_res.status_code == 200
    conf_sub = conf_res.json()
    assert conf_sub["status"] == "confirmed"
    assert conf_sub["next_invoice_date"] is not None


def test_quotation_expiry_prevents_confirmation(
    client: TestClient,
    admin_token: str,
    staff_token: str,
    customer_user,
    db_session: Session
):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    plan = client.post("/api/plans", headers=admin_headers, json={
        "name": "Expiring Plan",
        "price": 2000,
        "billing_period": "monthly",
        "min_quantity": 1
    }).json()

    prod = client.post("/api/products", headers=admin_headers, json={
        "name": "Widget Tool",
        "sales_price": 2000
    }).json()

    # Create subscription in quotation status with expiry_date in the past
    past_expiry = datetime.now(timezone.utc) - timedelta(days=2)
    sub = client.post("/api/subscriptions", headers=staff_headers, json={
        "customer_id": customer_user.customer_id,
        "plan_id": plan["id"],
        "expiry_date": past_expiry.isoformat(),
        "status": "quotation",
        "lines": [{"product_id": prod["id"], "quantity": 1}]
    }).json()

    # Attempt to confirm expired quotation -> MUST FAIL
    res_conf = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={
        "action": "confirm"
    })
    assert res_conf.status_code == 400
    assert "expired" in res_conf.json()["detail"].lower()


def test_plan_flag_rules_pausable_closable_renewable(
    client: TestClient,
    admin_token: str,
    staff_token: str,
    customer_user
):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # Create restricted plan: pausable=False, closable=False, renewable=False
    restricted_plan = client.post("/api/plans", headers=admin_headers, json={
        "name": "Strict Locked Plan",
        "price": 5000,
        "billing_period": "monthly",
        "min_quantity": 1,
        "pausable": False,
        "closable": False,
        "renewable": False
    }).json()

    prod = client.post("/api/products", headers=admin_headers, json={
        "name": "Strict Software",
        "sales_price": 5000
    }).json()

    # Create & confirm & activate
    sub = client.post("/api/subscriptions", headers=staff_headers, json={
        "customer_id": customer_user.customer_id,
        "plan_id": restricted_plan["id"],
        "status": "draft",
        "lines": [{"product_id": prod["id"], "quantity": 1}]
    }).json()

    client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "confirm"})
    client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "activate"})

    # 1. Attempt pause on non-pausable plan -> MUST FAIL
    pause_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "pause"})
    assert pause_res.status_code == 400
    assert "pausable" in pause_res.json()["detail"].lower()

    # 2. Attempt early close on non-closable plan -> MUST FAIL
    close_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "close"})
    assert close_res.status_code == 400
    assert "permit early closure" in close_res.json()["detail"].lower()

    # 3. Attempt renew on non-renewable plan -> MUST FAIL
    renew_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "renew"})
    assert renew_res.status_code == 400
    assert "renewable" in renew_res.json()["detail"].lower()


def test_allowed_pause_resume_close_and_audit_log(
    client: TestClient,
    admin_token: str,
    staff_token: str,
    customer_user
):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    flexible_plan = client.post("/api/plans", headers=admin_headers, json={
        "name": "Flexible Plan",
        "price": 1000,
        "billing_period": "monthly",
        "min_quantity": 1,
        "pausable": True,
        "closable": True,
        "renewable": True
    }).json()

    prod = client.post("/api/products", headers=admin_headers, json={
        "name": "Flex Item",
        "sales_price": 1000
    }).json()

    sub = client.post("/api/subscriptions", headers=staff_headers, json={
        "customer_id": customer_user.customer_id,
        "plan_id": flexible_plan["id"],
        "status": "draft",
        "lines": [{"product_id": prod["id"], "quantity": 1}]
    }).json()

    # draft -> quotation -> confirm -> activate -> pause -> resume -> renew -> close
    client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "quotation"})
    client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "confirm"})
    client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "activate"})

    # Pause
    p_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "pause"})
    assert p_res.status_code == 200
    assert p_res.json()["status"] == "paused"

    # Resume
    r_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "resume"})
    assert r_res.status_code == 200
    assert r_res.json()["status"] == "active"

    # Renew
    orig_expiry = r_res.json()["expiry_date"]
    rn_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "renew"})
    assert rn_res.status_code == 200
    assert rn_res.json()["expiry_date"] != orig_expiry

    # Close
    cl_res = client.post(f"/api/subscriptions/{sub['id']}/transition", headers=staff_headers, json={"action": "close"})
    assert cl_res.status_code == 200
    assert cl_res.json()["status"] == "closed"

    # Verify audit logs captured STATUS_CHANGE
    logs_res = client.get("/api/audit-logs?entity=subscription", headers=staff_headers)
    assert logs_res.status_code == 200
    actions = [l["action"] for l in logs_res.json()["items"]]
    assert "STATUS_CHANGE" in actions


def test_customer_isolation_on_subscriptions(
    client: TestClient,
    admin_token: str,
    staff_token: str,
    customer_token: str,
    customer_user,
    db_session: Session
):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    cust_headers = {"Authorization": f"Bearer {customer_token}"}

    plan = client.post("/api/plans", headers=admin_headers, json={
        "name": "Customer Plan",
        "price": 1000,
        "billing_period": "monthly"
    }).json()

    prod = client.post("/api/products", headers=admin_headers, json={
        "name": "Customer Item",
        "sales_price": 1000
    }).json()

    # Create sub for customer_user
    my_sub = client.post("/api/subscriptions", headers=staff_headers, json={
        "customer_id": customer_user.customer_id,
        "plan_id": plan["id"],
        "lines": [{"product_id": prod["id"], "quantity": 1}]
    }).json()

    # Create another customer in DB and a subscription for them
    other_cust = Customer(name="Another Customer Inc")
    db_session.add(other_cust)
    db_session.commit()

    other_sub = client.post("/api/subscriptions", headers=staff_headers, json={
        "customer_id": other_cust.id,
        "plan_id": plan["id"],
        "lines": [{"product_id": prod["id"], "quantity": 1}]
    }).json()

    # Customer lists subscriptions -> sees ONLY their own!
    cust_list = client.get("/api/subscriptions", headers=cust_headers).json()
    assert cust_list["total"] == 1
    assert cust_list["items"][0]["id"] == my_sub["id"]
    assert all(s["customer_id"] == customer_user.customer_id for s in cust_list["items"])

    # Customer tries to get other subscription directly -> 403 Forbidden
    other_get = client.get(f"/api/subscriptions/{other_sub['id']}", headers=cust_headers)
    assert other_get.status_code == 403

    # Customer tries to trigger transition -> 403 Forbidden
    trans_att = client.post(f"/api/subscriptions/{my_sub['id']}/transition", headers=cust_headers, json={
        "action": "confirm"
    })
    assert trans_att.status_code == 403


def test_customer_delete_endpoint_and_audit(client: TestClient, staff_token: str):
    headers = {"Authorization": f"Bearer {staff_token}"}

    cust = client.post("/api/customers", headers=headers, json={
        "name": "Temporary Client",
        "company": "Temp LLC"
    }).json()

    del_res = client.delete(f"/api/customers/{cust['id']}", headers=headers)
    assert del_res.status_code == 200

    # Ensure 404 now
    assert client.get(f"/api/customers/{cust['id']}", headers=headers).status_code == 404

    # Check audit log
    audit_res = client.get(f"/api/audit-logs?entity=customer&entity_id={cust['id']}", headers=headers).json()
    assert any(log["action"] == "DELETE" for log in audit_res["items"])

