import logging
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.invoice import Invoice, InvoiceStatus, Payment
from app.models.subscription import Subscription
from app.models.customer import Customer
from app.models.user import User
from app.services.email_service import send_overdue_reminder_email
from app.services.reporting_service import ensure_utc

logger = logging.getLogger("brightloop.reminders")


def dispatch_overdue_reminders(db: Session) -> Dict[str, Any]:
    """
    Daily background task:
    Identifies all CONFIRMED invoices where due_date < now and balance_due > 0,
    and dispatches overdue reminder emails to the corresponding customer accounts.
    """
    now_utc = datetime.now(timezone.utc)

    # Subquery for recorded payments
    payment_sub = (
        db.query(
            Payment.invoice_id,
            func.coalesce(func.sum(Payment.amount), 0).label("paid_sum")
        )
        .group_by(Payment.invoice_id)
        .subquery()
    )

    query = (
        db.query(
            Invoice,
            func.coalesce(payment_sub.c.paid_sum, 0).label("amount_paid"),
            Customer,
        )
        .select_from(Invoice)
        .join(Subscription, Subscription.id == Invoice.subscription_id)
        .join(Customer, Customer.id == Subscription.customer_id)
        .outerjoin(payment_sub, payment_sub.c.invoice_id == Invoice.id)
        .filter(Invoice.status == InvoiceStatus.CONFIRMED.value)
        .filter(Invoice.due_date < now_utc)
        .filter(Invoice.total > func.coalesce(payment_sub.c.paid_sum, 0))
    )

    overdue_invoices = query.all()
    dispatched_count = 0
    failures_count = 0

    for inv, paid, cust in overdue_invoices:
        balance_due = max(0, inv.total - paid)
        due_utc = ensure_utc(inv.due_date)
        days_overdue = max(0, (now_utc.date() - due_utc.date()).days) if due_utc else 0

        # Find registered customer user email
        cust_user = db.query(User).filter(User.customer_id == cust.id).first()
        to_email = cust_user.email if cust_user else "customer@brightloop.io"
        due_date_str = due_utc.strftime("%b %d, %Y") if due_utc else "Due"

        success = send_overdue_reminder_email(
            to_email=to_email,
            invoice_number=inv.number,
            customer_name=cust.name,
            amount_due_formatted=f"${balance_due / 100:.2f}",
            days_overdue=days_overdue,
            due_date_formatted=due_date_str,
        )
        if success:
            dispatched_count += 1
        else:
            failures_count += 1

    logger.info(
        f"Overdue reminder run complete: {dispatched_count} dispatched, {failures_count} failures."
    )
    return {
        "total_overdue": len(overdue_invoices),
        "dispatched_count": dispatched_count,
        "failures_count": failures_count,
    }

