from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.billing_run import BillingRun
from app.schemas.invoice import BillingRunResponse
from app.schemas.common import PaginatedResponse
from app.dependencies import require_admin, require_staff_or_admin
from app.services.billing_service import run_billing_engine
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/billing", tags=["Billing Engine"])


@router.post("/run-now", response_model=BillingRunResponse)
def trigger_billing_run_now(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Admin-only endpoint to execute the billing engine immediately for testing and demos.
    Processes all eligible active subscriptions with row locking, catch-up loop, and discount/tax calculation.
    """
    billing_run = run_billing_engine(db, triggered_by=f"admin:{admin.email}")
    return BillingRunResponse.model_validate(billing_run)


@router.get("/runs", response_model=PaginatedResponse[BillingRunResponse])
def list_billing_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    """
    Lists historical billing runs and execution summaries.
    """
    query = db.query(BillingRun).order_by(BillingRun.id.desc())
    result = paginate_query(query, page, page_size)

    return {
        "items": [BillingRunResponse.model_validate(r) for r in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }

