from typing import Optional, Any, Dict


class BusinessRuleError(Exception):
    """Base exception for all business-rule violations."""
    def __init__(
        self,
        message: str,
        code: str = "BUSINESS_RULE_ERROR",
        status_code: int = 400,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.field = field
        self.details = details or {}


class OverpaymentError(BusinessRuleError):
    def __init__(self, message: str = "Payment amount exceeds balance due. Overpayment is refused.", field: Optional[str] = "amount"):
        super().__init__(
            message=message,
            code="OVERPAYMENT_REFUSED",
            status_code=400,
            field=field,
        )


class InvalidStatusTransitionError(BusinessRuleError):
    def __init__(self, message: str, field: Optional[str] = "status"):
        super().__init__(
            message=message,
            code="INVALID_STATUS_TRANSITION",
            status_code=400,
            field=field,
        )


class PlanFlagNotAllowedError(BusinessRuleError):
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            code="PLAN_FLAG_NOT_ALLOWED",
            status_code=400,
            field=field,
        )


class ExpiredQuotationError(BusinessRuleError):
    def __init__(self, message: str = "Quotation has expired and cannot be confirmed.", field: Optional[str] = None):
        super().__init__(
            message=message,
            code="EXPIRED_QUOTATION",
            status_code=400,
            field=field,
        )


class ResourceNotFoundError(BusinessRuleError):
    def __init__(self, message: str = "Requested resource not found.", field: Optional[str] = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            field=field,
        )


class ConflictError(BusinessRuleError):
    def __init__(self, message: str = "Resource conflict with existing records.", field: Optional[str] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            field=field,
        )


class UnauthorizedError(BusinessRuleError):
    def __init__(self, message: str = "Authentication required.", field: Optional[str] = None):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401,
            field=field,
        )


class ForbiddenError(BusinessRuleError):
    def __init__(self, message: str = "You do not have permission to perform this action.", field: Optional[str] = None):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
            field=field,
        )

