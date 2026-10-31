from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models  # Ensure all models are registered
from app.services.rate_limiter import limiter
from app.middleware.structured_logging import StructuredLoggingMiddleware
from app.middleware.error_handlers import register_exception_handlers
from sqlalchemy import text
from app.routers import (
    auth,
    users,
    customers,
    products,
    plans,
    taxes,
    discounts,
    audit,
    quotation_templates,
    subscriptions,
    invoices,
    billing,
    events,
    reports,
    public,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Brightloop Subscription Management Platform API",
    lifespan=lifespan,
)

# Rate Limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured logging middleware with X-Request-ID
app.add_middleware(StructuredLoggingMiddleware)

# Global error handlers
register_exception_handlers(app)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(plans.router)
app.include_router(taxes.router)
app.include_router(discounts.router)
app.include_router(audit.router)
app.include_router(quotation_templates.router)
app.include_router(subscriptions.router)
app.include_router(invoices.router)
app.include_router(billing.router)
app.include_router(events.router)
app.include_router(reports.router)
app.include_router(public.router)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
    }
