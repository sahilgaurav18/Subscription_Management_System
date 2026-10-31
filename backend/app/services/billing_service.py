import logging
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import func, or_, text

from app.database import SessionLocal
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.plan import Plan, BillingPeriod
from app.models.invoice import Invoice, InvoiceLine, InvoiceStatus
from app.models.discount import Discount, DiscountType, DiscountScope, DiscountProduct, DiscountSubscription
from app.models.tax import Tax
from app.models.billing_run import BillingRun
from app.services.audit_service import log_audit_event
from app.services.discount_strategies import DiscountStrategyContext
from app.services.sse_service import notify_system_event

logger = logging.getLogger("brightloop.billing")


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def compute_next_billing_date(start_date: datetime, period: str) -> datetime:
    start = ensure_utc(start_date)
    period_lower = period.lower()
    if period_lower == BillingPeriod.DAILY.value:
        return start + timedelta(days=1)
    elif period_lower == BillingPeriod.WEEKLY.value:
        return start + timedelta(weeks=1)
    elif period_lower == BillingPeriod.MONTHLY.value:
        year = start.year + ((start.month) // 12)
        month = ((start.month) % 12) + 1
        day = min(start.day, 28)
        return start.replace(year=year, month=month, day=day)
    elif period_lower == BillingPeriod.YEARLY.value:
        try:
            return start.replace(year=start.year + 1)
        except ValueError:
            return start.replace(year=start.year + 1, day=28)
    return start + timedelta(days=30)


def calculate_due_date(period_start: datetime, payment_terms: Optional[str]) -> datetime:
    start = ensure_utc(period_start)
    if not payment_terms:
        return start + timedelta(days=15)
    
    terms = payment_terms.strip().lower()
    if terms in ("immediate", "due_on_receipt", "net_0"):
        return start
    elif terms in ("net_15", "15_days", "15"):
        return start + timedelta(days=15)
    elif terms in ("net_30", "30_days", "30"):
        return start + timedelta(days=30)
    elif terms in ("net_60", "60_days", "60"):
        return start + timedelta(days=60)
    
    return start + timedelta(days=15)


def generate_invoice_number(db: Session) -> str:
    # Atomic sequential invoice number generator: INV-000001
    last_invoice = db.query(Invoice).order_by(Invoice.id.desc()).first()
    next_id = (last_invoice.id + 1) if last_invoice else 1
    return f"INV-{next_id:06d}"


def evaluate_eligible_discounts(
    db: Session,
    subscription: Subscription,
    line_items: List[Dict[str, Any]],
    subtotal: int,
    total_qty: int,
    now_utc: datetime,
) -> Tuple[Optional[Discount], int]:
    """
    Finds the eligible discount giving the highest saving (no stacking).
    Checks dates, times_used < usage_limit, minimum purchase/quantity, and product/subscription targets.
    Returns: (best_discount, best_saving_minor_units)
    """
    discounts = db.query(Discount).all()
    best_discount: Optional[Discount] = None
    best_saving: int = 0

    for discount in discounts:
        # 1. Date window check
        if discount.start_date:
            d_start = ensure_utc(discount.start_date)
            if now_utc < d_start:
                continue
        if discount.end_date:
            d_end = ensure_utc(discount.end_date)
            if now_utc > d_end:
                continue

        # 2. Usage limit check
        if discount.usage_limit is not None and discount.usage_limit > 0:
            if discount.times_used >= discount.usage_limit:
                continue

        # 3. Scope evaluation
        if discount.scope == DiscountScope.SUBSCRIPTION.value:
            # Check target subscription links if any exist
            if discount.subscription_links:
                is_targeted = any(link.subscription_id == subscription.id for link in discount.subscription_links)
                if not is_targeted:
                    continue

            # Minimum purchase & quantity checks
            if subtotal < discount.min_purchase or total_qty < discount.min_quantity:
                continue

            # Calculate saving using Strategy Pattern
            strategy = DiscountStrategyContext.get_strategy(discount.type)
            saving = strategy.calculate_saving(amount=subtotal, value=discount.value)

            if saving > best_saving:
                best_saving = saving
                best_discount = discount

        elif discount.scope == DiscountScope.PRODUCT.value:
            # Product scope: discount applies only to targeted product lines
            targeted_prod_ids = {link.product_id for link in discount.product_links}
            matching_lines = [item for item in line_items if not targeted_prod_ids or item["product_id"] in targeted_prod_ids]
            
            if not matching_lines:
                continue

            matching_subtotal = sum(item["amount"] for item in matching_lines)
            matching_qty = sum(item["quantity"] for item in matching_lines)

            if matching_subtotal < discount.min_purchase or matching_qty < discount.min_quantity:
                continue

            # Calculate saving using Strategy Pattern
            strategy = DiscountStrategyContext.get_strategy(discount.type)
            saving = strategy.calculate_saving(amount=matching_subtotal, value=discount.value)

            if saving > best_saving:
                best_saving = saving
                best_discount = discount

    return best_discount, best_saving


def build_invoice_for_period(
    db: Session,
    subscription: Subscription,
    period_start: datetime,
    period_end: datetime,
    now_utc: datetime,
) -> Invoice:
    # 1. Prepare line items
    line_items: List[Dict[str, Any]] = []
    subtotal = 0
    total_qty = 0

    for sub_line in subscription.lines:
        line_desc = sub_line.product.name
        if sub_line.variant:
            line_desc += f" ({sub_line.variant.attribute}: {sub_line.variant.value})"
        
        line_amount = sub_line.unit_price * sub_line.quantity
        subtotal += line_amount
        total_qty += sub_line.quantity

        line_items.append({
            "product_id": sub_line.product_id,
            "variant_id": sub_line.variant_id,
            "description": line_desc,
            "quantity": sub_line.quantity,
            "unit_price": sub_line.unit_price,
            "amount": line_amount,
            "tax_rate": float(sub_line.tax.rate_percent) if sub_line.tax else 0.0,
            "line_discount": 0,
            "tax_amount": 0,
        })

    # 2. Evaluate best discount
    best_discount, discount_total = evaluate_eligible_discounts(
        db=db,
        subscription=subscription,
        line_items=line_items,
        subtotal=subtotal,
        total_qty=total_qty,
        now_utc=now_utc,
    )

    if best_discount and discount_total > 0:
        # Increment times_used in the same transaction
        best_discount.times_used += 1

        # Allocate discount to lines for line-level tax calculation
        if best_discount.scope == DiscountScope.PRODUCT.value and best_discount.product_links:
            targeted_prod_ids = {link.product_id for link in best_discount.product_links}
            matching = [it for it in line_items if it["product_id"] in targeted_prod_ids]
            m_sum = sum(it["amount"] for it in matching)
            accumulated = 0
            for i, it in enumerate(matching):
                if i == len(matching) - 1:
                    d = discount_total - accumulated
                else:
                    d = int(round(discount_total * (it["amount"] / m_sum))) if m_sum > 0 else 0
                    accumulated += d
                it["line_discount"] = d
        else:
            # Proportionally distribute across all lines
            accumulated = 0
            for i, it in enumerate(line_items):
                if i == len(line_items) - 1:
                    d = discount_total - accumulated
                else:
                    d = int(round(discount_total * (it["amount"] / subtotal))) if subtotal > 0 else 0
                    accumulated += d
                it["line_discount"] = d
    else:
        discount_total = 0

    # 3. Tax per line = (line amount after discount) x rate, rounded once per line to minor units
    tax_total = 0
    invoice_lines_db: List[InvoiceLine] = []

    for it in line_items:
        net_line_amount = max(0, it["amount"] - it["line_discount"])
        # Round tax once per line to integer minor units
        line_tax = int(round(net_line_amount * (it["tax_rate"] / 100.0)))
        tax_total += line_tax

        invoice_lines_db.append(InvoiceLine(
            description=it["description"],
            quantity=it["quantity"],
            unit_price=it["unit_price"],
            tax_amount=line_tax,
            amount=it["amount"],
        ))

    # Invoice totals are exact sums of lines
    invoice_total = max(0, subtotal - discount_total + tax_total)
    due_date = calculate_due_date(period_start, subscription.payment_terms)
    invoice_number = generate_invoice_number(db)

    invoice = Invoice(
        number=invoice_number,
        subscription_id=subscription.id,
        period_start=period_start,
        period_end=period_end,
        status=InvoiceStatus.DRAFT.value,
        subtotal=subtotal,
        discount_total=discount_total,
        tax_total=tax_total,
        total=invoice_total,
        due_date=due_date,
        lines=invoice_lines_db,
    )
    db.add(invoice)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=None,
        action="CREATE_INVOICE",
        entity="invoice",
        entity_id=invoice.id,
        after={
            "number": invoice.number,
            "subscription_id": subscription.id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "subtotal": invoice.subtotal,
            "discount_total": invoice.discount_total,
            "tax_total": invoice.tax_total,
            "total": invoice.total,
        }
    )

    return invoice


def process_subscription_billing(
    subscription_id: int,
    now_utc: datetime,
    session_factory=None,
) -> int:
    """
    Processes a single subscription in its own isolated transaction with row locking.
    Returns number of invoices created.
    If an error occurs, the entire subscription's transaction is rolled back (both invoices & date).
    """
    if session_factory is None:
        session_factory = SessionLocal

    sub_session = session_factory()
    try:
        # Row locking: SELECT ... FOR UPDATE SKIP LOCKED on PostgreSQL
        query = sub_session.query(Subscription).filter(Subscription.id == subscription_id)
        if sub_session.bind.dialect.name == "postgresql":
            query = query.with_for_update(skip_locked=True)
        
        sub = query.first()
        if not sub:
            # Locked by another process or does not exist
            sub_session.close()
            return 0

        if sub.status != SubscriptionStatus.ACTIVE.value:
            sub_session.close()
            return 0

        created_in_sub = 0

        # Catch-up loop: loop and create every missed period
        while True:
            current_next = ensure_utc(sub.next_invoice_date)
            if not current_next or current_next > now_utc:
                break

            # Subscription end: if plan has auto_close, close it on expiry_date
            if sub.expiry_date:
                sub_expiry = ensure_utc(sub.expiry_date)
                if current_next >= sub_expiry:
                    if sub.plan and sub.plan.auto_close:
                        sub.status = SubscriptionStatus.CLOSED.value
                        log_audit_event(
                            db=sub_session,
                            actor_id=None,
                            action="AUTO_CLOSE",
                            entity="subscription",
                            entity_id=sub.id,
                            after={"status": "closed", "reason": "plan auto_close reached expiry_date"}
                        )
                    break

            period_start = current_next
            period_end = compute_next_billing_date(period_start, sub.plan.billing_period)

            # Unique constraint check: NEVER BILL TWICE (subscription_id, period_start)
            existing = sub_session.query(Invoice).filter(
                Invoice.subscription_id == sub.id,
                Invoice.period_start == period_start
            ).first()

            if existing:
                # Already billed this period; advance next_invoice_date
                sub.next_invoice_date = period_end
                continue

            # Build invoice
            build_invoice_for_period(
                db=sub_session,
                subscription=sub,
                period_start=period_start,
                period_end=period_end,
                now_utc=now_utc,
            )

            # Advance next_invoice_date in the same transaction
            sub.next_invoice_date = period_end
            created_in_sub += 1

        # Commit everything for this subscription atomically
        sub_session.commit()
        return created_in_sub

    except Exception as exc:
        sub_session.rollback()
        logger.exception(f"Billing failed for subscription {subscription_id}: {exc}")
        raise exc
    finally:
        sub_session.close()


def run_billing_engine(db: Session, triggered_by: str = "admin_manual") -> BillingRun:
    """
    Main billing engine runner.
    Finds active subscriptions whose next_invoice_date is today or earlier.
    Processes each subscription in its own transaction.
    Logs run metrics to billing_runs table.
    """
    now_utc = datetime.now(timezone.utc)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=db.get_bind())
    
    billing_run = BillingRun(
        started_at=now_utc,
        status="running",
        created_count=0,
        failures_count=0,
        triggered_by=triggered_by,
    )
    db.add(billing_run)
    db.commit()
    db.refresh(billing_run)

    # Auto-close check for expired active subscriptions with auto_close=True
    all_active = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE.value
    ).all()

    for active_sub in all_active:
        if active_sub.expiry_date and active_sub.plan and active_sub.plan.auto_close:
            exp_utc = ensure_utc(active_sub.expiry_date)
            if exp_utc <= now_utc:
                active_sub.status = SubscriptionStatus.CLOSED.value
                log_audit_event(
                    db=db,
                    actor_id=None,
                    action="AUTO_CLOSE",
                    entity="subscription",
                    entity_id=active_sub.id,
                    after={"status": "closed", "reason": "plan auto_close reached expiry_date"}
                )
    db.commit()

    # Query active subscriptions eligible for billing (next_invoice_date <= now)
    eligible_sub_ids = []
    for active_sub in all_active:
        if active_sub.status == SubscriptionStatus.ACTIVE.value and active_sub.next_invoice_date:
            next_dt = ensure_utc(active_sub.next_invoice_date)
            if next_dt <= now_utc:
                eligible_sub_ids.append(active_sub.id)

    total_created = 0
    total_failures = 0
    errors: List[str] = []

    for sub_id in eligible_sub_ids:
        try:
            created = process_subscription_billing(sub_id, now_utc, session_factory=session_factory)
            total_created += created
        except Exception as exc:
            total_failures += 1
            errors.append(f"Sub #{sub_id}: {str(exc)}")

    finished_utc = datetime.now(timezone.utc)
    billing_run.finished_at = finished_utc
    billing_run.status = "completed" if total_failures == 0 else ("failed" if total_created == 0 else "completed_with_errors")
    billing_run.created_count = total_created
    billing_run.failures_count = total_failures
    billing_run.details = json.dumps({
        "eligible_count": len(eligible_sub_ids),
        "created_invoices": total_created,
        "failures": total_failures,
        "errors": errors[:20],
    })

    db.commit()
    db.refresh(billing_run)

    if total_created > 0:
        notify_system_event("invoice_created", {"created_count": total_created, "run_id": billing_run.id})
        notify_system_event("finance_update", {"trigger": "billing_run", "created_count": total_created})

    logger.info(
        f"Billing run #{billing_run.id} finished: {total_created} invoices created, {total_failures} failures."
    )
    return billing_run
