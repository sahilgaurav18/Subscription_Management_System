import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from sqlalchemy.orm import sessionmaker

from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.plan import Plan, BillingPeriod
from app.models.tax import Tax
from app.models.discount import Discount, DiscountType, DiscountScope
from app.models.subscription import Subscription, SubscriptionLine, SubscriptionStatus
from app.models.invoice import Invoice, InvoiceStatus, Payment
from app.services.billing_service import (
    run_billing_engine,
    process_subscription_billing,
    compute_next_billing_date,
)


@pytest.fixture
def billing_fixtures(db_session):
    # Customer
    customer = Customer(
        name="Billing Test Corp",
        company="Billing Corp Inc",
        billing_address="123 Invoice Way",
        tax_id="US-TAX-9988",
    )
    db_session.add(customer)
    db_session.flush()

    # Plan
    plan = Plan(
        name="Daily SaaS Plan",
        price=5000,
        billing_period=BillingPeriod.DAILY.value,
        auto_close=True,
        pausable=True,
        closable=True,
        renewable=True,
    )
    db_session.add(plan)
    db_session.flush()

    # Products & Taxes
    tax10 = Tax(name="Tax 10%", rate_percent=10.0)
    tax15 = Tax(name="Tax 15%", rate_percent=15.0)
    db_session.add_all([tax10, tax15])
    db_session.flush()

    prod1 = Product(name="API Core", type="service", sales_price=1050, cost_price=500)
    prod2 = Product(name="Addon Pro", type="service", sales_price=2025, cost_price=1000)
    db_session.add_all([prod1, prod2])
    db_session.flush()

    return {
        "customer": customer,
        "plan": plan,
        "tax10": tax10,
        "tax15": tax15,
        "prod1": prod1,
        "prod2": prod2,
    }


def test_job_twice_creates_one_invoice(client, db_session, admin_token, billing_fixtures):
    now = datetime.now(timezone.utc)
    sub = Subscription(
        number="SUB-BILL-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,
        start_date=now - timedelta(days=2),
        next_invoice_date=now - timedelta(days=1),
        payment_terms="net_15",
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.flush()

    line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=billing_fixtures["prod1"].id,
        quantity=1,
        unit_price=1050,
        amount=1050,
        tax_id=billing_fixtures["tax10"].id,
    )
    db_session.add(line)
    db_session.commit()

    # First billing run: creates invoice for that period
    run1 = run_billing_engine(db_session, triggered_by="test_run_1")
    assert run1.created_count >= 1

    invoices_after_run1 = db_session.query(Invoice).filter(Invoice.subscription_id == sub.id).all()
    assert len(invoices_after_run1) >= 1
    period_start_first = invoices_after_run1[0].period_start

    # Now intentionally reset next_invoice_date to the same period_start to simulate re-running
    sub.next_invoice_date = period_start_first
    db_session.commit()

    # Second billing run on the same period
    run2 = run_billing_engine(db_session, triggered_by="test_run_2")
    
    # Assert unique constraint / idempotency prevented creating duplicate invoice for that period
    invoices_for_period = db_session.query(Invoice).filter(
        Invoice.subscription_id == sub.id,
        Invoice.period_start == period_start_first
    ).all()
    assert len(invoices_for_period) == 1, "Expected exactly 1 invoice for the same period_start due to unique constraint"


def test_job_down_for_3_periods_creates_3_invoices(db_session, billing_fixtures):
    now = datetime.now(timezone.utc)
    # Subscription was unbilled for 3 daily periods
    sub = Subscription(
        number="SUB-CATCHUP-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,
        start_date=now - timedelta(days=5),
        next_invoice_date=now - timedelta(days=3),
        payment_terms="net_15",
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.flush()

    line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=billing_fixtures["prod1"].id,
        quantity=2,
        unit_price=1000,
        amount=2000,
        tax_id=billing_fixtures["tax10"].id,
    )
    db_session.add(line)
    db_session.commit()

    # Run billing engine: catch-up loop should bill day -3, day -2, day -1
    run = run_billing_engine(db_session, triggered_by="test_catchup")
    
    invoices = db_session.query(Invoice).filter(Invoice.subscription_id == sub.id).order_by(Invoice.period_start.asc()).all()
    assert len(invoices) >= 3, f"Expected at least 3 catch-up invoices, got {len(invoices)}"

    # Check next_invoice_date has been advanced past or up to current time
    db_session.refresh(sub)
    sub_next = sub.next_invoice_date.replace(tzinfo=timezone.utc) if sub.next_invoice_date.tzinfo is None else sub.next_invoice_date
    assert sub_next > now - timedelta(days=1)


def test_failure_rolls_back_both_invoice_and_date(db_session, billing_fixtures):
    now = datetime.now(timezone.utc)
    initial_date = now - timedelta(days=1)
    
    sub = Subscription(
        number="SUB-ROLLBACK-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,
        start_date=now - timedelta(days=2),
        next_invoice_date=initial_date,
        payment_terms="net_15",
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.flush()

    line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=billing_fixtures["prod1"].id,
        quantity=1,
        unit_price=1000,
        amount=1000,
    )
    db_session.add(line)
    db_session.commit()

    # Mock build_invoice_for_period to raise an unexpected runtime error
    sf = sessionmaker(autocommit=False, autoflush=False, bind=db_session.get_bind())
    with patch("app.services.billing_service.build_invoice_for_period", side_effect=RuntimeError("Simulated DB Disk Crash")):
        with pytest.raises(RuntimeError):
            process_subscription_billing(sub.id, now, session_factory=sf)

    # Verify rollback: no invoice committed, and next_invoice_date was not updated
    db_session.refresh(sub)
    invoices = db_session.query(Invoice).filter(Invoice.subscription_id == sub.id).all()
    assert len(invoices) == 0, "Invoice should not have been committed on failure"

    sub_next = sub.next_invoice_date.replace(tzinfo=timezone.utc) if sub.next_invoice_date.tzinfo is None else sub.next_invoice_date
    init_utc = initial_date.replace(tzinfo=timezone.utc) if initial_date.tzinfo is None else initial_date
    assert sub_next == init_utc, "next_invoice_date should be rolled back to initial date on failure"


def test_discount_applies_and_respects_usage_limit_and_expiry(db_session, billing_fixtures):
    now = datetime.now(timezone.utc)

    # 1. Discount with usage_limit = 1
    discount = Discount(
        name="Limited $5 Discount",
        type=DiscountType.FIXED.value,
        value=500,  # $5.00 in minor units
        min_purchase=1000,
        usage_limit=1,
        times_used=0,
        scope=DiscountScope.SUBSCRIPTION.value,
    )
    db_session.add(discount)
    db_session.flush()

    sub = Subscription(
        number="SUB-DISC-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,
        start_date=now - timedelta(days=3),
        next_invoice_date=now - timedelta(days=2),
        payment_terms="net_15",
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.flush()

    line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=billing_fixtures["prod1"].id,
        quantity=2,
        unit_price=1000,
        amount=2000,
    )
    db_session.add(line)
    db_session.commit()

    # Process first period billing
    sf = sessionmaker(autocommit=False, autoflush=False, bind=db_session.get_bind())
    process_subscription_billing(sub.id, now, session_factory=sf)

    # Check first invoice has discount applied
    first_invoice = db_session.query(Invoice).filter(Invoice.subscription_id == sub.id).order_by(Invoice.id.asc()).first()
    assert first_invoice is not None
    assert first_invoice.discount_total == 500
    assert first_invoice.subtotal == 2000
    assert first_invoice.total == 1500

    # Discount times_used incremented to 1 (which meets usage_limit=1)
    db_session.refresh(discount)
    assert discount.times_used == 1

    # Invoices created after usage limit reached should have 0 discount
    invoices = db_session.query(Invoice).filter(Invoice.subscription_id == sub.id).order_by(Invoice.id.asc()).all()
    if len(invoices) > 1:
        second_invoice = invoices[1]
        assert second_invoice.discount_total == 0

    # Test expired discount is ignored
    expired_discount = Discount(
        name="Expired Discount",
        type=DiscountType.PERCENT.value,
        value=50,
        end_date=now - timedelta(days=1),
        scope=DiscountScope.SUBSCRIPTION.value,
    )
    db_session.add(expired_discount)
    db_session.commit()

    # Advance subscription and bill again
    sub.next_invoice_date = now - timedelta(hours=1)
    db_session.commit()
    process_subscription_billing(sub.id, now, session_factory=sf)

    latest_invoice = db_session.query(Invoice).filter(Invoice.subscription_id == sub.id).order_by(Invoice.id.desc()).first()
    assert latest_invoice.discount_total == 0, "Expired discount must not be applied"


def test_mixed_tax_rates_round_correctly(db_session, billing_fixtures):
    """
    Line 1: 1050 cents @ 10% tax -> round(1050 * 0.10) = 105 cents
    Line 2: 2025 cents @ 15% tax -> round(2025 * 0.15) = round(303.75) = 304 cents
    Invoice tax_total: 105 + 304 = 409 cents
    Subtotal: 1050 + 2025 = 3075 cents
    Total: 3075 + 409 = 3484 cents
    """
    now = datetime.now(timezone.utc)
    sub = Subscription(
        number="SUB-TAX-MIX-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,
        start_date=now - timedelta(days=2),
        next_invoice_date=now - timedelta(days=1),
        payment_terms="net_15",
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.flush()

    line1 = SubscriptionLine(
        subscription_id=sub.id,
        product_id=billing_fixtures["prod1"].id,
        quantity=1,
        unit_price=1050,
        amount=1050,
        tax_id=billing_fixtures["tax10"].id,
    )
    line2 = SubscriptionLine(
        subscription_id=sub.id,
        product_id=billing_fixtures["prod2"].id,
        quantity=1,
        unit_price=2025,
        amount=2025,
        tax_id=billing_fixtures["tax15"].id,
    )
    db_session.add_all([line1, line2])
    db_session.commit()

    sf = sessionmaker(autocommit=False, autoflush=False, bind=db_session.get_bind())
    process_subscription_billing(sub.id, now, session_factory=sf)

    invoice = db_session.query(Invoice).filter(Invoice.subscription_id == sub.id).first()
    assert invoice is not None
    assert invoice.subtotal == 3075
    assert invoice.tax_total == 409
    assert invoice.total == 3484

    # Verify each line's tax_amount snapshot
    lines = invoice.lines
    tax_amounts = sorted([l.tax_amount for l in lines])
    assert tax_amounts == [105, 304]


def test_partial_payment_keeps_confirmed_full_payment_marks_paid(client, staff_token, db_session, billing_fixtures):
    now = datetime.now(timezone.utc)
    sub = Subscription(
        number="SUB-PAY-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,
        start_date=now,
        payment_terms="net_15",
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.flush()

    # Invoice with total = $100.00 (10000 cents)
    invoice = Invoice(
        number="INV-PAY-001",
        subscription_id=sub.id,
        period_start=now,
        period_end=now + timedelta(days=30),
        status=InvoiceStatus.DRAFT.value,
        subtotal=10000,
        discount_total=0,
        tax_total=0,
        total=10000,
        due_date=now + timedelta(days=15),
    )
    db_session.add(invoice)
    db_session.commit()

    # 1. Confirm invoice
    conf_res = client.post(
        f"/api/invoices/{invoice.id}/confirm",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "confirmed"

    # 2. Record partial payment of $40.00 (4000 cents)
    part_res = client.post(
        f"/api/invoices/{invoice.id}/payments",
        json={
            "method": "credit_card",
            "amount": 4000,
            "note": "Partial initial deposit",
        },
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert part_res.status_code == 200
    data = part_res.json()
    assert data["status"] == "confirmed", "Partial payment must keep invoice in confirmed status"
    assert data["amount_paid"] == 4000
    assert data["balance_due"] == 6000

    # 3. Record remaining payment of $60.00 (6000 cents)
    full_res = client.post(
        f"/api/invoices/{invoice.id}/payments",
        json={
            "method": "bank_transfer",
            "amount": 6000,
            "note": "Final settlement",
        },
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert full_res.status_code == 200
    full_data = full_res.json()
    assert full_data["status"] == "paid", "Full payment must mark invoice as paid"
    assert full_data["amount_paid"] == 10000
    assert full_data["balance_due"] == 0


def test_overpayment_refused(client, staff_token, db_session, billing_fixtures):
    now = datetime.now(timezone.utc)
    sub = Subscription(
        number="SUB-OVERPAY-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,
        start_date=now,
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.flush()

    invoice = Invoice(
        number="INV-OVERPAY-001",
        subscription_id=sub.id,
        period_start=now,
        period_end=now + timedelta(days=30),
        status=InvoiceStatus.CONFIRMED.value,
        subtotal=5000,
        discount_total=0,
        tax_total=0,
        total=5000,  # $50.00
        due_date=now + timedelta(days=15),
    )
    db_session.add(invoice)
    db_session.commit()

    # Attempt to pay $60.00 (6000 cents) against $50.00 balance
    overpay_res = client.post(
        f"/api/invoices/{invoice.id}/payments",
        json={
            "method": "credit_card",
            "amount": 6000,
            "note": "Attempted overpayment",
        },
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert overpay_res.status_code == 400
    assert "exceeds balance due" in overpay_res.json()["detail"].lower()


def test_auto_close_subscription_at_expiry(db_session, billing_fixtures):
    now = datetime.now(timezone.utc)

    # Subscription with expiry in the past and plan.auto_close=True
    sub = Subscription(
        number="SUB-AUTOCLOSE-001",
        customer_id=billing_fixtures["customer"].id,
        plan_id=billing_fixtures["plan"].id,  # plan.auto_close is True
        start_date=now - timedelta(days=30),
        expiry_date=now - timedelta(hours=2),
        next_invoice_date=now - timedelta(hours=1),
        status=SubscriptionStatus.ACTIVE.value,
    )
    db_session.add(sub)
    db_session.commit()

    run_billing_engine(db_session, triggered_by="test_autoclose")

    db_session.refresh(sub)
    assert sub.status == SubscriptionStatus.CLOSED.value, "Active subscription past expiry must auto-close when plan has auto_close"
