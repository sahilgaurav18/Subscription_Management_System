from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import csv
import io
from sqlalchemy.orm import Session
from sqlalchemy import func, case, select, and_, or_, text

from app.models.subscription import Subscription, SubscriptionLine, SubscriptionStatus
from app.models.plan import Plan, BillingPeriod
from app.models.invoice import Invoice, InvoiceLine, InvoiceStatus, Payment
from app.models.customer import Customer
from app.models.user import User


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def get_finance_metrics(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    customer_id: Optional[int] = None,
    plan_id: Optional[int] = None,
    status_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Computes platform finance metrics using SQL aggregates:
    - active_subscriptions_count
    - total_revenue_received (sum of payments)
    - amount_still_owed (unpaid balance on confirmed invoices)
    - mrr (Monthly Recurring Revenue with yearly/12, weekly*52/12, daily*365/12)
    - revenue_by_month (payments aggregated by month)
    """
    now_utc = datetime.now(timezone.utc)

    # 1. Active Subscriptions Count (with optional filters)
    sub_count_q = db.query(func.count(Subscription.id)).filter(
        Subscription.status == (status_filter if status_filter else SubscriptionStatus.ACTIVE.value)
    )
    if customer_id:
        sub_count_q = sub_count_q.filter(Subscription.customer_id == customer_id)
    if plan_id:
        sub_count_q = sub_count_q.filter(Subscription.plan_id == plan_id)
    if start_date:
        sub_count_q = sub_count_q.filter(Subscription.start_date >= start_date)
    if end_date:
        sub_count_q = sub_count_q.filter(Subscription.start_date <= end_date)
    active_subscriptions_count = sub_count_q.scalar() or 0

    # 2. Revenue Received (Sum of Payments)
    # Join invoices and subscriptions to apply filters
    pay_q = db.query(func.coalesce(func.sum(Payment.amount), 0)).select_from(Payment)
    pay_q = pay_q.join(Invoice, Invoice.id == Payment.invoice_id)
    pay_q = pay_q.join(Subscription, Subscription.id == Invoice.subscription_id)

    if customer_id:
        pay_q = pay_q.filter(Subscription.customer_id == customer_id)
    if plan_id:
        pay_q = pay_q.filter(Subscription.plan_id == plan_id)
    if start_date:
        pay_q = pay_q.filter(Payment.paid_on >= start_date)
    if end_date:
        pay_q = pay_q.filter(Payment.paid_on <= end_date)
    total_revenue_received = int(pay_q.scalar() or 0)

    # 3. Amount Still Owed (Unpaid balance on confirmed invoices)
    # Using SQL subquery: inv.total - sum(p.amount)
    payment_sub = (
        db.query(
            Payment.invoice_id,
            func.coalesce(func.sum(Payment.amount), 0).label("paid_sum")
        )
        .group_by(Payment.invoice_id)
        .subquery()
    )

    owed_q = db.query(
        func.coalesce(
            func.sum(Invoice.total - func.coalesce(payment_sub.c.paid_sum, 0)),
            0
        )
    ).select_from(Invoice)
    owed_q = owed_q.outerjoin(payment_sub, payment_sub.c.invoice_id == Invoice.id)
    owed_q = owed_q.join(Subscription, Subscription.id == Invoice.subscription_id)
    owed_q = owed_q.filter(Invoice.status == InvoiceStatus.CONFIRMED.value)
    owed_q = owed_q.filter(Invoice.total > func.coalesce(payment_sub.c.paid_sum, 0))

    if customer_id:
        owed_q = owed_q.filter(Subscription.customer_id == customer_id)
    if plan_id:
        owed_q = owed_q.filter(Subscription.plan_id == plan_id)
    if start_date:
        owed_q = owed_q.filter(Invoice.period_start >= start_date)
    if end_date:
        owed_q = owed_q.filter(Invoice.period_start <= end_date)
    amount_still_owed = int(owed_q.scalar() or 0)

    # 4. MRR: yearly / 12, weekly * 52 / 12, daily * 365 / 12, monthly
    # Calculate for all active subscriptions
    sub_line_sum = (
        db.query(
            SubscriptionLine.subscription_id,
            func.coalesce(func.sum(SubscriptionLine.amount), 0).label("line_total")
        )
        .group_by(SubscriptionLine.subscription_id)
        .subquery()
    )

    mrr_subquery = (
        db.query(
            Subscription.id,
            Plan.billing_period,
            case(
                (func.coalesce(sub_line_sum.c.line_total, 0) > 0, sub_line_sum.c.line_total),
                else_=Plan.price
            ).label("sub_amount")
        )
        .select_from(Subscription)
        .join(Plan, Plan.id == Subscription.plan_id)
        .outerjoin(sub_line_sum, sub_line_sum.c.subscription_id == Subscription.id)
        .filter(Subscription.status == SubscriptionStatus.ACTIVE.value)
    )

    if customer_id:
        mrr_subquery = mrr_subquery.filter(Subscription.customer_id == customer_id)
    if plan_id:
        mrr_subquery = mrr_subquery.filter(Subscription.plan_id == plan_id)

    mrr_sub = mrr_subquery.subquery()

    mrr_q = db.query(
        func.coalesce(
            func.sum(
                case(
                    (mrr_sub.c.billing_period == "yearly", mrr_sub.c.sub_amount / 12.0),
                    (mrr_sub.c.billing_period == "weekly", mrr_sub.c.sub_amount * 52.0 / 12.0),
                    (mrr_sub.c.billing_period == "daily", mrr_sub.c.sub_amount * 365.0 / 12.0),
                    else_=mrr_sub.c.sub_amount
                )
            ),
            0.0
        )
    ).select_from(mrr_sub)
    mrr_cents = int(round(mrr_q.scalar() or 0))

    # 5. Revenue By Month (grouped by YYYY-MM)
    is_postgres = (db.bind.dialect.name == "postgresql") if db.bind else False
    if is_postgres:
        month_expr = func.to_char(Payment.paid_on, "YYYY-MM")
    else:
        month_expr = func.strftime("%Y-%m", Payment.paid_on)

    monthly_q = db.query(
        month_expr.label("month"),
        func.coalesce(func.sum(Payment.amount), 0).label("revenue")
    ).select_from(Payment)
    monthly_q = monthly_q.join(Invoice, Invoice.id == Payment.invoice_id)
    monthly_q = monthly_q.join(Subscription, Subscription.id == Invoice.subscription_id)

    if customer_id:
        monthly_q = monthly_q.filter(Subscription.customer_id == customer_id)
    if plan_id:
        monthly_q = monthly_q.filter(Subscription.plan_id == plan_id)
    if start_date:
        monthly_q = monthly_q.filter(Payment.paid_on >= start_date)
    if end_date:
        monthly_q = monthly_q.filter(Payment.paid_on <= end_date)

    monthly_q = monthly_q.group_by(month_expr).order_by(month_expr.asc())
    revenue_by_month = [
        {"month": row.month or "Unknown", "revenue": int(row.revenue)}
        for row in monthly_q.all()
    ]

    return {
        "active_subscriptions_count": active_subscriptions_count,
        "revenue_received": total_revenue_received,
        "amount_still_owed": amount_still_owed,
        "mrr": mrr_cents,
        "revenue_by_month": revenue_by_month,
    }


def get_overdue_invoices(
    db: Session,
    customer_id: Optional[int] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Returns list of overdue invoices where status is confirmed, due_date < now,
    and balance due > 0, sorted by days overdue descending (earliest due_date first).
    """
    now_utc = datetime.now(timezone.utc)

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
            Customer.name.label("customer_name"),
            Subscription.number.label("subscription_number"),
        )
        .select_from(Invoice)
        .join(Subscription, Subscription.id == Invoice.subscription_id)
        .join(Customer, Customer.id == Subscription.customer_id)
        .outerjoin(payment_sub, payment_sub.c.invoice_id == Invoice.id)
        .filter(Invoice.status == InvoiceStatus.CONFIRMED.value)
        .filter(Invoice.due_date < now_utc)
        .filter(Invoice.total > func.coalesce(payment_sub.c.paid_sum, 0))
    )

    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)

    # Earliest due date = longest overdue
    query = query.order_by(Invoice.due_date.asc()).limit(limit)

    results = []
    for inv, paid, cust_name, sub_num in query.all():
        due_utc = ensure_utc(inv.due_date)
        days_overdue = max(0, (now_utc.date() - due_utc.date()).days) if due_utc else 0
        balance_due = max(0, inv.total - paid)

        results.append({
            "id": inv.id,
            "number": inv.number,
            "customer_id": inv.subscription.customer_id if inv.subscription else None,
            "customer_name": cust_name,
            "subscription_number": sub_num,
            "due_date": inv.due_date.isoformat(),
            "period_start": inv.period_start.isoformat(),
            "period_end": inv.period_end.isoformat(),
            "total": inv.total,
            "amount_paid": paid,
            "balance_due": balance_due,
            "days_overdue": days_overdue,
            "status": inv.status,
        })

    return results


def export_invoices_csv(db: Session, customer_id: Optional[int] = None) -> str:
    """Exports all invoices as RFC 4180 CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Invoice Number",
        "Customer",
        "Subscription",
        "Period Start",
        "Period End",
        "Due Date",
        "Status",
        "Subtotal ($)",
        "Tax ($)",
        "Discount ($)",
        "Total ($)",
        "Amount Paid ($)",
        "Balance Due ($)",
    ])

    query = db.query(Invoice).join(Subscription).order_by(Invoice.id.desc())
    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)

    for inv in query.all():
        cust_name = inv.subscription.customer.name if inv.subscription and inv.subscription.customer else "N/A"
        sub_num = inv.subscription.number if inv.subscription else "N/A"
        paid = sum(p.amount for p in inv.payments)
        balance = max(0, inv.total - paid)

        writer.writerow([
            inv.number,
            cust_name,
            sub_num,
            inv.period_start.strftime("%Y-%m-%d") if inv.period_start else "",
            inv.period_end.strftime("%Y-%m-%d") if inv.period_end else "",
            inv.due_date.strftime("%Y-%m-%d") if inv.due_date else "",
            inv.status,
            f"{inv.subtotal / 100:.2f}",
            f"{inv.tax_total / 100:.2f}",
            f"{inv.discount_total / 100:.2f}",
            f"{inv.total / 100:.2f}",
            f"{paid / 100:.2f}",
            f"{balance / 100:.2f}",
        ])

    return output.getvalue()


def export_subscriptions_csv(db: Session, customer_id: Optional[int] = None) -> str:
    """Exports all subscriptions as RFC 4180 CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Subscription Number",
        "Customer",
        "Plan",
        "Billing Period",
        "Status",
        "Start Date",
        "Expiry Date",
        "Next Invoice Date",
        "Payment Terms",
        "Total Recurring Commitment ($)",
    ])

    query = db.query(Subscription).order_by(Subscription.id.desc())
    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)

    for sub in query.all():
        cust_name = sub.customer.name if sub.customer else "N/A"
        plan_name = sub.plan.name if sub.plan else "N/A"
        period = sub.plan.billing_period if sub.plan else "N/A"
        recurring = sum(l.amount for l in sub.lines)

        writer.writerow([
            sub.number,
            cust_name,
            plan_name,
            period,
            sub.status,
            sub.start_date.strftime("%Y-%m-%d") if sub.start_date else "",
            sub.expiry_date.strftime("%Y-%m-%d") if sub.expiry_date else "",
            sub.next_invoice_date.strftime("%Y-%m-%d") if sub.next_invoice_date else "",
            sub.payment_terms,
            f"{recurring / 100:.2f}",
        ])

    return output.getvalue()


def export_overdue_csv(db: Session, customer_id: Optional[int] = None) -> str:
    """Exports overdue invoices as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Invoice Number",
        "Customer",
        "Subscription",
        "Due Date",
        "Days Overdue",
        "Grand Total ($)",
        "Amount Paid ($)",
        "Balance Due ($)",
    ])

    overdue_items = get_overdue_invoices(db, customer_id=customer_id, limit=1000)
    for item in overdue_items:
        writer.writerow([
            item["number"],
            item["customer_name"],
            item["subscription_number"],
            item["due_date"][:10],
            item["days_overdue"],
            f"{item['total'] / 100:.2f}",
            f"{item['amount_paid'] / 100:.2f}",
            f"{item['balance_due'] / 100:.2f}",
        ])

    return output.getvalue()


def export_customers_csv(db: Session) -> str:
    """Exports customers list as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Customer ID",
        "Name",
        "Company",
        "Tax ID",
        "Billing Address",
        "Created Date",
    ])

    customers = db.query(Customer).order_by(Customer.id.asc()).all()
    for c in customers:
        writer.writerow([
            c.id,
            c.name,
            c.company or "",
            c.tax_id or "",
            c.billing_address or "",
            c.created_at.strftime("%Y-%m-%d") if c.created_at else "",
        ])

    return output.getvalue()

