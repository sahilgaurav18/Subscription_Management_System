import pytest
import uuid
from app.exceptions import (
    BusinessRuleError,
    OverpaymentError,
    PlanFlagNotAllowedError,
    ExpiredQuotationError,
    InvalidStatusTransitionError,
    ResourceNotFoundError,
)
from app.services.discount_strategies import (
    DiscountStrategyContext,
    FixedDiscountStrategy,
    PercentDiscountStrategy,
)
from app.shared_config import (
    get_password_rules,
    get_status_transitions,
    get_billing_periods,
    get_payment_methods,
)


def test_shared_config_files():
    # 1. Password rules
    pw_rules = get_password_rules()
    assert pw_rules["min_length"] == 8
    assert pw_rules["require_uppercase"] is True
    assert pw_rules["require_lowercase"] is True
    assert pw_rules["require_special"] is True
    assert len(pw_rules["rules"]) >= 4

    # 2. Status transitions
    transitions = get_status_transitions()
    assert "subscriptions" in transitions
    assert "invoices" in transitions
    assert "quotation" in transitions["subscriptions"]["draft"]
    assert "paid" in transitions["invoices"]["confirmed"]

    # 3. Billing periods
    billing_periods = get_billing_periods()
    period_ids = [p["id"] for p in billing_periods["periods"]]
    assert "daily" in period_ids
    assert "monthly" in period_ids
    assert "yearly" in period_ids

    # 4. Payment methods
    payment_methods = get_payment_methods()
    method_ids = [m["id"] for m in payment_methods["methods"]]
    assert "credit_card" in method_ids
    assert "bank_transfer" in method_ids
    assert "stripe" in method_ids


def test_discount_strategy_pattern():
    # Fixed strategy
    fixed = DiscountStrategyContext.get_strategy("fixed")
    assert isinstance(fixed, FixedDiscountStrategy)
    assert fixed.calculate_saving(amount=5000, value=1500) == 1500  # $50 with $15 off = $15
    assert fixed.calculate_saving(amount=1000, value=1500) == 1000  # Capped at subtotal

    # Percent strategy
    percent = DiscountStrategyContext.get_strategy("percent")
    assert isinstance(percent, PercentDiscountStrategy)
    assert percent.calculate_saving(amount=10000, value=20) == 2000  # 20% of $100 = $20
    assert percent.calculate_saving(amount=1050, value=10) == 105   # 10% of $10.50 = $1.05

    # Unsupported strategy
    with pytest.raises(ValueError):
        DiscountStrategyContext.get_strategy("unsupported_strategy")


def test_request_id_and_structured_logging(client):
    # Auto-generated Request ID
    res = client.get("/api/health")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers
    req_id = res.headers["X-Request-ID"]
    # Check it parses as UUID
    uuid.UUID(req_id)

    # Echo custom X-Request-ID
    custom_trace = "custom-trace-id-xyz-987"
    res2 = client.get("/api/health", headers={"X-Request-ID": custom_trace})
    assert res2.headers["X-Request-ID"] == custom_trace


def test_health_endpoints(client):
    res1 = client.get("/health")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "healthy"
    assert data1["database"] == "connected"

    res2 = client.get("/api/health")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "healthy"
    assert data2["database"] == "connected"


def test_error_format_and_status_codes(client, staff_token):
    # 404 Not Found error format
    res404 = client.get(
        "/api/invoices/999999",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert res404.status_code == 404
    body404 = res404.json()
    assert body404["code"] == "NOT_FOUND"
    assert "message" in body404
    assert "detail" in body404  # backwards compatibility

    # 422 Validation error format
    res422 = client.post("/api/auth/login", json={"email": "invalid-email"})
    assert res422.status_code == 422
    body422 = res422.json()
    assert body422["code"] == "VALIDATION_ERROR"
    assert "message" in body422
    assert "field" in body422

