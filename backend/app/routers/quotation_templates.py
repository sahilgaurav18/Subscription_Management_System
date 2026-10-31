from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.subscription import QuotationTemplate, QuotationTemplateLine
from app.models.plan import Plan
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.quotation_template import (
    QuotationTemplateCreate,
    QuotationTemplateUpdate,
    QuotationTemplateResponse,
    QuotationTemplateLineResponse,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/quotation-templates", tags=["Quotation Templates"])


def format_template_response(t: QuotationTemplate) -> QuotationTemplateResponse:
    lines = []
    for l in t.lines:
        lines.append(
            QuotationTemplateLineResponse(
                id=l.id,
                product_id=l.product_id,
                product_name=l.product.name if l.product else None,
                product_price=l.product.sales_price if l.product else None,
                variant_id=l.variant_id,
                variant_attribute=l.variant.attribute if l.variant else None,
                variant_value=l.variant.value if l.variant else None,
                variant_extra_price=l.variant.extra_price if l.variant else None,
                quantity=l.quantity,
            )
        )

    return QuotationTemplateResponse(
        id=t.id,
        name=t.name,
        validity_days=t.validity_days,
        plan_id=t.plan_id,
        plan_name=t.plan.name if t.plan else None,
        plan_price=t.plan.price if t.plan else None,
        plan_billing_period=t.plan.billing_period if t.plan else None,
        lines=lines,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


@router.get("", response_model=PaginatedResponse[QuotationTemplateResponse])
def list_quotation_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    query = db.query(QuotationTemplate)
    if q:
        query = query.filter(QuotationTemplate.name.ilike(f"%{q.strip()}%"))
    if plan_id:
        query = query.filter(QuotationTemplate.plan_id == plan_id)

    query = query.order_by(QuotationTemplate.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [format_template_response(t) for t in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{template_id}", response_model=QuotationTemplateResponse)
def get_quotation_template(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    t = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation template not found.")
    return format_template_response(t)


@router.post("", response_model=QuotationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_quotation_template(
    req: QuotationTemplateCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    plan = db.query(Plan).filter(Plan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected plan does not exist.")

    template = QuotationTemplate(
        name=req.name.strip(),
        validity_days=req.validity_days,
        plan_id=req.plan_id,
    )
    db.add(template)
    db.flush()

    for line in req.lines:
        prod = db.query(Product).filter(Product.id == line.product_id).first()
        if not prod:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product {line.product_id} not found.")

        if line.variant_id:
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == line.variant_id,
                ProductVariant.product_id == prod.id
            ).first()
            if not variant:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Variant {line.variant_id} not found for product {prod.name}.")

        tline = QuotationTemplateLine(
            template_id=template.id,
            product_id=line.product_id,
            variant_id=line.variant_id,
            quantity=line.quantity,
        )
        db.add(tline)

    db.flush()
    log_audit_event(
        db=db,
        actor_id=user.id,
        action="CREATE",
        entity="quotation_template",
        entity_id=template.id,
        after={"name": template.name, "validity_days": template.validity_days, "plan_id": template.plan_id}
    )
    db.commit()
    db.refresh(template)
    return format_template_response(template)


@router.patch("/{template_id}", response_model=QuotationTemplateResponse)
def update_quotation_template(
    template_id: int,
    req: QuotationTemplateUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation template not found.")

    before_state = {
        "name": template.name,
        "validity_days": template.validity_days,
        "plan_id": template.plan_id,
    }

    if req.name is not None:
        template.name = req.name.strip()
    if req.validity_days is not None:
        template.validity_days = req.validity_days
    if req.plan_id is not None:
        plan = db.query(Plan).filter(Plan.id == req.plan_id).first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected plan does not exist.")
        template.plan_id = req.plan_id

    if req.lines is not None:
        db.query(QuotationTemplateLine).filter(QuotationTemplateLine.template_id == template.id).delete()
        for line in req.lines:
            tline = QuotationTemplateLine(
                template_id=template.id,
                product_id=line.product_id,
                variant_id=line.variant_id,
                quantity=line.quantity,
            )
            db.add(tline)

    after_state = {
        "name": template.name,
        "validity_days": template.validity_days,
        "plan_id": template.plan_id,
    }

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="UPDATE",
        entity="quotation_template",
        entity_id=template.id,
        before=before_state,
        after=after_state
    )
    db.commit()
    db.refresh(template)
    return format_template_response(template)


@router.delete("/{template_id}", response_model=MessageResponse)
def delete_quotation_template(
    template_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation template not found.")

    before_state = {"name": template.name}
    db.delete(template)

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="DELETE",
        entity="quotation_template",
        entity_id=template_id,
        before=before_state
    )
    db.commit()
    return MessageResponse(message="Quotation template deleted successfully.")

