import time
import random
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import insert, func

from app.database import engine, SessionLocal, Base
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product, ProductVariant
from app.models.plan import Plan, BillingPeriod
from app.models.tax import Tax
from app.models.subscription import Subscription, SubscriptionLine, SubscriptionStatus
from app.models.invoice import Invoice, InvoiceLine, InvoiceStatus, Payment
from app.services.auth_service import hash_password


def ensure_catalogs(db: Session) -> tuple[List[int], List[tuple[int, int]], List[int], int]:
    """Ensures customers, products, variants, plans, and taxes exist."""
    # 1. Admin & Staff
    if not db.query(User).filter(User.email == "admin@brightloop.io").first():
        admin = User(
            email="admin@brightloop.io",
            password_hash=hash_password("AdminSecure2026!"),
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        db.add(admin)

    if not db.query(User).filter(User.email == "staff@brightloop.io").first():
        staff = User(
            email="staff@brightloop.io",
            password_hash=hash_password("StaffSecure2026!"),
            role=UserRole.STAFF.value,
            is_active=True,
        )
        db.add(staff)
    db.commit()

    # 2. Customers
    existing_custs = db.query(Customer.id).all()
    cust_ids = [c[0] for c in existing_custs]
    if len(cust_ids) < 50:
        new_custs = []
        for i in range(len(cust_ids) + 1, 101):
            new_custs.append({
                "name": f"Enterprise Partner {i:03d}",
                "company": f"Corp Global {i:03d} LLC",
                "billing_address": f"{i*12} Innovation Blvd, Suite {i}, Tech City",
                "tax_id": f"VAT-US-{10000+i}",
            })
        db.execute(insert(Customer), new_custs)
        db.commit()
        cust_ids = [c[0] for c in db.query(Customer.id).all()]

    # 3. Tax
    tax = db.query(Tax).first()
    if not tax:
        tax = Tax(name="Standard VAT", rate_percent="20.00")
        db.add(tax)
        db.commit()
        db.refresh(tax)
    tax_id = tax.id

    # 4. Plans
    plans = db.query(Plan).all()
    if len(plans) < 4:
        sample_plans = [
            {"name": "Starter Daily", "price": 490, "billing_period": "daily", "min_quantity": 1},
            {"name": "Team Weekly", "price": 2900, "billing_period": "weekly", "min_quantity": 1},
            {"name": "Pro Monthly", "price": 9900, "billing_period": "monthly", "min_quantity": 1},
            {"name": "Enterprise Annual", "price": 99900, "billing_period": "yearly", "min_quantity": 1},
        ]
        for sp in sample_plans:
            if not db.query(Plan).filter(Plan.name == sp["name"]).first():
                db.add(Plan(
                    name=sp["name"],
                    price=sp["price"],
                    currency="USD",
                    billing_period=sp["billing_period"],
                    min_quantity=sp["min_quantity"],
                    auto_close=False,
                    closable=True,
                    pausable=True,
                    renewable=True,
                ))
        db.commit()
        plans = db.query(Plan).all()
    plan_ids = [p.id for p in plans]

    # 5. Products & Variants
    prods = db.query(Product).all()
    if len(prods) < 5:
        sample_prods = [
            ("Cloud Workspace Core", 4500, 1500),
            ("DevOps CI/CD Pipeline", 7500, 2500),
            ("Security & Audit Suite", 6000, 2000),
            ("AI Assistant Copilot", 3000, 1000),
            ("Database Backup Storage", 2000, 500),
        ]
        for name, sp, cp in sample_prods:
            if not db.query(Product).filter(Product.name == name).first():
                p = Product(name=name, type="software", sales_price=sp, cost_price=cp)
                db.add(p)
                db.commit()
                db.refresh(p)
                v = ProductVariant(product_id=p.id, attribute="tier", value="Standard", extra_price=500)
                db.add(v)
                db.commit()
        prods = db.query(Product).all()

    prod_variant_pairs: List[tuple[int, int]] = []
    for p in prods:
        v = db.query(ProductVariant).filter(ProductVariant.product_id == p.id).first()
        prod_variant_pairs.append((p.id, v.id if v else None))

    return cust_ids, prod_variant_pairs, plan_ids, tax_id


def seed_large_dataset(
    target_subscriptions: int = 10000,
    target_invoices: int = 50000,
    batch_size: int = 5000,
) -> Dict[str, Any]:
    """
    High-performance bulk seeder for stress testing and performance audits.
    Creates 10,000 subscriptions and 50,000 invoices with realistic payments and lines.
    """
    t_start = time.perf_counter()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        cust_ids, prod_variants, plan_ids, tax_id = ensure_catalogs(db)

        current_subs_count = db.query(func.count(Subscription.id)).scalar() or 0
        current_invs_count = db.query(func.count(Invoice.id)).scalar() or 0

        print(f"Current database state: {current_subs_count} subscriptions, {current_invs_count} invoices.")

        subs_to_create = max(0, target_subscriptions - current_subs_count)
        now_utc = datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # 1. Bulk Seed Subscriptions
        # -------------------------------------------------------------
        if subs_to_create > 0:
            print(f"Generating and bulk inserting {subs_to_create} subscriptions...")
            sub_status_weights = [
                ("active", 65),
                ("confirmed", 15),
                ("quotation", 8),
                ("paused", 5),
                ("closed", 5),
                ("draft", 2),
            ]
            statuses = [s for s, w in sub_status_weights for _ in range(w)]

            for start_idx in range(0, subs_to_create, batch_size):
                chunk_size = min(batch_size, subs_to_create - start_idx)
                sub_rows = []
                for i in range(chunk_size):
                    global_num = current_subs_count + start_idx + i + 1
                    status = random.choice(statuses)
                    days_ago = random.randint(10, 500)
                    start_date = now_utc - timedelta(days=days_ago)
                    expiry_date = start_date + timedelta(days=365)
                    next_inv = now_utc + timedelta(days=random.randint(-15, 30))

                    sub_rows.append({
                        "number": f"SUB-{global_num:06d}",
                        "customer_id": random.choice(cust_ids),
                        "plan_id": random.choice(plan_ids),
                        "start_date": start_date,
                        "expiry_date": expiry_date,
                        "payment_terms": random.choice(["Immediate", "Net 15", "Net 30"]),
                        "status": status,
                        "next_invoice_date": next_inv,
                        "created_at": start_date,
                        "updated_at": now_utc,
                    })

                db.execute(insert(Subscription), sub_rows)
                db.commit()
                print(f"  Inserted subscriptions chunk {start_idx + chunk_size}/{subs_to_create}...")

        # Refresh all subscription IDs
        all_sub_ids = [s[0] for s in db.query(Subscription.id).all()]

        # Ensure subscription lines exist for calculations
        existing_lines_count = db.query(func.count(SubscriptionLine.id)).scalar() or 0
        if existing_lines_count < len(all_sub_ids):
            print(f"Generating subscription lines for {len(all_sub_ids)} subscriptions...")
            line_rows = []
            for sub_id in all_sub_ids:
                p_id, v_id = random.choice(prod_variants)
                qty = random.randint(1, 5)
                unit_price = random.choice([2500, 4500, 6000, 9900])
                line_rows.append({
                    "subscription_id": sub_id,
                    "product_id": p_id,
                    "variant_id": v_id,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "tax_id": tax_id,
                    "amount": unit_price * qty,
                    "created_at": now_utc,
                    "updated_at": now_utc,
                })
                if len(line_rows) >= batch_size:
                    db.execute(insert(SubscriptionLine), line_rows)
                    db.commit()
                    line_rows = []
            if line_rows:
                db.execute(insert(SubscriptionLine), line_rows)
                db.commit()

        # -------------------------------------------------------------
        # 2. Bulk Seed Invoices & Payments
        # -------------------------------------------------------------
        current_invs_count = db.query(func.count(Invoice.id)).scalar() or 0
        invs_to_create = max(0, target_invoices - current_invs_count)

        if invs_to_create > 0:
            print(f"Generating and bulk inserting {invs_to_create} invoices with distinct periods per subscription...")
            inv_rows = []
            payment_rows = []
            invoices_per_sub = max(1, invs_to_create // len(all_sub_ids))
            current_inv_num = current_invs_count

            # Query subscription start dates
            sub_starts = dict(db.query(Subscription.id, Subscription.start_date).all())

            for sub_id in all_sub_ids:
                if current_inv_num >= current_invs_count + invs_to_create:
                    break

                base_start = sub_starts.get(sub_id) or (now_utc - timedelta(days=180))
                # Generate 5 consecutive periods for this subscription
                for period_idx in range(invoices_per_sub):
                    if current_inv_num >= current_invs_count + invs_to_create:
                        break

                    current_inv_num += 1
                    period_start = base_start + timedelta(days=period_idx * 30)
                    period_end = period_start + timedelta(days=30)

                    # Progressive statuses across lifecycle:
                    # Early periods are paid, middle periods paid/confirmed, latest period confirmed/draft
                    if period_idx < 3:
                        status = "paid"
                    elif period_idx == 3:
                        status = random.choice(["paid", "paid", "confirmed"])
                    else:
                        status = random.choice(["confirmed", "confirmed", "draft", "cancelled"])

                    # Due date logic
                    if status == "confirmed" and random.random() < 0.35:
                        due_date = now_utc - timedelta(days=random.randint(3, 45))  # overdue
                    else:
                        due_date = period_start + timedelta(days=15)

                    subtotal = random.choice([4500, 9900, 14400, 29900, 49900])
                    tax_amount = int(round(subtotal * 0.20))
                    discount_amount = random.choice([0, 0, 0, 500, 1000])
                    total = subtotal + tax_amount - discount_amount

                    inv_rows.append({
                        "number": f"INV-{current_inv_num:06d}",
                        "subscription_id": sub_id,
                        "period_start": period_start,
                        "period_end": period_end,
                        "status": status,
                        "subtotal": subtotal,
                        "tax_total": tax_amount,
                        "discount_total": discount_amount,
                        "total": total,
                        "due_date": due_date,
                        "created_at": period_start,
                        "updated_at": now_utc,
                    })

                    if len(inv_rows) >= batch_size:
                        db.execute(insert(Invoice), inv_rows)
                        db.commit()
                        print(f"  Inserted invoices chunk {current_inv_num}/{target_invoices}...")
                        inv_rows = []

            if inv_rows:
                db.execute(insert(Invoice), inv_rows)
                db.commit()
                print(f"  Inserted final invoices chunk {current_inv_num}/{target_invoices}...")

        # -------------------------------------------------------------
        # 3. Bulk Seed Payments
        # -------------------------------------------------------------
        print("Checking payment records for paid and partially paid invoices...")
        unpaid_paid_invs = (
            db.query(Invoice.id, Invoice.total, Invoice.status, Invoice.period_start)
            .filter(Invoice.status.in_(["paid", "confirmed"]))
            .outerjoin(Payment, Payment.invoice_id == Invoice.id)
            .filter(Payment.id == None)
            .limit(30000)
            .all()
        )

        if unpaid_paid_invs:
            print(f"Generating payments for {len(unpaid_paid_invs)} invoices...")
            payment_rows = []
            for inv_id, total, status, p_start in unpaid_paid_invs:
                if status == "paid":
                    amount = total
                else:
                    # 50% partial payment, 50% no payment
                    if random.random() < 0.5:
                        amount = int(round(total * random.choice([0.25, 0.5, 0.75])))
                    else:
                        continue

                paid_on = p_start + timedelta(days=random.randint(1, 14))
                payment_rows.append({
                    "invoice_id": inv_id,
                    "method": random.choice(["credit_card", "bank_transfer", "stripe"]),
                    "amount": amount,
                    "paid_on": paid_on,
                    "note": "Automated payment processing",
                    "created_at": paid_on,
                    "updated_at": paid_on,
                })

                if len(payment_rows) >= batch_size:
                    db.execute(insert(Payment), payment_rows)
                    db.commit()
                    payment_rows = []

            if payment_rows:
                db.execute(insert(Payment), payment_rows)
                db.commit()

        final_subs = db.query(func.count(Subscription.id)).scalar()
        final_invs = db.query(func.count(Invoice.id)).scalar()
        final_payments = db.query(func.count(Payment.id)).scalar()
        t_elapsed = time.perf_counter() - t_start

        summary = {
            "subscriptions_count": final_subs,
            "invoices_count": final_invs,
            "payments_count": final_payments,
            "elapsed_seconds": round(t_elapsed, 2),
        }
        print(f"Database seeding completed in {summary['elapsed_seconds']}s.")
        print(f"Total: {final_subs} subscriptions, {final_invs} invoices, {final_payments} payments.")
        return summary

    finally:
        db.close()


if __name__ == "__main__":
    seed_large_dataset()
