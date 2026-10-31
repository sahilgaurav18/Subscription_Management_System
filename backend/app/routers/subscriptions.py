from typing import Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_
from app.database import get_db
from app.models.subscription import (
    Subscription,
    SubscriptionLine,
    SubscriptionStatus,
    QuotationTemplate,
    QuotationTemplateLine,
)
from app.models.customer import Customer
from app.models.plan import Plan
from app.models.product import Product, ProductVariant
from app.models.tax import Tax
from app.models.user import User, UserRole
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    SubscriptionLineResponse,
    SubscriptionLineCreate,
    SubscriptionTransitionRequest,
    CreateQuotationFromTemplateRequest,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import get_current_user, require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.sse_service import notify_system_event
from app.services.pagination import paginate_query
from app.exceptions import (
    BusinessRuleError,
    ExpiredQuotationError,
    PlanFlagNotAllowedError,
    InvalidStatusTransitionError,
    ResourceNotFoundError,
)

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


def generate_subscription_number(db: Session) -> str:
    last_sub = db.query(Subscription).order_by(Subscription.id.desc()).first()
    next_num = (last_sub.id + 1) if last_sub else 1
    return f"SUB-{next_num:06d}"


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def compute_next_date(base_date: datetime, billing_period: str) -> datetime:
    base = ensure_utc(base_date) or datetime.now(timezone.utc)
    if billing_period == "daily":
        return base + timedelta(days=1)
    elif billing_period == "weekly":
        return base + timedelta(weeks=1)
    elif billing_period == "monthly":
        return base + timedelta(days=30)
    elif billing_period == "yearly":
        return base + timedelta(days=365)
    return base + timedelta(days=30)


def validate_plan_constraints(plan: Plan, lines: List[SubscriptionLineCreate]):
    now = datetime.now(timezone.utc)
    if plan.available_from and now < ensure_utc(plan.available_from):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan is not yet available.")
    if plan.available_to and now > ensure_utc(plan.available_to):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan is no longer available.")

    total_qty = sum(l.quantity for l in lines)
    if total_qty < plan.min_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total line quantity ({total_qty}) is less than plan minimum quantity ({plan.min_quantity})."
        )


def format_subscription_response(sub: Subscription) -> SubscriptionResponse:
    lines = []
    total_amount = 0
    for l in sub.lines:
        lines.append(
            SubscriptionLineResponse(
                id=l.id,
                subscription_id=l.subscription_id,
                product_id=l.product_id,
                product_name=l.product.name if l.product else None,
                variant_id=l.variant_id,
                variant_attribute=l.variant.attribute if l.variant else None,
                variant_value=l.variant.value if l.variant else None,
                quantity=l.quantity,
                unit_price=l.unit_price,
                tax_id=l.tax_id,
                tax_rate=str(l.tax.rate_percent) if l.tax else None,
                amount=l.amount,
            )
        )
        total_amount += l.amount

    return SubscriptionResponse(
        id=sub.id,
        number=sub.number,
        customer_id=sub.customer_id,
        customer_name=sub.customer.name if sub.customer else None,
        customer_company=sub.customer.company if sub.customer else None,
        customer_billing_address=sub.customer.billing_address if sub.customer else None,
        customer_tax_id=sub.customer.tax_id if sub.customer else None,
        plan_id=sub.plan_id,
        plan_name=sub.plan.name if sub.plan else None,
        plan_billing_period=sub.plan.billing_period if sub.plan else None,
        plan_price=sub.plan.price if sub.plan else None,
        plan_pausable=sub.plan.pausable if sub.plan else None,
        plan_closable=sub.plan.closable if sub.plan else None,
        plan_renewable=sub.plan.renewable if sub.plan else None,
        plan_auto_close=sub.plan.auto_close if sub.plan else None,
        start_date=sub.start_date,
        expiry_date=sub.expiry_date,
        payment_terms=sub.payment_terms,
        status=sub.status,
        next_invoice_date=sub.next_invoice_date,
        total_amount=total_amount,
        lines=lines,
        created_at=sub.created_at,
        updated_at=sub.updated_at,
    )


@router.get("", response_model=PaginatedResponse[SubscriptionResponse])
def list_subscriptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Subscription).options(
        joinedload(Subscription.customer),
        joinedload(Subscription.plan),
        selectinload(Subscription.lines).joinedload(SubscriptionLine.product),
        selectinload(Subscription.lines).joinedload(SubscriptionLine.variant),
    )

    # Customer isolation
    if current_user.role == UserRole.CUSTOMER.value:
        if not current_user.customer_id:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 1}
        query = query.filter(Subscription.customer_id == current_user.customer_id)
    else:
        if customer_id:
            query = query.filter(Subscription.customer_id == customer_id)
        if q:
            search_str = f"%{q.strip()}%"
            query = query.join(Customer).filter(
                or_(
                    Subscription.number.ilike(search_str),
                    Customer.name.ilike(search_str),
                    Customer.company.ilike(search_str),
                )
            )

    if status:
        query = query.filter(Subscription.status == status)
    if date_from:
        query = query.filter(Subscription.start_date >= date_from)
    if date_to:
        query = query.filter(Subscription.start_date <= date_to)

    query = query.order_by(Subscription.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [format_subscription_response(s) for s in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

    if current_user.role == UserRole.CUSTOMER.value and sub.customer_id != current_user.customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return format_subscription_response(sub)


@router.post("/from-template", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_quotation_from_template(
    req: CreateQuotationFromTemplateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    template = db.query(QuotationTemplate).filter(QuotationTemplate.id == req.template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation template not found.")

    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    plan = template.plan

    # Lines: use custom lines if provided by staff, otherwise copy template lines
    lines_to_use: List[SubscriptionLineCreate] = []
    if req.custom_lines is not None and len(req.custom_lines) > 0:
        lines_to_use = req.custom_lines
    else:
        for tl in template.lines:
            lines_to_use.append(
                SubscriptionLineCreate(
                    product_id=tl.product_id,
                    variant_id=tl.variant_id,
                    quantity=tl.quantity,
                )
            )

    # Enforce plan availability and min quantity
    validate_plan_constraints(plan, lines_to_use)

    start_date = req.start_date or datetime.now(timezone.utc)
    expiry_date = start_date + timedelta(days=template.validity_days)
    sub_number = generate_subscription_number(db)

    sub = Subscription(
        number=sub_number,
        customer_id=customer.id,
        plan_id=plan.id,
        start_date=start_date,
        expiry_date=expiry_date,
        payment_terms=req.payment_terms,
        status=SubscriptionStatus.QUOTATION.value,
        next_invoice_date=None,
    )
    db.add(sub)
    db.flush()

    for line_in in lines_to_use:
        prod = db.query(Product).filter(Product.id == line_in.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product {line_in.product_id} not found.")

        variant_extra = 0
        if line_in.variant_id:
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == line_in.variant_id,
                ProductVariant.product_id == prod.id
            ).first()
            if variant:
                variant_extra = variant.extra_price

        unit_price = line_in.unit_price if line_in.unit_price is not None else (prod.sales_price + variant_extra)
        amount = unit_price * line_in.quantity

        sline = SubscriptionLine(
            subscription_id=sub.id,
            product_id=line_in.product_id,
            variant_id=line_in.variant_id,
            quantity=line_in.quantity,
            unit_price=unit_price,
            tax_id=line_in.tax_id,
            amount=amount,
        )
        db.add(sline)

    db.flush()
    log_audit_event(
        db=db,
        actor_id=user.id,
        action="CREATE",
        entity="subscription",
        entity_id=sub.id,
        after={
            "number": sub.number,
            "status": sub.status,
            "from_template": template.name,
            "expiry_date": str(sub.expiry_date)
        }
    )
    db.commit()
    db.refresh(sub)

    notify_system_event("subscription_status_changed", {
        "subscription_id": sub.id,
        "subscription_number": sub.number,
        "status": sub.status,
        "customer_id": sub.customer_id,
        "action": "create_from_template",
    })
    notify_system_event("finance_update", {"trigger": "subscription_transition"})

    return format_subscription_response(sub)


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    req: SubscriptionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    plan = db.query(Plan).filter(Plan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    validate_plan_constraints(plan, req.lines)

    start_date = req.start_date or datetime.now(timezone.utc)
    sub_number = generate_subscription_number(db)

    sub = Subscription(
        number=sub_number,
        customer_id=customer.id,
        plan_id=plan.id,
        start_date=start_date,
        expiry_date=req.expiry_date,
        payment_terms=req.payment_terms,
        status=req.status,
        next_invoice_date=None,
    )
    db.add(sub)
    db.flush()

    for line_in in req.lines:
        prod = db.query(Product).filter(Product.id == line_in.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product {line_in.product_id} not found.")

        variant_extra = 0
        if line_in.variant_id:
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == line_in.variant_id,
                ProductVariant.product_id == prod.id
            ).first()
            if variant:
                variant_extra = variant.extra_price

        unit_price = line_in.unit_price if line_in.unit_price is not None else (prod.sales_price + variant_extra)
        amount = unit_price * line_in.quantity

        sline = SubscriptionLine(
            subscription_id=sub.id,
            product_id=line_in.product_id,
            variant_id=line_in.variant_id,
            quantity=line_in.quantity,
            unit_price=unit_price,
            tax_id=line_in.tax_id,
            amount=amount,
        )
        db.add(sline)

    db.flush()
    log_audit_event(
        db=db,
        actor_id=user.id,
        action="CREATE",
        entity="subscription",
        entity_id=sub.id,
        after={"number": sub.number, "status": sub.status, "customer_id": sub.customer_id}
    )
    db.commit()
    db.refresh(sub)

    notify_system_event("subscription_status_changed", {
        "subscription_id": sub.id,
        "subscription_number": sub.number,
        "status": sub.status,
        "customer_id": sub.customer_id,
        "action": "create",
    })
    notify_system_event("finance_update", {"trigger": "subscription_transition"})

    return format_subscription_response(sub)


@router.post("/{subscription_id}/transition", response_model=SubscriptionResponse)
def transition_subscription(
    subscription_id: int,
    req: SubscriptionTransitionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise ResourceNotFoundError("Subscription not found.")

    plan = sub.plan
    now = datetime.now(timezone.utc)
    action = req.action.lower().strip()

    before_state = {
        "status": sub.status,
        "expiry_date": str(sub.expiry_date) if sub.expiry_date else None,
        "next_invoice_date": str(sub.next_invoice_date) if sub.next_invoice_date else None,
    }

    if action == "quotation":
        if sub.status != SubscriptionStatus.DRAFT.value:
            raise InvalidStatusTransitionError(f"Cannot transition to quotation from status '{sub.status}'.")
        sub.status = SubscriptionStatus.QUOTATION.value

    elif action == "confirm":
        if sub.status not in (SubscriptionStatus.DRAFT.value, SubscriptionStatus.QUOTATION.value):
            raise InvalidStatusTransitionError(f"Cannot confirm subscription in status '{sub.status}'.")

        # Quotation expiry check: cannot confirm if expired
        if sub.expiry_date and now > ensure_utc(sub.expiry_date):
            raise ExpiredQuotationError("Quotation has expired and cannot be confirmed.")

        # Re-check plan availability & min quantity
        line_specs = [
            SubscriptionLineCreate(
                product_id=l.product_id,
                variant_id=l.variant_id,
                quantity=l.quantity
            ) for l in sub.lines
        ]
        validate_plan_constraints(plan, line_specs)

        # On confirm: Copy prices onto lines
        for line in sub.lines:
            prod = line.product
            variant_extra = line.variant.extra_price if line.variant else 0
            line.unit_price = prod.sales_price + variant_extra
            line.amount = line.unit_price * line.quantity

        # Set next_invoice_date from plan billing period
        sub.next_invoice_date = compute_next_date(sub.start_date, plan.billing_period)
        sub.status = SubscriptionStatus.CONFIRMED.value

    elif action == "activate":
        if sub.status not in (SubscriptionStatus.CONFIRMED.value, SubscriptionStatus.PAUSED.value):
            raise InvalidStatusTransitionError(f"Cannot activate subscription from status '{sub.status}'.")
        sub.status = SubscriptionStatus.ACTIVE.value

    elif action == "pause":
        if sub.status != SubscriptionStatus.ACTIVE.value:
            raise InvalidStatusTransitionError(f"Can only pause an active subscription (current: '{sub.status}').")
        # Enforce plan pausable flag
        if not plan.pausable:
            raise PlanFlagNotAllowedError("Plan is not pausable and does not permit pausing this subscription.")
        sub.status = SubscriptionStatus.PAUSED.value

    elif action == "resume":
        if sub.status != SubscriptionStatus.PAUSED.value:
            raise InvalidStatusTransitionError(f"Can only resume a paused subscription (current: '{sub.status}').")
        sub.status = SubscriptionStatus.ACTIVE.value

    elif action == "close":
        if sub.status == SubscriptionStatus.CLOSED.value:
            raise InvalidStatusTransitionError("Subscription is already closed.")
        # If closing early (active/confirmed/paused), check closable flag
        if sub.status in (SubscriptionStatus.ACTIVE.value, SubscriptionStatus.CONFIRMED.value, SubscriptionStatus.PAUSED.value):
            if not plan.closable:
                raise PlanFlagNotAllowedError("Plan is not closable and does not permit early closure of this subscription.")
        sub.status = SubscriptionStatus.CLOSED.value

    elif action == "renew":
        # Enforce plan renewable flag
        if not plan.renewable:
            raise PlanFlagNotAllowedError("Plan is not renewable and does not permit renewing this subscription.")
        # Extends expiry_date
        exp_utc = ensure_utc(sub.expiry_date)
        base_exp = exp_utc if exp_utc and exp_utc > now else now
        sub.expiry_date = compute_next_date(base_exp, plan.billing_period)

    else:
        raise HTTPException(status_code=400, detail=f"Unrecognized transition action '{action}'.")

    after_state = {
        "status": sub.status,
        "expiry_date": str(sub.expiry_date) if sub.expiry_date else None,
        "next_invoice_date": str(sub.next_invoice_date) if sub.next_invoice_date else None,
        "action": action,
        "note": req.note,
    }

    # Write each transition to audit_log
    log_audit_event(
        db=db,
        actor_id=user.id,
        action="STATUS_CHANGE",
        entity="subscription",
        entity_id=sub.id,
        before=before_state,
        after=after_state
    )

    db.commit()
    db.refresh(sub)

    notify_system_event("subscription_status_changed", {
        "subscription_id": sub.id,
        "subscription_number": sub.number,
        "status": sub.status,
        "customer_id": sub.customer_id,
        "action": action,
    })
    notify_system_event("finance_update", {"trigger": "subscription_transition"})

    return format_subscription_response(sub)
