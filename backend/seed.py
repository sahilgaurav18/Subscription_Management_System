import os
import sys
from decimal import Decimal
from datetime import datetime, timezone, timedelta

# Ensure backend root is in path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product, ProductVariant
from app.models.plan import Plan, BillingPeriod
from app.models.tax import Tax
from app.models.discount import Discount, DiscountType, DiscountScope, DiscountProduct
from app.models.subscription import QuotationTemplate, QuotationTemplateLine, Subscription, SubscriptionLine, SubscriptionStatus
from app.models.audit import AuditLog
from app.services.auth_service import hash_password
from app.services.audit_service import log_audit_event


def seed_database():
    print("Seeding database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Admin User
        admin_email = "admin@brightloop.io"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=hash_password("Password123!"),
                role=UserRole.ADMIN.value,
                is_active=True,
                token_version=1
            )
            db.add(admin)
            db.flush()
            print(f"Created Admin: {admin.email}")

        # 2. Seed Staff User
        staff_email = "staff@brightloop.io"
        staff = db.query(User).filter(User.email == staff_email).first()
        if not staff:
            staff = User(
                email=staff_email,
                password_hash=hash_password("Password123!"),
                role=UserRole.STAFF.value,
                is_active=True,
                token_version=1
            )
            db.add(staff)
            db.flush()
            print(f"Created Staff: {staff.email}")

        # 3. Seed Customers & Customer User
        customer_record = db.query(Customer).filter(Customer.name == "Acme Software Corp").first()
        if not customer_record:
            customer_record = Customer(
                name="Acme Software Corp",
                company="Acme Corporation",
                billing_address="100 Tech Boulevard, Suite 400, San Francisco, CA 94107",
                tax_id="US-94-8273619"
            )
            db.add(customer_record)
            db.flush()
            print(f"Created Customer: {customer_record.name}")

        customer_user_email = "customer@brightloop.io"
        customer_user = db.query(User).filter(User.email == customer_user_email).first()
        if not customer_user:
            customer_user = User(
                email=customer_user_email,
                password_hash=hash_password("Password123!"),
                role=UserRole.CUSTOMER.value,
                customer_id=customer_record.id,
                is_active=True,
                token_version=1
            )
            db.add(customer_user)
            db.flush()
            print(f"Created Customer User: {customer_user.email}")

        # 4. Seed Products and Variants
        cloud_platform = db.query(Product).filter(Product.name == "Brightloop Cloud Platform").first()
        if not cloud_platform:
            cloud_platform = Product(
                name="Brightloop Cloud Platform",
                type="software",
                sales_price=9900,  # $99.00
                cost_price=3000,   # $30.00
                currency="USD",
                notes="Core subscription management and multi-tenant billing engine"
            )
            db.add(cloud_platform)
            db.flush()

            # Add variants
            variants = [
                ProductVariant(product_id=cloud_platform.id, attribute="edition", value="Starter", extra_price=0),
                ProductVariant(product_id=cloud_platform.id, attribute="edition", value="Professional", extra_price=5000),  # +$50.00
                ProductVariant(product_id=cloud_platform.id, attribute="edition", value="Enterprise", extra_price=15000),   # +$150.00
            ]
            db.add_all(variants)
            db.flush()
            log_audit_event(db, admin.id, "CREATE", "product", cloud_platform.id, after={"name": cloud_platform.name})
            print(f"Created Product: {cloud_platform.name} with 3 variants")

        api_gateway = db.query(Product).filter(Product.name == "High-Throughput API Gateway").first()
        if not api_gateway:
            api_gateway = Product(
                name="High-Throughput API Gateway",
                type="service",
                sales_price=4900,  # $49.00
                cost_price=1500,   # $15.00
                currency="USD",
                notes="Dedicated webhook & API acceleration proxy"
            )
            db.add(api_gateway)
            db.flush()
            log_audit_event(db, admin.id, "CREATE", "product", api_gateway.id, after={"name": api_gateway.name})
            print(f"Created Product: {api_gateway.name}")

        # 5. Seed Plans
        plans_data = [
            {
                "name": "Standard Monthly",
                "price": 9900,  # $99.00
                "currency": "USD",
                "billing_period": BillingPeriod.MONTHLY.value,
                "min_quantity": 1,
                "auto_close": False,
                "closable": True,
                "pausable": True,
                "renewable": True,
            },
            {
                "name": "Enterprise Annual",
                "price": 99900,  # $999.00
                "currency": "USD",
                "billing_period": BillingPeriod.YEARLY.value,
                "min_quantity": 1,
                "auto_close": False,
                "closable": True,
                "pausable": True,
                "renewable": True,
            },
            {
                "name": "Trial 7-Day",
                "price": 0,
                "currency": "USD",
                "billing_period": BillingPeriod.DAILY.value,
                "min_quantity": 1,
                "auto_close": True,
                "closable": True,
                "pausable": False,
                "renewable": False,
            }
        ]
        for pdata in plans_data:
            existing_plan = db.query(Plan).filter(Plan.name == pdata["name"]).first()
            if not existing_plan:
                plan = Plan(**pdata)
                db.add(plan)
                db.flush()
                log_audit_event(db, admin.id, "CREATE", "plan", plan.id, after={"name": plan.name, "price": plan.price})
                print(f"Created Plan: {plan.name}")

        # 6. Seed Taxes
        taxes_data = [
            {"name": "Standard VAT (20%)", "rate_percent": Decimal("20.00")},
            {"name": "US Sales Tax (8.25%)", "rate_percent": Decimal("8.25")},
            {"name": "GST (18%)", "rate_percent": Decimal("18.00")},
            {"name": "Zero Rated (0%)", "rate_percent": Decimal("0.00")},
        ]
        for tdata in taxes_data:
            existing_tax = db.query(Tax).filter(Tax.name == tdata["name"]).first()
            if not existing_tax:
                tax = Tax(**tdata)
                db.add(tax)
                db.flush()
                log_audit_event(db, admin.id, "CREATE", "tax", tax.id, after={"name": tax.name, "rate": str(tax.rate_percent)})
                print(f"Created Tax: {tax.name}")

        # 7. Seed Discounts
        now = datetime.now(timezone.utc)
        discounts_data = [
            {
                "name": "Launch Special 20% Off",
                "code": "LAUNCH20",
                "type": DiscountType.PERCENT.value,
                "value": 20,  # 20%
                "min_purchase": 5000,  # $50 min
                "min_quantity": 1,
                "start_date": now - timedelta(days=5),
                "end_date": now + timedelta(days=90),
                "usage_limit": 500,
                "scope": DiscountScope.SUBSCRIPTION.value,
            },
            {
                "name": "Flat $15 Credit",
                "code": "FLAT15",
                "type": DiscountType.FIXED.value,
                "value": 1500,  # $15.00
                "min_purchase": 3000,  # $30 min
                "min_quantity": 1,
                "start_date": now - timedelta(days=1),
                "end_date": now + timedelta(days=60),
                "usage_limit": 100,
                "scope": DiscountScope.PRODUCT.value,
            }
        ]
        for ddata in discounts_data:
            existing_discount = db.query(Discount).filter(Discount.name == ddata["name"]).first()
            if not existing_discount:
                discount = Discount(**ddata)
                db.add(discount)
                db.flush()
                if cloud_platform and discount.scope == DiscountScope.PRODUCT.value:
                    db.add(DiscountProduct(discount_id=discount.id, product_id=cloud_platform.id))
                log_audit_event(db, admin.id, "CREATE", "discount", discount.id, after={"name": discount.name, "code": discount.code})
                print(f"Created Discount: {discount.name}")

        # 8. Seed Quotation Template
        monthly_plan = db.query(Plan).filter(Plan.name == "Standard Monthly").first()
        tpl = db.query(QuotationTemplate).filter(QuotationTemplate.name == "Enterprise Cloud Suite Template").first()
        if not tpl and monthly_plan and cloud_platform:
            tpl = QuotationTemplate(
                name="Enterprise Cloud Suite Template",
                validity_days=30,
                plan_id=monthly_plan.id,
            )
            db.add(tpl)
            db.flush()

            enterprise_variant = db.query(ProductVariant).filter(
                ProductVariant.product_id == cloud_platform.id,
                ProductVariant.value == "Enterprise"
            ).first()

            tpl_line = QuotationTemplateLine(
                template_id=tpl.id,
                product_id=cloud_platform.id,
                variant_id=enterprise_variant.id if enterprise_variant else None,
                quantity=2,
            )
            db.add(tpl_line)
            db.flush()
            print(f"Created Quotation Template: {tpl.name}")

        # 9. Seed Active Subscription for Customer
        sub_existing = db.query(Subscription).filter(Subscription.number == "SUB-000001").first()
        if not sub_existing and customer_record and monthly_plan and cloud_platform:
            now_dt = datetime.now(timezone.utc)
            sub = Subscription(
                number="SUB-000001",
                customer_id=customer_record.id,
                plan_id=monthly_plan.id,
                start_date=now_dt - timedelta(days=30),
                expiry_date=now_dt + timedelta(days=335),
                payment_terms="Net 30",
                status=SubscriptionStatus.ACTIVE.value,
                next_invoice_date=now_dt - timedelta(days=1),
            )
            db.add(sub)
            db.flush()

            standard_variant = db.query(ProductVariant).filter(
                ProductVariant.product_id == cloud_platform.id,
                ProductVariant.value == "Professional"
            ).first()

            standard_tax = db.query(Tax).first()
            unit_price = cloud_platform.sales_price + (standard_variant.extra_price if standard_variant else 0)
            sline = SubscriptionLine(
                subscription_id=sub.id,
                product_id=cloud_platform.id,
                variant_id=standard_variant.id if standard_variant else None,
                quantity=1,
                unit_price=unit_price,
                amount=unit_price,
                tax_id=standard_tax.id if standard_tax else None,
            )
            db.add(sline)
            db.flush()
            print(f"Created Seed Active Subscription: {sub.number} for {customer_record.name}")

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
