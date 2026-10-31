from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.dependencies import require_staff_or_admin, require_admin
from app.services.reporting_service import (
    get_finance_metrics,
    get_overdue_invoices,
    export_invoices_csv,
    export_subscriptions_csv,
    export_customers_csv,
    export_overdue_csv,
)
from app.services.reminder_service import dispatch_overdue_reminders

router = APIRouter(prefix="/api/reports", tags=["Finance & Reports"])


@router.get("/finance")
def get_finance_dashboard(
    start_date: Optional[datetime] = Query(None, description="Filter start date"),
    end_date: Optional[datetime] = Query(None, description="Filter end date"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    plan_id: Optional[int] = Query(None, description="Filter by plan ID"),
    status: Optional[str] = Query(None, description="Filter by subscription status"),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    """
    Finance dashboard metrics for internal operations:
    - Admin has full access, Staff has read-only access.
    - SQL aggregates for Active Subscriptions, Revenue Received, Amount Owed, and MRR.
    - Revenue by month and table of overdue invoices sorted by days overdue.
    """
    metrics = get_finance_metrics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        customer_id=customer_id,
        plan_id=plan_id,
        status_filter=status,
    )
    overdue_invoices = get_overdue_invoices(db=db, customer_id=customer_id, limit=100)

    return {
        "metrics": metrics,
        "overdue_invoices": overdue_invoices,
        "is_admin": user.role == "admin",
    }


@router.get("/overdue")
def get_overdue_invoices_report(
    customer_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    """
    Retrieves confirmed overdue invoices sorted by days overdue descending.
    """
    items = get_overdue_invoices(db=db, customer_id=customer_id, limit=limit)
    return {"items": items, "count": len(items)}


@router.get("/export/invoices")
def export_invoices(
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    """Exports all invoices as RFC 4180 CSV file."""
    csv_data = export_invoices_csv(db, customer_id=customer_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="invoices_report.csv"',
        },
    )


@router.get("/export/subscriptions")
def export_subscriptions(
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    """Exports all subscriptions as RFC 4180 CSV file."""
    csv_data = export_subscriptions_csv(db, customer_id=customer_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="subscriptions_report.csv"',
        },
    )


@router.get("/export/customers")
def export_customers(
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    """Exports all customers as RFC 4180 CSV file."""
    csv_data = export_customers_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="customers_report.csv"',
        },
    )


@router.get("/export/overdue")
def export_overdue(
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    """Exports overdue invoices as RFC 4180 CSV file."""
    csv_data = export_overdue_csv(db, customer_id=customer_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="overdue_invoices_report.csv"',
        },
    )


@router.post("/reminders/run-now")
def run_overdue_reminders_now(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    """Admin-only trigger to immediately dispatch overdue reminder emails."""
    result = dispatch_overdue_reminders(db)
    return {
        "message": f"Overdue reminder run completed. Dispatched {result['dispatched_count']} emails.",
        "details": result,
    }

