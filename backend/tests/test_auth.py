import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.password_reset import PasswordResetToken
from app.services.auth_service import hash_token


def test_public_registration_creates_customer(client: TestClient, db_session: Session):
    payload = {
        "email": "NewCustomer@Test.io",
        "password": "ValidPassword123!",
        "name": "Jane Doe",
        "company": "Jane Innovations",
        "billing_address": "456 Market St, SF, CA",
        "tax_id": "TAX-9988"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "newcustomer@test.io"  # lowercased
    assert data["user"]["role"] == UserRole.CUSTOMER.value
    assert data["user"]["customer_id"] is not None

    # Verify customer table in DB
    customer = db_session.query(Customer).filter(Customer.id == data["user"]["customer_id"]).first()
    assert customer is not None
    assert customer.name == "Jane Doe"
    assert customer.company == "Jane Innovations"


def test_case_insensitive_email_uniqueness(client: TestClient, db_session: Session):
    payload1 = {
        "email": "user@example.com",
        "password": "ValidPassword123!",
        "name": "User One",
    }
    res1 = client.post("/api/auth/register", json=payload1)
    assert res1.status_code == 201

    payload2 = {
        "email": "USER@EXAMPLE.COM",
        "password": "ValidPassword123!",
        "name": "User Duplicate",
    }
    res2 = client.post("/api/auth/register", json=payload2)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


@pytest.mark.parametrize("invalid_password,expected_error", [
    ("Short1!", "more than 8 characters"),
    ("alllowercase123!", "uppercase letter"),
    ("ALLUPPERCASE123!", "lowercase letter"),
    ("NoSpecialChar123", "special character"),
])
def test_password_complexity_rules(client: TestClient, invalid_password, expected_error):
    payload = {
        "email": "testcomplex@example.com",
        "password": invalid_password,
        "name": "Tester",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert expected_error in str(response.json())


def test_login_flow(client: TestClient, customer_user: User):
    # Success
    res = client.post("/api/auth/login", json={
        "email": "customer@test.io",
        "password": "CustPass123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == customer_user.email

    # Failure
    res_fail = client.post("/api/auth/login", json={
        "email": "customer@test.io",
        "password": "WrongPassword123!"
    })
    assert res_fail.status_code == 401


def test_refresh_token_flow(client: TestClient, customer_user: User):
    login_res = client.post("/api/auth/login", json={
        "email": "customer@test.io",
        "password": "CustPass123!"
    })
    refresh_token = login_res.json()["refresh_token"]

    refresh_res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()


def test_forgot_password_always_returns_same_response(client: TestClient):
    # Existing email
    res1 = client.post("/api/auth/forgot-password", json={"email": "customer@test.io"})
    assert res1.status_code == 200

    # Non-existing email
    res2 = client.post("/api/auth/forgot-password", json={"email": "nonexistent@test.io"})
    assert res2.status_code == 200

    assert res1.json()["message"] == res2.json()["message"]


def test_reset_password_single_use_and_session_revocation(client: TestClient, db_session: Session, customer_user: User):
    # 1. Obtain an active access token before reset
    login_res = client.post("/api/auth/login", json={
        "email": "customer@test.io",
        "password": "CustPass123!"
    })
    old_access_token = login_res.json()["access_token"]

    # Verify old token works initially
    headers = {"Authorization": f"Bearer {old_access_token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200

    # 2. Simulate forgot password token creation
    raw_token = "secret-reset-token-xyz"
    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    reset_entry = PasswordResetToken(
        user_id=customer_user.id,
        token_hash=token_hash,
        expires_at=now + timedelta(minutes=30),
        used=False
    )
    db_session.add(reset_entry)
    db_session.commit()

    # 3. Perform reset
    reset_res = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewSecretPass456#"
    })
    assert reset_res.status_code == 200

    # 4. Old access token MUST be revoked (token_version incremented)
    me_revoked = client.get("/api/auth/me", headers=headers)
    assert me_revoked.status_code == 401
    assert "revoked" in me_revoked.json()["detail"].lower()

    # 5. Token is single-use; second attempt with same token fails
    reset_res_retry = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "AnotherNewPass789$"
    })
    assert reset_res_retry.status_code == 400

    # 6. Can log in with new password
    new_login = client.post("/api/auth/login", json={
        "email": "customer@test.io",
        "password": "NewSecretPass456#"
    })
    assert new_login.status_code == 200

