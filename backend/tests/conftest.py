import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app as fastapi_app
import app.models
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.services.auth_service import hash_password, create_access_token

# Use isolated SQLite in-memory DB for tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine_test)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session: Session) -> User:
    user = User(
        email="admin@test.io",
        password_hash=hash_password("AdminPass123!"),
        role=UserRole.ADMIN.value,
        is_active=True,
        token_version=1
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    return create_access_token(admin_user.id, admin_user.role, admin_user.token_version)


@pytest.fixture
def staff_user(db_session: Session) -> User:
    user = User(
        email="staff@test.io",
        password_hash=hash_password("StaffPass123!"),
        role=UserRole.STAFF.value,
        is_active=True,
        token_version=1
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def staff_token(staff_user: User) -> str:
    return create_access_token(staff_user.id, staff_user.role, staff_user.token_version)


@pytest.fixture
def customer_user(db_session: Session) -> User:
    customer = Customer(
        name="Test Customer Org",
        company="Customer LLC",
        billing_address="123 Test Ave",
        tax_id="TAX-12345"
    )
    db_session.add(customer)
    db_session.flush()

    user = User(
        email="customer@test.io",
        password_hash=hash_password("CustPass123!"),
        role=UserRole.CUSTOMER.value,
        customer_id=customer.id,
        is_active=True,
        token_version=1
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def customer_token(customer_user: User) -> str:
    return create_access_token(customer_user.id, customer_user.role, customer_user.token_version)
