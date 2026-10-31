from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plan import Plan
from app.models.user import User
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import require_admin, require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/plans", tags=["Plans"])


@router.get("", response_model=PaginatedResponse[PlanResponse])
def list_plans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    billing_period: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    query = db.query(Plan)

    if q:
        query = query.filter(Plan.name.ilike(f"%{q.strip()}%"))
    if billing_period:
        query = query.filter(Plan.billing_period == billing_period)
    if date_from:
        query = query.filter(Plan.created_at >= date_from)
    if date_to:
        query = query.filter(Plan.created_at <= date_to)

    query = query.order_by(Plan.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [PlanResponse.model_validate(p) for p in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    return PlanResponse.model_validate(plan)


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    req: PlanCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    plan = Plan(
        name=req.name.strip(),
        price=req.price,
        currency=req.currency.strip().upper(),
        billing_period=req.billing_period,
        min_quantity=req.min_quantity,
        available_from=req.available_from,
        available_to=req.available_to,
        auto_close=req.auto_close,
        closable=req.closable,
        pausable=req.pausable,
        renewable=req.renewable,
    )
    db.add(plan)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CREATE",
        entity="plan",
        entity_id=plan.id,
        after={
            "name": plan.name,
            "price": plan.price,
            "billing_period": plan.billing_period,
            "currency": plan.currency,
        }
    )
    db.commit()
    db.refresh(plan)
    return PlanResponse.model_validate(plan)


@router.patch("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    req: PlanUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    before_state = {
        "name": plan.name,
        "price": plan.price,
        "billing_period": plan.billing_period,
        "min_quantity": plan.min_quantity,
        "auto_close": plan.auto_close,
        "closable": plan.closable,
        "pausable": plan.pausable,
        "renewable": plan.renewable,
    }

    if req.name is not None:
        plan.name = req.name.strip()
    if req.price is not None:
        plan.price = req.price
    if req.currency is not None:
        plan.currency = req.currency.strip().upper()
    if req.billing_period is not None:
        plan.billing_period = req.billing_period
    if req.min_quantity is not None:
        plan.min_quantity = req.min_quantity
    if req.available_from is not None:
        plan.available_from = req.available_from
    if req.available_to is not None:
        plan.available_to = req.available_to
    if req.auto_close is not None:
        plan.auto_close = req.auto_close
    if req.closable is not None:
        plan.closable = req.closable
    if req.pausable is not None:
        plan.pausable = req.pausable
    if req.renewable is not None:
        plan.renewable = req.renewable

    after_state = {
        "name": plan.name,
        "price": plan.price,
        "billing_period": plan.billing_period,
        "min_quantity": plan.min_quantity,
        "auto_close": plan.auto_close,
        "closable": plan.closable,
        "pausable": plan.pausable,
        "renewable": plan.renewable,
    }

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="UPDATE",
        entity="plan",
        entity_id=plan.id,
        before=before_state,
        after=after_state
    )
    db.commit()
    db.refresh(plan)
    return PlanResponse.model_validate(plan)


@router.delete("/{plan_id}", response_model=MessageResponse)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    before_state = {"name": plan.name, "price": plan.price}
    db.delete(plan)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="DELETE",
        entity="plan",
        entity_id=plan_id,
        before=before_state
    )
    db.commit()
    return MessageResponse(message="Plan deleted successfully.")

