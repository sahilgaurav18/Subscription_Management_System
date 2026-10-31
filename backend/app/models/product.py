from sqlalchemy import Column, String, Integer, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    name = Column(String(255), nullable=False, index=True)
    type = Column(String(50), nullable=False, default="software")  # e.g., software, service, license
    sales_price = Column(Integer, nullable=False, default=0)  # in minor units (e.g. cents)
    cost_price = Column(Integer, nullable=False, default=0)   # in minor units
    currency = Column(String(3), nullable=False, default="USD")
    notes = Column(Text, nullable=True)

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    discounts = relationship("DiscountProduct", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base, TimestampMixin):
    __tablename__ = "product_variants"

    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute = Column(String(100), nullable=False)  # e.g., brand, tier, edition
    value = Column(String(100), nullable=False)      # e.g., Odoo, Pro, Enterprise
    extra_price = Column(Integer, nullable=False, default=0)  # in minor units, e.g. 560 ($5.60)

    product = relationship("Product", back_populates="variants")

    __table_args__ = (
        Index("ix_variant_product_attr_val", product_id, attribute, value),
    )

