from fastapi.testclient import TestClient


def test_product_and_variant_pricing_flow(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create product with initial variant
    payload = {
        "name": "ERP Cloud Connector",
        "type": "software",
        "sales_price": 5000,  # $50.00
        "cost_price": 2000,   # $20.00
        "currency": "USD",
        "notes": "Fast cloud connector",
        "variants": [
            {"attribute": "brand", "value": "Odoo", "extra_price": 560}  # +$5.60
        ]
    }
    res = client.post("/api/products", headers=headers, json=payload)
    assert res.status_code == 201
    prod = res.json()
    assert prod["sales_price"] == 5000
    assert len(prod["variants"]) == 1
    variant = prod["variants"][0]
    assert variant["attribute"] == "brand"
    assert variant["value"] == "Odoo"
    assert variant["extra_price"] == 560

    # Calculated final price check
    final_price = prod["sales_price"] + variant["extra_price"]
    assert final_price == 5560  # $55.60

    # 2. Add another variant
    res_var = client.post(f"/api/products/{prod['id']}/variants", headers=headers, json={
        "attribute": "brand",
        "value": "Salesforce",
        "extra_price": 1200
    })
    assert res_var.status_code == 201
    assert res_var.json()["extra_price"] == 1200

    # 3. Update product price
    res_up = client.patch(f"/api/products/{prod['id']}", headers=headers, json={
        "sales_price": 6000
    })
    assert res_up.status_code == 200
    assert res_up.json()["sales_price"] == 6000


def test_plans_lifecycle_and_flags(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    plan_payload = {
        "name": "Growth Annual",
        "price": 29900,
        "currency": "USD",
        "billing_period": "yearly",
        "min_quantity": 2,
        "auto_close": False,
        "closable": True,
        "pausable": True,
        "renewable": True
    }
    res = client.post("/api/plans", headers=headers, json=plan_payload)
    assert res.status_code == 201
    plan = res.json()
    assert plan["billing_period"] == "yearly"
    assert plan["min_quantity"] == 2
    assert plan["pausable"] is True

    # Update plan to non-pausable
    res_patch = client.patch(f"/api/plans/{plan['id']}", headers=headers, json={
        "pausable": False,
        "price": 32000
    })
    assert res_patch.status_code == 200
    assert res_patch.json()["pausable"] is False
    assert res_patch.json()["price"] == 32000


def test_tax_rates(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.post("/api/taxes", headers=headers, json={
        "name": "European VAT Standard",
        "rate_percent": "20.00"
    })
    assert res.status_code == 201
    assert float(res.json()["rate_percent"]) == 20.00

    # Duplicate name should fail
    res_dup = client.post("/api/taxes", headers=headers, json={
        "name": "European VAT Standard",
        "rate_percent": "21.00"
    })
    assert res_dup.status_code == 400


def test_discount_scopes_and_limits(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # First create a product to link
    prod_res = client.post("/api/products", headers=headers, json={
        "name": "Target Product",
        "sales_price": 2000
    })
    prod_id = prod_res.json()["id"]

    # Create discount with product scope and linked product
    discount_payload = {
        "name": "Black Friday 30%",
        "code": "BF30",
        "type": "percent",
        "value": 30,
        "min_purchase": 5000,
        "min_quantity": 1,
        "usage_limit": 100,
        "scope": "product",
        "product_ids": [prod_id]
    }
    res = client.post("/api/discounts", headers=headers, json=discount_payload)
    assert res.status_code == 201
    disc = res.json()
    assert disc["code"] == "BF30"
    assert disc["type"] == "percent"
    assert disc["value"] == 30
    assert disc["linked_product_ids"] == [prod_id]

