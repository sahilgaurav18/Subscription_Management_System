import time
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plan import Plan
from app.schemas.plan import PublicPlanResponse

router = APIRouter(tags=["Public"])

# In-memory 60-second cache
_public_plans_cache: Dict[str, Any] = {
    "data": None,
    "expires_at": 0.0
}


def invalidate_public_plans_cache():
    _public_plans_cache["data"] = None
    _public_plans_cache["expires_at"] = 0.0


def _fetch_active_available_plans(db: Session) -> List[PublicPlanResponse]:
    now = datetime.now(timezone.utc)
    plans = (
        db.query(Plan)
        .filter(Plan.is_active == True)
        .filter(
            (Plan.available_from.is_(None) | (Plan.available_from <= now)),
            (Plan.available_to.is_(None) | (Plan.available_to >= now))
        )
        .order_by(Plan.price.asc())
        .all()
    )

    return [
        PublicPlanResponse(
            id=p.id,
            name=p.name,
            price=p.price,
            currency=p.currency,
            billing_period=p.billing_period,
            min_quantity=p.min_quantity
        )
        for p in plans
    ]


@router.get("/api/v1/public/plans", response_model=List[PublicPlanResponse])
@router.get("/api/public/plans", response_model=List[PublicPlanResponse])
def get_public_plans(response: Response, db: Session = Depends(get_db)):
    """
    Public read-only endpoint that returns only active, currently available plans
    with strictly public fields (name, price, billing_period, min_quantity).
    Never exposes cost prices, notes, or inactive/unavailable plans.
    Cached for 60 seconds.
    """
    now_ts = time.time()
    response.headers["Cache-Control"] = "public, max-age=60"

    if _public_plans_cache["data"] is not None and now_ts < _public_plans_cache["expires_at"]:
        return _public_plans_cache["data"]

    results = _fetch_active_available_plans(db)
    _public_plans_cache["data"] = results
    _public_plans_cache["expires_at"] = now_ts + 60.0
    return results

