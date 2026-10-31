from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.customer import Customer


def test_admin_can_create_staff_and_catalogs(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin creates staff
    res_staff = client.post("/api/users/staff", headers=headers, json={
        "email": "new_staff@test.io",
        "password": "StaffSecret123!",
        "role": "staff"
    })
    assert res_staff.status_code == 201
    assert res_staff.json()["role"] == "staff"

    # Admin creates product
    res_prod = client.post("/api/products", headers=headers, json={
        "name": "Cloud Security Suite",
        "type": "software",
        "sales_price": 4900,
        "cost_price": 1200,
        "currency": "USD",
        "variants": [{"attribute": "tier", "value": "Standard", "extra_price": 0}]
    })
    assert res_prod.status_code == 201

    # Admin creates plan
    res_plan = client.post("/api/plans", headers=headers, json={
        "name": "Quarterly Pro",
        "price": 14900,
        "currency": "USD",
        "billing_period": "monthly",
        "min_quantity": 1
    })
    assert res_plan.status_code == 201

    # Admin creates tax
    res_tax = client.post("/api/taxes", headers=headers, json={
        "name": "State VAT",
        "rate_percent": "12.50"
    })
    assert res_tax.status_code == 201

    # Admin creates discount
    res_discount = client.post("/api/discounts", headers=headers, json={
        "name": "VIP Discount",
        "type": "percent",
        "value": 15,
        "scope": "subscription"
    })
    assert res_discount.status_code == 201


def test_staff_cannot_create_staff_or_catalogs(client: TestClient, staff_token: str):
    headers = {"Authorization": f"Bearer {staff_token}"}

    # Staff cannot create staff
    res_staff = client.post("/api/users/staff", headers=headers, json={
        "email": "another_staff@test.io",
        "password": "StaffSecret123!",
        "role": "staff"
    })
    assert res_staff.status_code == 403

    # Staff cannot create product
    res_prod = client.post("/api/products", headers=headers, json={
        "name": "Disallowed Product",
        "sales_price": 1000,
    })
    assert res_prod.status_code == 403

    # Staff cannot create plan
    res_plan = client.post("/api/plans", headers=headers, json={
        "name": "Disallowed Plan",
        "price": 5000,
    })
    assert res_plan.status_code == 403

    # Staff cannot create tax
    res_tax = client.post("/api/taxes", headers=headers, json={
        "name": "Disallowed Tax",
        "rate_percent": "10.00"
    })
    assert res_tax.status_code == 403

    # Staff cannot create discount
    res_discount = client.post("/api/discounts", headers=headers, json={
        "name": "Disallowed Discount",
        "value": 10,
    })
    assert res_discount.status_code == 403


def test_staff_can_manage_customers(client: TestClient, staff_token: str):
    headers = {"Authorization": f"Bearer {staff_token}"}

    # Create customer
    res = client.post("/api/customers", headers=headers, json={
        "name": "Starlight Industries",
        "company": "Starlight Inc",
        "billing_address": "789 Constellation Way",
        "tax_id": "ST-999"
    })
    assert res.status_code == 201
    cid = res.json()["id"]

    # View customers
    list_res = client.get("/api/customers", headers=headers)
    assert list_res.status_code == 200
    assert any(c["id"] == cid for c in list_res.json()["items"])


def test_customer_isolation_and_restricted_access(
    client: TestClient,
    db_session: Session,
    customer_token: str,
    customer_user
):
    headers = {"Authorization": f"Bearer {customer_token}"}

    # Customer cannot create products
    assert client.post("/api/products", headers=headers, json={"name": "X", "sales_price": 100}).status_code == 403

    # Customer cannot create customers
    assert client.post("/api/customers", headers=headers, json={"name": "Y"}).status_code == 403

    # Customer can only view their own customer record in list
    res_list = client.get("/api/customers", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == customer_user.customer_id

    # Create another customer in DB
    other_customer = Customer(name="Other Corp", company="Secret LLC")
    db_session.add(other_customer)
    db_session.commit()

    # Customer attempting to access other customer record directly gets 403
    res_other = client.get(f"/api/customers/{other_customer.id}", headers=headers)
    assert res_other.status_code == 403

