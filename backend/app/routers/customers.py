from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import get_current_user, require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", response_model=PaginatedResponse[CustomerResponse])
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Customer)

    # Customer role isolation: customers can only see their own customer record
    if current_user.role == UserRole.CUSTOMER.value:
        if not current_user.customer_id:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 1}
        query = query.filter(Customer.id == current_user.customer_id)
    else:
        # Staff and admin can filter by search query
        if q:
            search_str = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(search_str),
                    Customer.company.ilike(search_str),
                    Customer.tax_id.ilike(search_str)
                )
            )

    if date_from:
        query = query.filter(Customer.created_at >= date_from)
    if date_to:
        query = query.filter(Customer.created_at <= date_to)

    query = query.order_by(Customer.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [CustomerResponse.model_validate(c) for c in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.CUSTOMER.value and current_user.customer_id != customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return CustomerResponse.model_validate(customer)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    req: CustomerCreate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff_or_admin),
):
    customer = Customer(
        name=req.name.strip(),
        company=req.company.strip() if req.company else None,
        billing_address=req.billing_address.strip() if req.billing_address else None,
        tax_id=req.tax_id.strip() if req.tax_id else None,
    )
    db.add(customer)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=staff_user.id,
        action="CREATE",
        entity="customer",
        entity_id=customer.id,
        after={"name": customer.name, "company": customer.company, "tax_id": customer.tax_id}
    )
    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    req: CustomerUpdate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff_or_admin),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    before_state = {
        "name": customer.name,
        "company": customer.company,
        "billing_address": customer.billing_address,
        "tax_id": customer.tax_id,
    }

    if req.name is not None:
        customer.name = req.name.strip()
    if req.company is not None:
        customer.company = req.company.strip()
    if req.billing_address is not None:
        customer.billing_address = req.billing_address.strip()
    if req.tax_id is not None:
        customer.tax_id = req.tax_id.strip()

    after_state = {
        "name": customer.name,
        "company": customer.company,
        "billing_address": customer.billing_address,
        "tax_id": customer.tax_id,
    }

    log_audit_event(
        db=db,
        actor_id=staff_user.id,
        action="UPDATE",
        entity="customer",
        entity_id=customer.id,
        before=before_state,
        after=after_state
    )
    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}", response_model=MessageResponse)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff_or_admin),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    before_state = {"name": customer.name, "company": customer.company}
    db.delete(customer)

    log_audit_event(
        db=db,
        actor_id=staff_user.id,
        action="DELETE",
        entity="customer",
        entity_id=customer_id,
        before=before_state
    )
    db.commit()
    return MessageResponse(message="Customer deleted successfully.")
