from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.subscription import Subscription, SubscriptionLine, QuotationTemplate, QuotationTemplateLine
from app.repositories.base import BaseRepository


class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self, db: Session):
        super().__init__(Subscription, db)

    def get_by_number(self, number: str) -> Optional[Subscription]:
        return self.db.query(Subscription).filter(Subscription.number == number).first()

    def get_customer_subscriptions(self, customer_id: int) -> List[Subscription]:
        return self.db.query(Subscription).filter(Subscription.customer_id == customer_id).order_by(Subscription.id.desc()).all()


class QuotationTemplateRepository(BaseRepository[QuotationTemplate]):
    def __init__(self, db: Session):
        super().__init__(QuotationTemplate, db)

    def get_by_name(self, name: str) -> Optional[QuotationTemplate]:
        return self.db.query(QuotationTemplate).filter(QuotationTemplate.name == name).first()

