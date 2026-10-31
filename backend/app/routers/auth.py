from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.password_reset import PasswordResetToken
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_password_reset_token,
    hash_token,
)
from app.services.email_service import send_password_reset_email
from app.services.audit_service import log_audit_event
from app.services.rate_limiter import limiter
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()

    # Case-insensitive uniqueness check
    existing_user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Public sign-up always creates a customer
    customer = Customer(
        name=req.name.strip(),
        company=req.company.strip() if req.company else None,
        billing_address=req.billing_address.strip() if req.billing_address else None,
        tax_id=req.tax_id.strip() if req.tax_id else None,
    )
    db.add(customer)
    db.flush()

    user = User(
        email=email_clean,
        password_hash=hash_password(req.password),
        role=UserRole.CUSTOMER.value,
        customer_id=customer.id,
        is_active=True,
        token_version=1
    )
    db.add(user)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="CREATE",
        entity="user",
        entity_id=user.id,
        after={"email": user.email, "role": user.role, "customer_id": customer.id}
    )
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.role, user.token_version)
    refresh_token = create_refresh_token(user.id, user.token_version)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("15/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )

    access_token = create_access_token(user.id, user.role, user.token_version)
    refresh_token = create_refresh_token(user.id, user.token_version)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user_id = payload.get("sub")
    token_version = payload.get("token_version")
    if not user_id or token_version is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure."
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    if user.token_version != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked. Please log in again."
        )

    new_access_token = create_access_token(user.id, user.role, user.token_version)
    new_refresh_token = create_refresh_token(user.id, user.token_version)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("10/minute")
def forgot_password(request: Request, req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    # Rule: Forgot password: always return the same response
    generic_msg = "If an account with that email exists, a password reset link has been dispatched."

    if user and user.is_active:
        raw_token, token_hash = generate_password_reset_token()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)

        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False
        )
        db.add(reset_entry)
        db.commit()

        # Send email with raw single-use token
        send_password_reset_email(user.email, raw_token)

    return MessageResponse(message=generic_msg)


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("10/minute")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hash_token(req.token)
    now = datetime.now(timezone.utc)

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired."
        )

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Associated user no longer exists."
        )

    # Update password
    user.password_hash = hash_password(req.new_password)
    # Revoke old sessions: increment token_version
    user.token_version += 1
    # Single-use: mark token used
    reset_token.used = True

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="UPDATE",
        entity="user",
        entity_id=user.id,
        before={"action": "password_reset_initiated"},
        after={"action": "password_reset_completed", "token_version": user.token_version}
    )

    db.commit()
    return MessageResponse(message="Your password has been successfully reset. Please log in with your new password.")


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

