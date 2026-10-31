import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.exceptions import BusinessRuleError

logger = logging.getLogger("brightloop.errors")


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(BusinessRuleError)
    async def business_rule_error_handler(request: Request, exc: BusinessRuleError):
        req_id = getattr(request.state, "request_id", None)
        logger.warning(
            f"BusinessRuleError: code={exc.code}, status={exc.status_code}, field={exc.field}, message={exc.message}, request_id={req_id}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": exc.code,
                "message": exc.message,
                "field": exc.field,
                "detail": exc.message,  # Backwards compatibility
            },
            headers={"X-Request-ID": req_id} if req_id else {}
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = getattr(request.state, "request_id", None)
        status_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            422: "UNPROCESSABLE_ENTITY",
            429: "TOO_MANY_REQUESTS",
            500: "INTERNAL_SERVER_ERROR",
        }
        code = status_map.get(exc.status_code, f"HTTP_{exc.status_code}")
        msg = str(exc.detail) if exc.detail else "An error occurred."
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": code,
                "message": msg,
                "field": None,
                "detail": msg,
            },
            headers={"X-Request-ID": req_id} if req_id else {}
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        req_id = getattr(request.state, "request_id", None)
        errors = exc.errors()
        first_err = errors[0] if errors else {}
        loc = first_err.get("loc", [])
        field_name = str(loc[-1]) if loc else None
        msg = first_err.get("msg", "Validation error")

        return JSONResponse(
            status_code=422,
            content={
                "code": "VALIDATION_ERROR",
                "message": msg,
                "field": field_name,
                "detail": msg,
            },
            headers={"X-Request-ID": req_id} if req_id else {}
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        req_id = getattr(request.state, "request_id", None)
        logger.error(f"IntegrityError: {exc.orig if hasattr(exc, 'orig') else exc}, request_id={req_id}")
        return JSONResponse(
            status_code=409,
            content={
                "code": "CONFLICT",
                "message": "A database conflict occurred with existing unique records.",
                "field": None,
                "detail": "A database conflict occurred with existing unique records.",
            },
            headers={"X-Request-ID": req_id} if req_id else {}
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
        req_id = getattr(request.state, "request_id", None)
        logger.error(f"SQLAlchemyError: {exc}, request_id={req_id}")
        return JSONResponse(
            status_code=500,
            content={
                "code": "DATABASE_ERROR",
                "message": "An internal database error occurred.",
                "field": None,
                "detail": "An internal database error occurred.",
            },
            headers={"X-Request-ID": req_id} if req_id else {}
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        req_id = getattr(request.state, "request_id", None)
        logger.exception(f"Unhandled Server Error: {exc}, request_id={req_id}")
        return JSONResponse(
            status_code=500,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
                "field": None,
                "detail": "An unexpected server error occurred.",
            },
            headers={"X-Request-ID": req_id} if req_id else {}
        )

