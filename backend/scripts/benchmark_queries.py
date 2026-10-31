import os
import sys
import time

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import text
from app.database import SessionLocal, engine
from app.services.reporting_service import get_finance_metrics, get_overdue_invoices


def run_performance_benchmarks():
    db = SessionLocal()
    print("=" * 70)
    print("BRIGHTLOOP ENTERPRISE QUERY PERFORMANCE AUDIT (10k Subs, 50k Invoices)")
    print("=" * 70)

    # Dialect check
    dialect = engine.dialect.name
    print(f"Database Engine: {dialect.upper()}")

    benchmarks = []

    # 1. Finance Dashboard SQL Aggregates
    t0 = time.perf_counter()
    metrics = get_finance_metrics(db)
    t1 = time.perf_counter()
    dur_finance = (t1 - t0) * 1000
    benchmarks.append(("Finance Metrics Aggregation (Active, MRR, Owed, Received)", dur_finance))
    print(f"\n1. Finance Metrics Aggregation: {dur_finance:.2f} ms")
    print(f"   - Active Subscriptions: {metrics['active_subscriptions_count']}")
    print(f"   - Revenue Received:     ${metrics['revenue_received'] / 100:,.2f}")
    print(f"   - Amount Still Owed:    ${metrics['amount_still_owed'] / 100:,.2f}")
    print(f"   - Computed MRR:         ${metrics['mrr'] / 100:,.2f}")
    print(f"   - Monthly Revenue Bars: {len(metrics['revenue_by_month'])} months")

    # 2. Overdue Invoices Query (sorted by days overdue)
    t0 = time.perf_counter()
    overdue = get_overdue_invoices(db, limit=50)
    t1 = time.perf_counter()
    dur_overdue = (t1 - t0) * 1000
    benchmarks.append(("Overdue Invoices Query (Sorted by Days Overdue)", dur_overdue))
    print(f"\n2. Overdue Invoices Query (top 50): {dur_overdue:.2f} ms")
    print(f"   - Overdue Invoices Retrieved: {len(overdue)}")
    if overdue:
        top = overdue[0]
        print(f"   - Most Overdue: Invoice {top['number']} ({top['days_overdue']} days overdue, Balance: ${top['balance_due']/100:.2f})")

    # 3. Subscriptions Paginated List
    t0 = time.perf_counter()
    subs_sql = text("""
        SELECT s.id, s.number, s.status, s.next_invoice_date, c.name, p.name, p.billing_period
        FROM subscriptions s
        JOIN customers c ON c.id = s.customer_id
        JOIN plans p ON p.id = s.plan_id
        ORDER BY s.id DESC
        LIMIT 15 OFFSET 0
    """)
    subs_rows = db.execute(subs_sql).fetchall()
    t1 = time.perf_counter()
    dur_subs = (t1 - t0) * 1000
    benchmarks.append(("Subscriptions Paginated List (Join Customers + Plans)", dur_subs))
    print(f"\n3. Subscriptions Paginated List: {dur_subs:.2f} ms ({len(subs_rows)} rows)")

    # 4. Invoices Paginated List with Balances
    t0 = time.perf_counter()
    invs_sql = text("""
        SELECT i.id, i.number, i.status, i.total, i.due_date, s.number, c.name,
               COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) as paid
        FROM invoices i
        JOIN subscriptions s ON s.id = i.subscription_id
        JOIN customers c ON c.id = s.customer_id
        ORDER BY i.id DESC
        LIMIT 15 OFFSET 0
    """)
    invs_rows = db.execute(invs_sql).fetchall()
    t1 = time.perf_counter()
    dur_invs = (t1 - t0) * 1000
    benchmarks.append(("Invoices Paginated List with Correlated Payment Balances", dur_invs))
    print(f"\n4. Invoices Paginated List: {dur_invs:.2f} ms ({len(invs_rows)} rows)")

    # 5. EXPLAIN / EXPLAIN QUERY PLAN Output
    print("\n" + "=" * 70)
    print("QUERY EXECUTION PLAN (EXPLAIN / EXPLAIN QUERY PLAN):")
    print("=" * 70)
    explain_cmd = "EXPLAIN ANALYZE" if dialect == "postgresql" else "EXPLAIN QUERY PLAN"

    try:
        plan_rows = db.execute(text(f"{explain_cmd} {subs_sql.text}")).fetchall()
        print("\n[Subscriptions List Plan]:")
        for row in plan_rows:
            print("  ", row)
    except Exception as e:
        print(f"Could not run explain on subscriptions: {e}")

    try:
        plan_rows = db.execute(text(f"{explain_cmd} {invs_sql.text}")).fetchall()
        print("\n[Invoices List Plan]:")
        for row in plan_rows:
            print("  ", row)
    except Exception as e:
        print(f"Could not run explain on invoices: {e}")

    print("\n" + "=" * 70)
    print("BENCHMARK SUMMARY (Requirement: Under 2.00 seconds):")
    print("=" * 70)
    all_under_2s = True
    for name, dur_ms in benchmarks:
        status_str = "PASS (< 2000 ms)" if dur_ms < 2000 else "FAIL (> 2000 ms)"
        if dur_ms >= 2000:
            all_under_2s = False
        print(f"  • {name:<60}: {dur_ms:>7.2f} ms | {status_str}")

    print("=" * 70)
    print(f"AUDIT RESULT: {'ALL QUERIES RESPOND IN UNDER 2 SECONDS' if all_under_2s else 'SOME QUERIES EXCEEDED THRESHOLD'}")
    print("=" * 70)

    db.close()
    return benchmarks


if __name__ == "__main__":
    run_performance_benchmarks()
