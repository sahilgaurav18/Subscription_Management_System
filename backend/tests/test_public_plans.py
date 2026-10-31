import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.plan import Plan
from app.models.product import Product
from app.routers.public import invalidate_public_plans_cache

client = TestClient(app)


def test_public_plans_endpoint_filtering_and_security():
    """
    Verify GET /api/v1/public/plans:
    1. Returns only active, currently available plans.
    2. Strictly filters out inactive plans (is_active=False).
    3. Strictly filters out plans outside their availability window (past or future).
    4. NEVER leaks cost prices, notes, or internal metadata.
    5. Sets Cache-Control header with 60s max-age.
    """
    invalidate_public_plans_cache()
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        # 1. Active & Available plan
        p_active = Plan(
            name="Public Starter Plan",
            price=2900,
            currency="USD",
            billing_period="monthly",
            min_quantity=1,
            is_active=True,
            available_from=now - timedelta(days=10),
            available_to=now + timedelta(days=30),
            closable=True,
            pausable=True,
            renewable=True
        )

        # 2. Inactive plan
        p_inactive = Plan(
            name="Archived Inactive Plan",
            price=1900,
            currency="USD",
            billing_period="monthly",
            min_quantity=1,
            is_active=False,
            available_from=now - timedelta(days=10),
            available_to=now + timedelta(days=30)
        )

        # 3. Expired plan (available_to in the past)
        p_expired = Plan(
            name="Expired Promotional Plan",
            price=900,
            currency="USD",
            billing_period="monthly",
            min_quantity=1,
            is_active=True,
            available_from=now - timedelta(days=60),
            available_to=now - timedelta(days=5)
        )

        # 4. Future plan (available_from in the future)
        p_future = Plan(
            name="Upcoming Beta Plan",
            price=4900,
            currency="USD",
            billing_period="monthly",
            min_quantity=1,
            is_active=True,
            available_from=now + timedelta(days=10),
            available_to=now + timedelta(days=60)
        )

        # 5. Product with cost price and confidential notes
        prod = Product(
            name="Confidential Product",
            type="software",
            sales_price=9900,
            cost_price=3500,
            notes="Confidential cost margin and notes"
        )

        db.add_all([p_active, p_inactive, p_expired, p_future, prod])
        db.commit()
        db.refresh(p_active)

        # Query public endpoint
        res = client.get("/api/v1/public/plans")
        assert res.status_code == 200
        assert "public, max-age=60" in res.headers.get("Cache-Control", "")

        data = res.json()
        assert isinstance(data, list)
        names = [item["name"] for item in data]

        # Verify inclusion & exclusion
        assert "Public Starter Plan" in names
        assert "Archived Inactive Plan" not in names
        assert "Expired Promotional Plan" not in names
        assert "Upcoming Beta Plan" not in names

        # Verify fields on every returned plan
        for item in data:
            assert "name" in item
            assert "price" in item
            assert "billing_period" in item
            assert "min_quantity" in item

            # Verify forbidden/confidential fields are NEVER exposed
            assert "cost_price" not in item
            assert "cost" not in item
            assert "notes" not in item
            assert "is_active" not in item
            assert "auto_close" not in item
            assert "closable" not in item
            assert "pausable" not in item
            assert "renewable" not in item

        # Also test the alias route /api/public/plans
        res_alias = client.get("/api/public/plans")
        assert res_alias.status_code == 200
        assert len(res_alias.json()) == len(data)

    finally:
        # Cleanup test records
        db.query(Plan).filter(Plan.name.in_([
            "Public Starter Plan",
            "Archived Inactive Plan",
            "Expired Promotional Plan",
            "Upcoming Beta Plan"
        ])).delete(synchronize_session=False)
        db.query(Product).filter(Product.name == "Confidential Product").delete(synchronize_session=False)
        db.commit()
        db.close()
        invalidate_public_plans_cache()

