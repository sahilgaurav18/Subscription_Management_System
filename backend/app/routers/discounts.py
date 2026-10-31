from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.discount import Discount, DiscountProduct, DiscountSubscription
from app.models.user import User
from app.schemas.discount import DiscountCreate, DiscountUpdate, DiscountResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import require_admin, require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/discounts", tags=["Discounts"])


def format_discount_response(d: Discount) -> DiscountResponse:
    return DiscountResponse(
        id=d.id,
        name=d.name,
        code=d.code,
        type=d.type,
        value=d.value,
        min_purchase=d.min_purchase,
        min_quantity=d.min_quantity,
        start_date=d.start_date,
        end_date=d.end_date,
        usage_limit=d.usage_limit,
        times_used=d.times_used,
        scope=d.scope,
        linked_product_ids=[lp.product_id for lp in d.product_links] if d.product_links else [],
        linked_subscription_ids=[ls.subscription_id for ls in d.subscription_links] if d.subscription_links else [],
        created_at=d.created_at,
        updated_at=d.updated_at,
    )


@router.get("", response_model=PaginatedResponse[DiscountResponse])
def list_discounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    scope: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    query = db.query(Discount)

    if q:
        search_str = f"%{q.strip()}%"
        query = query.filter((Discount.name.ilike(search_str)) | (Discount.code.ilike(search_str)))
    if scope:
        query = query.filter(Discount.scope == scope)
    if type:
        query = query.filter(Discount.type == type)
    if date_from:
        query = query.filter(Discount.created_at >= date_from)
    if date_to:
        query = query.filter(Discount.created_at <= date_to)

    query = query.order_by(Discount.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [format_discount_response(d) for d in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{discount_id}", response_model=DiscountResponse)
def get_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found.")
    return format_discount_response(discount)


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    req: DiscountCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    discount = Discount(
        name=req.name.strip(),
        code=req.code.strip().upper() if req.code else None,
        type=req.type,
        value=req.value,
        min_purchase=req.min_purchase,
        min_quantity=req.min_quantity,
        start_date=req.start_date,
        end_date=req.end_date,
        usage_limit=req.usage_limit,
        times_used=0,
        scope=req.scope,
    )
    db.add(discount)
    db.flush()

    if req.product_ids:
        for pid in req.product_ids:
            db.add(DiscountProduct(discount_id=discount.id, product_id=pid))
    if req.subscription_ids:
        for sid in req.subscription_ids:
            db.add(DiscountSubscription(discount_id=discount.id, subscription_id=sid))
    db.flush()

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CREATE",
        entity="discount",
        entity_id=discount.id,
        after={
            "name": discount.name,
            "code": discount.code,
            "type": discount.type,
            "value": discount.value,
            "scope": discount.scope,
            "product_ids": req.product_ids,
            "subscription_ids": req.subscription_ids,
        }
    )
    db.commit()
    db.refresh(discount)
    return format_discount_response(discount)


@router.patch("/{discount_id}", response_model=DiscountResponse)
def update_discount(
    discount_id: int,
    req: DiscountUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found.")

    before_state = {
        "name": discount.name,
        "code": discount.code,
        "type": discount.type,
        "value": discount.value,
        "scope": discount.scope,
        "usage_limit": discount.usage_limit,
    }

    if req.name is not None:
        discount.name = req.name.strip()
    if req.code is not None:
        discount.code = req.code.strip().upper() if req.code else None
    if req.type is not None:
        discount.type = req.type
    if req.value is not None:
        discount.value = req.value
    if req.min_purchase is not None:
        discount.min_purchase = req.min_purchase
    if req.min_quantity is not None:
        discount.min_quantity = req.min_quantity
    if req.start_date is not None:
        discount.start_date = req.start_date
    if req.end_date is not None:
        discount.end_date = req.end_date
    if req.usage_limit is not None:
        discount.usage_limit = req.usage_limit
    if req.scope is not None:
        discount.scope = req.scope

    if req.product_ids is not None:
        db.query(DiscountProduct).filter(DiscountProduct.discount_id == discount.id).delete()
        for pid in req.product_ids:
            db.add(DiscountProduct(discount_id=discount.id, product_id=pid))

    if req.subscription_ids is not None:
        db.query(DiscountSubscription).filter(DiscountSubscription.discount_id == discount.id).delete()
        for sid in req.subscription_ids:
            db.add(DiscountSubscription(discount_id=discount.id, subscription_id=sid))

    after_state = {
        "name": discount.name,
        "code": discount.code,
        "type": discount.type,
        "value": discount.value,
        "scope": discount.scope,
        "usage_limit": discount.usage_limit,
    }

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="UPDATE",
        entity="discount",
        entity_id=discount.id,
        before=before_state,
        after=after_state
    )
    db.commit()
    db.refresh(discount)
    return format_discount_response(discount)


@router.delete("/{discount_id}", response_model=MessageResponse)
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found.")

    before_state = {"name": discount.name, "value": discount.value}
    db.delete(discount)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="DELETE",
        entity="discount",
        entity_id=discount_id,
        before=before_state
    )
    db.commit()
    return MessageResponse(message="Discount deleted successfully.")

