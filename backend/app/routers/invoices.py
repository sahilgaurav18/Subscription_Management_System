from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_, func

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus, Payment
from app.models.subscription import Subscription
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.schemas.invoice import InvoiceResponse, PaymentCreate, PaymentResponse, InvoiceLineResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import get_current_user, require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query
from app.services.pdf_service import generate_invoice_pdf, format_money
from app.services.email_service import send_invoice_email
from app.services.sse_service import notify_system_event
from app.exceptions import OverpaymentError, InvalidStatusTransitionError, ResourceNotFoundError

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


def map_invoice_response(inv: Invoice, now_utc: datetime) -> InvoiceResponse:
    sub = inv.subscription
    cust = sub.customer if sub else None
    
    amount_paid = sum(p.amount for p in inv.payments)
    balance_due = max(0, inv.total - amount_paid)
    
    due_utc = inv.due_date.replace(tzinfo=timezone.utc) if inv.due_date.tzinfo is None else inv.due_date
    is_overdue = (inv.status == InvoiceStatus.CONFIRMED.value and balance_due > 0 and due_utc < now_utc)

    return InvoiceResponse(
        id=inv.id,
        number=inv.number,
        subscription_id=inv.subscription_id,
        subscription_number=sub.number if sub else None,
        customer_id=cust.id if cust else None,
        customer_name=cust.name if cust else None,
        period_start=inv.period_start,
        period_end=inv.period_end,
        status=inv.status,
        subtotal=inv.subtotal,
        discount_total=inv.discount_total,
        tax_total=inv.tax_total,
        total=inv.total,
        due_date=inv.due_date,
        amount_paid=amount_paid,
        balance_due=balance_due,
        is_overdue=is_overdue,
        lines=[InvoiceLineResponse.model_validate(l) for l in inv.lines],
        payments=[PaymentResponse.model_validate(p) for p in inv.payments],
        created_at=inv.created_at,
        updated_at=inv.updated_at,
    )


@router.get("", response_model=PaginatedResponse[InvoiceResponse])
def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    status: Optional[str] = None,
    subscription_id: Optional[int] = None,
    is_overdue: Optional[bool] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now_utc = datetime.now(timezone.utc)
    query = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.subscription).joinedload(Subscription.customer),
            selectinload(Invoice.payments),
            selectinload(Invoice.lines),
        )
        .join(Subscription)
    )

    # Customer Data Isolation
    if user.role == UserRole.CUSTOMER.value:
        if not user.customer_id:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        query = query.filter(Subscription.customer_id == user.customer_id)

    if subscription_id:
        query = query.filter(Invoice.subscription_id == subscription_id)

    if q:
        query = query.filter(
            or_(
                Invoice.number.ilike(f"%{q.strip()}%"),
                Subscription.number.ilike(f"%{q.strip()}%"),
            )
        )

    if status and status.lower() != "all":
        if status.lower() == "overdue":
            # Dynamic overdue query: confirmed + due_date < now
            query = query.filter(
                Invoice.status == InvoiceStatus.CONFIRMED.value,
                Invoice.due_date < now_utc
            )
        else:
            query = query.filter(Invoice.status == status.lower())

    if is_overdue is True:
        query = query.filter(
            Invoice.status == InvoiceStatus.CONFIRMED.value,
            Invoice.due_date < now_utc
        )

    if date_from:
        query = query.filter(Invoice.created_at >= date_from)
    if date_to:
        query = query.filter(Invoice.created_at <= date_to)

    query = query.order_by(Invoice.id.desc())
    result = paginate_query(query, page, page_size)

    return {
        "items": [map_invoice_response(inv, now_utc) for inv in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    # Customer Data Isolation
    if user.role == UserRole.CUSTOMER.value:
        if not user.customer_id or inv.subscription.customer_id != user.customer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this invoice.")

    now_utc = datetime.now(timezone.utc)
    return map_invoice_response(inv, now_utc)


@router.post("/{invoice_id}/confirm", response_model=InvoiceResponse)
def confirm_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    if inv.status != InvoiceStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only draft invoices can be confirmed. Current status is '{inv.status}'."
        )

    inv.status = InvoiceStatus.CONFIRMED.value
    db.commit()
    db.refresh(inv)

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="CONFIRM_INVOICE",
        entity="invoice",
        entity_id=inv.id,
        after={"status": "confirmed"}
    )

    notify_system_event("invoice_status_changed", {
        "invoice_id": inv.id,
        "invoice_number": inv.number,
        "status": inv.status,
        "customer_id": inv.subscription.customer_id if inv.subscription else None,
    })
    notify_system_event("finance_update", {"trigger": "invoice_confirmed"})

    now_utc = datetime.now(timezone.utc)
    return map_invoice_response(inv, now_utc)


@router.post("/{invoice_id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    if inv.status not in (InvoiceStatus.DRAFT.value, InvoiceStatus.CONFIRMED.value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel invoice in '{inv.status}' status. Only draft and confirmed invoices can be cancelled."
        )

    # Check if invoice has any recorded payments
    if inv.payments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel an invoice with recorded payments."
        )

    inv.status = InvoiceStatus.CANCELLED.value
    db.commit()
    db.refresh(inv)

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="CANCEL_INVOICE",
        entity="invoice",
        entity_id=inv.id,
        after={"status": "cancelled"}
    )

    notify_system_event("invoice_status_changed", {
        "invoice_id": inv.id,
        "invoice_number": inv.number,
        "status": inv.status,
        "customer_id": inv.subscription.customer_id if inv.subscription else None,
    })
    notify_system_event("finance_update", {"trigger": "invoice_cancelled"})

    now_utc = datetime.now(timezone.utc)
    return map_invoice_response(inv, now_utc)


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    # Customer Data Isolation
    if user.role == UserRole.CUSTOMER.value:
        if not user.customer_id or inv.subscription.customer_id != user.customer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this invoice.")

    pdf_bytes = generate_invoice_pdf(inv)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="invoice-{inv.number}.pdf"',
        }
    )


@router.post("/{invoice_id}/send-email", response_model=MessageResponse)
def email_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    cust = inv.subscription.customer if inv.subscription else None
    if not cust:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No customer linked to this invoice.")

    # Find customer account email
    cust_user = db.query(User).filter(User.customer_id == cust.id).first()
    recipient_email = cust_user.email if cust_user else "customer@brightloop.io"

    pdf_bytes = generate_invoice_pdf(inv)
    amount_paid = sum(p.amount for p in inv.payments)
    balance_due = max(0, inv.total - amount_paid)

    send_invoice_email(
        to_email=recipient_email,
        invoice_number=inv.number,
        pdf_bytes=pdf_bytes,
        customer_name=cust.name,
        amount_due_formatted=format_money(balance_due),
    )

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="SEND_INVOICE_EMAIL",
        entity="invoice",
        entity_id=inv.id,
        after={"recipient": recipient_email}
    )

    return {"message": f"Invoice {inv.number} successfully sent to {recipient_email}."}


@router.post("/{invoice_id}/payments", response_model=InvoiceResponse)
def record_payment(
    invoice_id: int,
    req: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise ResourceNotFoundError("Invoice not found.")

    if inv.status == InvoiceStatus.DRAFT.value:
        raise InvalidStatusTransitionError("Cannot record payment on a draft invoice. Please confirm the invoice first.")

    if inv.status == InvoiceStatus.CANCELLED.value:
        raise InvalidStatusTransitionError("Cannot record payment on a cancelled invoice.")

    if req.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero."
        )

    current_paid = sum(p.amount for p in inv.payments)
    balance_due = max(0, inv.total - current_paid)

    # REJECT OVERPAYMENT
    if req.amount > balance_due:
        raise OverpaymentError(
            f"Payment amount (${req.amount / 100:.2f}) exceeds balance due (${balance_due / 100:.2f}). Overpayment is refused."
        )

    now_utc = datetime.now(timezone.utc)
    payment_date = req.paid_on or now_utc

    payment = Payment(
        invoice_id=inv.id,
        method=req.method.strip().lower(),
        amount=req.amount,
        paid_on=payment_date,
        note=req.note.strip() if req.note else None,
    )
    db.add(payment)
    db.flush()

    new_total_paid = current_paid + req.amount
    
    # Auto-mark PAID when total paid equals grand total
    if new_total_paid >= inv.total:
        inv.status = InvoiceStatus.PAID.value

    db.commit()
    db.refresh(inv)

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="RECORD_PAYMENT",
        entity="payment",
        entity_id=payment.id,
        after={
            "invoice_id": inv.id,
            "invoice_number": inv.number,
            "amount": payment.amount,
            "method": payment.method,
            "new_invoice_status": inv.status,
        }
    )

    notify_system_event("payment_recorded", {
        "invoice_id": inv.id,
        "invoice_number": inv.number,
        "amount": payment.amount,
        "new_invoice_status": inv.status,
        "customer_id": inv.subscription.customer_id if inv.subscription else None,
    })
    notify_system_event("finance_update", {"trigger": "payment_recorded"})

    return map_invoice_response(inv, now_utc)

