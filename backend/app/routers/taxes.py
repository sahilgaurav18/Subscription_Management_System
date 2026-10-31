from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tax import Tax
from app.models.user import User
from app.schemas.tax import TaxCreate, TaxUpdate, TaxResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import require_admin, require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/taxes", tags=["Taxes"])


@router.get("", response_model=PaginatedResponse[TaxResponse])
def list_taxes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    query = db.query(Tax)

    if q:
        query = query.filter(Tax.name.ilike(f"%{q.strip()}%"))
    if date_from:
        query = query.filter(Tax.created_at >= date_from)
    if date_to:
        query = query.filter(Tax.created_at <= date_to)

    query = query.order_by(Tax.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [TaxResponse.model_validate(t) for t in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{tax_id}", response_model=TaxResponse)
def get_tax(
    tax_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax not found.")
    return TaxResponse.model_validate(tax)


@router.post("", response_model=TaxResponse, status_code=status.HTTP_201_CREATED)
def create_tax(
    req: TaxCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = db.query(Tax).filter(Tax.name.ilike(req.name.strip())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tax with this name already exists.")

    tax = Tax(
        name=req.name.strip(),
        rate_percent=req.rate_percent,
    )
    db.add(tax)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CREATE",
        entity="tax",
        entity_id=tax.id,
        after={"name": tax.name, "rate_percent": str(tax.rate_percent)}
    )
    db.commit()
    db.refresh(tax)
    return TaxResponse.model_validate(tax)


@router.patch("/{tax_id}", response_model=TaxResponse)
def update_tax(
    tax_id: int,
    req: TaxUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax not found.")

    before_state = {"name": tax.name, "rate_percent": str(tax.rate_percent)}

    if req.name is not None:
        tax.name = req.name.strip()
    if req.rate_percent is not None:
        tax.rate_percent = req.rate_percent

    after_state = {"name": tax.name, "rate_percent": str(tax.rate_percent)}

    # Audit log entry for tax changes
    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="UPDATE",
        entity="tax",
        entity_id=tax.id,
        before=before_state,
        after=after_state
    )
    db.commit()
    db.refresh(tax)
    return TaxResponse.model_validate(tax)


@router.delete("/{tax_id}", response_model=MessageResponse)
def delete_tax(
    tax_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax not found.")

    before_state = {"name": tax.name, "rate_percent": str(tax.rate_percent)}
    db.delete(tax)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="DELETE",
        entity="tax",
        entity_id=tax_id,
        before=before_state
    )
    db.commit()
    return MessageResponse(message="Tax deleted successfully.")

