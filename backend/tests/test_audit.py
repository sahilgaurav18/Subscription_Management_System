from fastapi.testclient import TestClient


def test_audit_logs_created_on_price_plan_tax_discount_updates(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Product creation & price change
    prod = client.post("/api/products", headers=headers, json={
        "name": "Audit Sample Product",
        "sales_price": 1000
    }).json()

    client.patch(f"/api/products/{prod['id']}", headers=headers, json={
        "sales_price": 1500
    })

    # 2. Plan update
    plan = client.post("/api/plans", headers=headers, json={
        "name": "Audit Sample Plan",
        "price": 2000,
        "billing_period": "monthly"
    }).json()

    client.patch(f"/api/plans/{plan['id']}", headers=headers, json={
        "price": 2500
    })

    # 3. Tax update
    tax = client.post("/api/taxes", headers=headers, json={
        "name": "Audit Tax",
        "rate_percent": "5.00"
    }).json()

    client.patch(f"/api/taxes/{tax['id']}", headers=headers, json={
        "rate_percent": "6.00"
    })

    # 4. Check audit logs endpoint
    res_logs = client.get("/api/audit-logs", headers=headers)
    assert res_logs.status_code == 200
    logs = res_logs.json()["items"]
    entities = [log["entity"] for log in logs]

    assert "product" in entities
    assert "plan" in entities
    assert "tax" in entities

