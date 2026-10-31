from fastapi.testclient import TestClient


def test_pagination_and_query_filtering(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create 15 products with distinct names
    for i in range(15):
        prefix = "Alpha" if i < 8 else "Beta"
        client.post("/api/products", headers=headers, json={
            "name": f"{prefix} Product {i:02d}",
            "sales_price": 1000 + (i * 100)
        })

    # Page 1 with page_size=5
    res_p1 = client.get("/api/products?page=1&page_size=5", headers=headers)
    assert res_p1.status_code == 200
    data_p1 = res_p1.json()
    assert len(data_p1["items"]) == 5
    assert data_p1["total"] == 15
    assert data_p1["page"] == 1
    assert data_p1["page_size"] == 5
    assert data_p1["total_pages"] == 3

    # Page 2
    res_p2 = client.get("/api/products?page=2&page_size=5", headers=headers)
    assert res_p2.status_code == 200
    data_p2 = res_p2.json()
    assert len(data_p2["items"]) == 5

    # Filter with q='Alpha'
    res_alpha = client.get("/api/products?q=Alpha&page_size=20", headers=headers)
    assert res_alpha.status_code == 200
    data_alpha = res_alpha.json()
    assert data_alpha["total"] == 8
    assert all("Alpha" in item["name"] for item in data_alpha["items"])

