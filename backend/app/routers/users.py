from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, StaffCreateRequest, UserUpdateRequest
from app.schemas.common import PaginatedResponse
from app.dependencies import require_admin
from app.services.auth_service import hash_password, validate_password_strength
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = db.query(User)

    if q:
        query = query.filter(User.email.ilike(f"%{q.strip()}%"))
    if role:
        query = query.filter(User.role == role)
    if status is not None:
        if status.lower() == "active":
            query = query.filter(User.is_active == True)
        elif status.lower() == "inactive":
            query = query.filter(User.is_active == False)
    if date_from:
        query = query.filter(User.created_at >= date_from)
    if date_to:
        query = query.filter(User.created_at <= date_to)

    query = query.order_by(User.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [UserResponse.model_validate(u) for u in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    req: StaffCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    email_clean = req.email.strip().lower()

    # Password validation
    is_valid, msg = validate_password_strength(req.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Unique email check
    existing = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=email_clean,
        password_hash=hash_password(req.password),
        role=req.role,
        is_active=True,
        token_version=1
    )
    db.add(user)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CREATE",
        entity="user",
        entity_id=user.id,
        after={"email": user.email, "role": user.role}
    )
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    req: UserUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    before_state = {"role": user.role, "is_active": user.is_active}

    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
        if not req.is_active:
            user.token_version += 1  # Invalidate active sessions immediately

    after_state = {"role": user.role, "is_active": user.is_active}

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="UPDATE",
        entity="user",
        entity_id=user.id,
        before=before_state,
        after=after_state
    )
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)

