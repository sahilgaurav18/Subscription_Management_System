from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductVariantCreate,
    ProductVariantUpdate,
    ProductVariantResponse,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.dependencies import require_admin, require_staff_or_admin
from app.services.audit_service import log_audit_event
from app.services.pagination import paginate_query

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    query = db.query(Product)

    if q:
        query = query.filter(Product.name.ilike(f"%{q.strip()}%"))
    if type:
        query = query.filter(Product.type == type)
    if date_from:
        query = query.filter(Product.created_at >= date_from)
    if date_to:
        query = query.filter(Product.created_at <= date_to)

    query = query.order_by(Product.id.desc())
    result = paginate_query(query, page, page_size)
    return {
        "items": [ProductResponse.model_validate(p) for p in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return ProductResponse.model_validate(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    req: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = Product(
        name=req.name.strip(),
        type=req.type.strip(),
        sales_price=req.sales_price,
        cost_price=req.cost_price,
        currency=req.currency.strip().upper(),
        notes=req.notes.strip() if req.notes else None,
    )
    db.add(product)
    db.flush()

    for v in req.variants:
        variant = ProductVariant(
            product_id=product.id,
            attribute=v.attribute.strip(),
            value=v.value.strip(),
            extra_price=v.extra_price,
        )
        db.add(variant)

    db.flush()

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CREATE",
        entity="product",
        entity_id=product.id,
        after={
            "name": product.name,
            "sales_price": product.sales_price,
            "cost_price": product.cost_price,
            "variants_count": len(req.variants)
        }
    )
    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    req: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    before_state = {
        "name": product.name,
        "type": product.type,
        "sales_price": product.sales_price,
        "cost_price": product.cost_price,
        "currency": product.currency,
        "notes": product.notes,
    }

    if req.name is not None:
        product.name = req.name.strip()
    if req.type is not None:
        product.type = req.type.strip()
    if req.sales_price is not None:
        product.sales_price = req.sales_price
    if req.cost_price is not None:
        product.cost_price = req.cost_price
    if req.currency is not None:
        product.currency = req.currency.strip().upper()
    if req.notes is not None:
        product.notes = req.notes.strip()

    after_state = {
        "name": product.name,
        "type": product.type,
        "sales_price": product.sales_price,
        "cost_price": product.cost_price,
        "currency": product.currency,
        "notes": product.notes,
    }

    # Audit log entry for price / product changes
    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="UPDATE",
        entity="product",
        entity_id=product.id,
        before=before_state,
        after=after_state
    )
    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", response_model=MessageResponse)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    before_state = {"name": product.name, "sales_price": product.sales_price}
    db.delete(product)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="DELETE",
        entity="product",
        entity_id=product_id,
        before=before_state
    )
    db.commit()
    return MessageResponse(message="Product deleted successfully.")


# Product Variant sub-routes
@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def add_product_variant(
    product_id: int,
    req: ProductVariantCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    variant = ProductVariant(
        product_id=product.id,
        attribute=req.attribute.strip(),
        value=req.value.strip(),
        extra_price=req.extra_price,
    )
    db.add(variant)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="CREATE",
        entity="product_variant",
        entity_id=variant.id,
        after={
            "product_id": product.id,
            "attribute": variant.attribute,
            "value": variant.value,
            "extra_price": variant.extra_price
        }
    )
    db.commit()
    db.refresh(variant)
    return ProductVariantResponse.model_validate(variant)


@router.delete("/variants/{variant_id}", response_model=MessageResponse)
def delete_product_variant(
    variant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found.")

    before_state = {
        "product_id": variant.product_id,
        "attribute": variant.attribute,
        "value": variant.value,
        "extra_price": variant.extra_price
    }
    db.delete(variant)

    log_audit_event(
        db=db,
        actor_id=admin.id,
        action="DELETE",
        entity="product_variant",
        entity_id=variant_id,
        before=before_state
    )
    db.commit()
    return MessageResponse(message="Product variant deleted successfully.")

