from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceLine, Payment
from app.repositories.base import BaseRepository


class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self, db: Session):
        super().__init__(Invoice, db)

    def get_by_number(self, number: str) -> Optional[Invoice]:
        return self.db.query(Invoice).filter(Invoice.number == number).first()

    def get_by_subscription_and_period(self, subscription_id: int, period_start) -> Optional[Invoice]:
        return self.db.query(Invoice).filter(
            Invoice.subscription_id == subscription_id,
            Invoice.period_start == period_start
        ).first()

    def add_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment

