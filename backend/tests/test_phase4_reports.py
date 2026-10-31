from datetime import datetime, timezone, timedelta
import io
import csv
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.plan import Plan, BillingPeriod
from app.models.product import Product
from app.models.subscription import Subscription, SubscriptionLine, SubscriptionStatus
from app.models.invoice import Invoice, InvoiceStatus, Payment
from app.services.reporting_service import get_finance_metrics, get_overdue_invoices
from app.services.reminder_service import dispatch_overdue_reminders


def test_mrr_and_finance_metrics_calculation(db_session: Session):
    """
    Validates MRR exact rules from master prompt:
    yearly / 12, weekly x 52 / 12, daily x 365 / 12, monthly as 1x.
    """
    now = datetime.now(timezone.utc)
    cust = Customer(name="MRR Test Corp", company="MRR Co")
    db_session.add(cust)
    db_session.commit()

    p_daily = Plan(name="Daily Plan", price=100, billing_period="daily", currency="USD")
    p_weekly = Plan(name="Weekly Plan", price=1200, billing_period="weekly", currency="USD")
    p_monthly = Plan(name="Monthly Plan", price=5000, billing_period="monthly", currency="USD")
    p_yearly = Plan(name="Yearly Plan", price=120000, billing_period="yearly", currency="USD")
    db_session.add_all([p_daily, p_weekly, p_monthly, p_yearly])
    db_session.commit()

    # Active daily subscription ($100 * 365 / 12 = 3041.67 cents)
    sub_daily = Subscription(
        number="SUB-MRR-D", customer_id=cust.id, plan_id=p_daily.id,
        start_date=now, status="active"
    )
    # Active weekly subscription ($1200 * 52 / 12 = 5200 cents)
    sub_weekly = Subscription(
        number="SUB-MRR-W", customer_id=cust.id, plan_id=p_weekly.id,
        start_date=now, status="active"
    )
    # Active monthly subscription ($5000 cents)
    sub_monthly = Subscription(
        number="SUB-MRR-M", customer_id=cust.id, plan_id=p_monthly.id,
        start_date=now, status="active"
    )
    # Active yearly subscription ($120000 / 12 = 10000 cents)
    sub_yearly = Subscription(
        number="SUB-MRR-Y", customer_id=cust.id, plan_id=p_yearly.id,
        start_date=now, status="active"
    )
    # Closed subscription (must NOT count towards MRR or active count)
    sub_closed = Subscription(
        number="SUB-MRR-C", customer_id=cust.id, plan_id=p_monthly.id,
        start_date=now, status="closed"
    )
    db_session.add_all([sub_daily, sub_weekly, sub_monthly, sub_yearly, sub_closed])
    db_session.commit()

    metrics = get_finance_metrics(db_session)
    assert metrics["active_subscriptions_count"] == 4

    expected_mrr = int(round(
        (100.0 * 365.0 / 12.0) +
        (1200.0 * 52.0 / 12.0) +
        5000.0 +
        (120000.0 / 12.0)
    ))
    # 3042 + 5200 + 5000 + 10000 = 23242 cents
    assert abs(metrics["mrr"] - expected_mrr) <= 2


def test_overdue_invoices_and_reminders(db_session: Session, client: TestClient, admin_token: str):
    """
    Confirms overdue invoices are sorted by days overdue descending,
    and reminder job dispatches notifications.
    """
    now = datetime.now(timezone.utc)
    cust = Customer(name="Overdue Client", company="Overdue Ltd")
    db_session.add(cust)
    db_session.commit()

    # User linked to customer for email delivery
    user_cust = User(
        email="overdue.client@example.com",
        password_hash="Hash123!",
        role="customer",
        customer_id=cust.id,
    )
    db_session.add(user_cust)

    plan = Plan(name="Standard", price=5000, billing_period="monthly")
    db_session.add(plan)
    db_session.commit()

    sub = Subscription(number="SUB-OVERDUE", customer_id=cust.id, plan_id=plan.id, start_date=now, status="active")
    db_session.add(sub)
    db_session.commit()

    # 1. Invoice 30 days overdue
    inv1 = Invoice(
        number="INV-OD-30",
        subscription_id=sub.id,
        period_start=now - timedelta(days=90),
        period_end=now - timedelta(days=60),
        due_date=now - timedelta(days=30),
        status="confirmed",
        total=10000,
    )
    # 2. Invoice 10 days overdue
    inv2 = Invoice(
        number="INV-OD-10",
        subscription_id=sub.id,
        period_start=now - timedelta(days=60),
        period_end=now - timedelta(days=30),
        due_date=now - timedelta(days=10),
        status="confirmed",
        total=8000,
    )
    # 3. Invoice already paid (not overdue)
    inv_paid = Invoice(
        number="INV-PAID",
        subscription_id=sub.id,
        period_start=now - timedelta(days=30),
        period_end=now,
        due_date=now,
        status="paid",
        total=5000,
    )
    db_session.add_all([inv1, inv2, inv_paid])
    db_session.commit()

    # Add partial payment to inv1 ($20.00 of $100.00 paid -> $80.00 balance due)
    p1 = Payment(invoice_id=inv1.id, method="credit_card", amount=2000, paid_on=now)
    db_session.add(p1)
    db_session.commit()

    overdue_list = get_overdue_invoices(db_session)
    assert len(overdue_list) == 2
    # Earliest due date must be first (most days overdue)
    assert overdue_list[0]["number"] == "INV-OD-30"
    assert overdue_list[0]["days_overdue"] >= 29
    assert overdue_list[0]["balance_due"] == 8000  # 10000 - 2000

    assert overdue_list[1]["number"] == "INV-OD-10"
    assert overdue_list[1]["days_overdue"] >= 9
    assert overdue_list[1]["balance_due"] == 8000

    # Test reminder job execution
    reminder_result = dispatch_overdue_reminders(db_session)
    assert reminder_result["total_overdue"] == 2
    assert reminder_result["dispatched_count"] == 2

    # Test via admin API endpoint
    resp = client.post(
        "/api/reports/reminders/run-now",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 200
    assert "Dispatched" in resp.json()["message"]


def test_csv_export_endpoints(client: TestClient, admin_token: str, staff_token: str, customer_token: str):
    """
    Verifies CSV export for invoices, subscriptions, customers, and overdue.
    Confirms role security: admin and staff can export, customer is blocked.
    """
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_staff = {"Authorization": f"Bearer {staff_token}"}
    headers_customer = {"Authorization": f"Bearer {customer_token}"}

    # 1. Invoices CSV
    res_inv = client.get("/api/reports/export/invoices", headers=headers_admin)
    assert res_inv.status_code == 200
    assert res_inv.headers["content-type"].startswith("text/csv")
    assert "Invoice Number" in res_inv.text

    # 2. Subscriptions CSV
    res_sub = client.get("/api/reports/export/subscriptions", headers=headers_staff)
    assert res_sub.status_code == 200
    assert "Subscription Number" in res_sub.text

    # 3. Customers CSV
    res_cust = client.get("/api/reports/export/customers", headers=headers_admin)
    assert res_cust.status_code == 200
    assert "Customer ID" in res_cust.text

    # 4. Overdue CSV
    res_od = client.get("/api/reports/export/overdue", headers=headers_staff)
    assert res_od.status_code == 200
    assert "Days Overdue" in res_od.text

    # 5. Customer blocked
    res_blocked = client.get("/api/reports/export/invoices", headers=headers_customer)
    assert res_blocked.status_code == 403


def test_finance_dashboard_role_access(client: TestClient, admin_token: str, staff_token: str, customer_token: str):
    """
    Admin has full control, staff has read-only access, customer is 403 forbidden.
    """
    res_admin = client.get("/api/reports/finance", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert data_admin["is_admin"] is True
    assert "metrics" in data_admin
    assert "overdue_invoices" in data_admin

    res_staff = client.get("/api/reports/finance", headers={"Authorization": f"Bearer {staff_token}"})
    assert res_staff.status_code == 200
    assert res_staff.json()["is_admin"] is False

    res_cust = client.get("/api/reports/finance", headers={"Authorization": f"Bearer {customer_token}"})
    assert res_cust.status_code == 403


def test_rate_limiting_on_auth_routes(client: TestClient):
    """
    Verifies rate limiting protects login against brute force attacks.
    Rapid repeated requests eventually trigger 429 Too Many Requests.
    """
    triggered_429 = False
    for _ in range(25):
        res = client.post("/api/auth/login", json={"email": "attacker@example.com", "password": "WrongPassword1!"})
        if res.status_code == 429:
            triggered_429 = True
            break

    assert triggered_429 is True


def test_sse_endpoint_connection(client: TestClient):
    """
    Verifies GET /api/events establishes text/event-stream connection.
    """
    with client.stream("GET", "/api/events") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        # Read the first event chunk
        for chunk in response.iter_lines():
            if chunk.startswith("event: connected"):
                break

