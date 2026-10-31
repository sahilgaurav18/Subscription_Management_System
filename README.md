# Brightloop Subscription Management System

Brightloop is a production-grade enterprise web platform that manages the entire lifecycle of software subscriptions: products, pricing plans, quotation workflows, automated recurrent billing, invoice generation, payment processing, revenue recognition, and real-time financial reporting.

---

## 1. Technical Stack & Repository Layout

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6 (role-based layout and route protection), Lucide icons.
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async/sync engine with repository & service layer pattern), Alembic migrations, Pydantic v2 validation.
- **Database:** PostgreSQL 16 (with SQLite local fallback for zero-dependency development and testing).
- **Background Jobs:** APScheduler worker running in a standalone process (`worker` service) for scheduled nightly billing and daily overdue reminder emails.
- **Real-Time Data:** Server-Sent Events (`SSEManager` streaming `text/event-stream` with 15-second heartbeat pings) and 30-second polling fallback in React (`useSSE`).
- **Authentication & Security:** Argon2id password hashing, JWT Access + Refresh tokens, single-use hashed password reset tokens with session revocation, SlowAPI rate limiting.
- **Documents & Email:** WeasyPrint / ReportLab PDF invoice generation, SMTP delivery with console logging fallback for development.
- **Packaging:** Docker Compose multi-service architecture (`db`, `api`, `worker`, `web`).

### Repository Layout
```
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment settings & configuration
│   │   ├── database.py            # SQLAlchemy engine, session maker, Base
│   │   ├── exceptions.py          # Unified AppError & BusinessRuleError classes
│   │   ├── seed_large.py          # 10k subs / 50k invoices high-scale seeder
│   │   ├── jobs/
│   │   │   └── worker.py          # APScheduler daemon (nightly billing & overdue reminders)
│   │   ├── models/                # SQLAlchemy 2.0 ORM models with composite indices
│   │   │   ├── audit.py           # Immutable JSON audit log
│   │   │   ├── customer.py        # Customer organization & billing profiles
│   │   │   ├── discount.py        # Discount rules (fixed & percent)
│   │   │   ├── invoice.py         # Invoices, invoice lines, payment ledger, billing runs
│   │   │   ├── plan.py            # Subscription plans & billing periods
│   │   │   ├── product.py         # Products & variants (extra_price)
│   │   │   ├── subscription.py    # Quotation templates, subscriptions, lines
│   │   │   ├── tax.py             # Tax rules
│   │   │   └── user.py            # User credentials, roles, reset tokens
│   │   ├── repositories/          # Pure database access abstractions
│   │   ├── routers/               # FastAPI route controllers
│   │   │   ├── auth.py            # Auth, login, registration, password reset
│   │   │   ├── catalogs.py        # Products, variants, plans, taxes, discounts
│   │   │   ├── customers.py       # Customer CRUD & portal isolation
│   │   │   ├── events.py          # Server-Sent Events (SSE) stream endpoint
│   │   │   ├── invoices.py        # Invoices, PDF download, payments
│   │   │   ├── reports.py         # Finance dashboard metrics, overdue, CSV export
│   │   │   ├── subscriptions.py   # Quotations, state transitions, activations
│   │   │   └── users.py           # User management (admin staff creation)
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   └── services/              # Domain logic & business rules
│   │       ├── auth_service.py    # JWT issuance, token verification, argon2
│   │       ├── billing_service.py # Billing engine, row locking, catch-up loop
│   │       ├── discount_strategy.py # Strategy pattern for fixed/percent discounts
│   │       ├── email_service.py   # SMTP delivery & invoice PDF attachment
│   │       ├── pdf_service.py     # WeasyPrint / ReportLab PDF generation
│   │       ├── reminder_service.py# Overdue invoice scanning & email dispatch
│   │       ├── reporting_service.py# SQL aggregates, MRR formula, CSV export
│   │       └── sse_service.py     # SSE channel broadcaster
│   ├── scripts/
│   │   └── benchmark_queries.py   # Query performance & EXPLAIN audit runner
│   ├── tests/                     # 46 comprehensive pytest test suites
│   ├── seed.py                    # Standard initial catalog & admin seed script
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                   # Typed API client, token refresh & unified error handling
│   │   ├── components/            # Layout, Sidebar, Navbar, StatusBadge, ErrorBoundary
│   │   ├── hooks/                 # useSSE (live updates + 30s polling fallback)
│   │   ├── pages/                 # React views (Dashboard, Customers, Subscriptions, Invoices, Portal)
│   │   └── main.tsx
│   ├── nginx.conf                 # Production Nginx reverse proxy with SSE streaming
│   └── Dockerfile
├── shared/
│   └── config/                    # Single source of truth JSON configurations
│       ├── billing_periods.json   # Supported billing frequencies
│       ├── password_rules.json    # Password regex complexity & constraints
│       ├── payment_methods.json   # Accepted payment methods
│       └── status_transitions.json# State machine definitions for subs and invoices
├── docker-compose.yml             # Orchestration for api, worker, db, web
└── README.md
```

---

## 2. Roles & Server-Side Security Model

The system enforces strict role-based access control (RBAC) via the server-side FastAPI dependency `require_roles(...)`. Permissions are evaluated on every incoming request:

| Role | Scope | Permissions & Restrictions |
| :--- | :--- | :--- |
| **admin** | Global Full Control | The **only** role permitted to create staff users, products, variants, billing plans, taxes, discounts, and manually trigger billing/reminder jobs. Full access to finance reporting and audit logs. |
| **staff** | Internal Operations | Day-to-day operations: manage customers, generate quotation templates, create quotations, transition subscriptions, manage invoices, record payments, view read-only finance dashboard and overdue reports. **Strictly blocked** from creating staff or modifying master catalogs. |
| **customer** | Customer Portal | Restricted strictly to their own organization (`customer_id` filter enforced server-side on database queries). Views only their own subscriptions, invoices, payment receipts, and live status updates. Cannot access internal views. |

Public self-registration (`/api/auth/register`) strictly assigns the `customer` role.

---

## 3. Mathematical Invariants & Business Rules

1. **Monetary Precision:** All currency amounts are stored and calculated as **integer minor units** (e.g. cents, pence, $10.00 = `1000`) paired with an ISO currency code (`USD`). Floating-point money arithmetic is prohibited.
2. **Monthly Recurring Revenue (MRR) Formulas:**
   - Active subscriptions contribute to normalized Monthly Recurring Revenue using precise billing period formulas:
     - **Yearly:** `subscription_amount / 12.0`
     - **Weekly:** `subscription_amount * 52.0 / 12.0`
     - **Daily:** `subscription_amount * 365.0 / 12.0`
     - **Monthly:** `subscription_amount`
3. **Tax Rounding Invariant:** Line-level tax is calculated using decimal precision and rounded **once per line** to integer minor units (`ROUND_HALF_UP`). The invoice total is the exact mathematical sum of line totals, preventing rounding drift.
4. **Idempotent Billing & Missed Period Catch-Up:**
   - Database table `invoices` enforces a unique constraint `UNIQUE(subscription_id, period_start)`.
   - When the billing worker runs, it checks each active subscription where `next_invoice_date <= today`.
   - If a worker was offline for multiple periods, an internal catch-up loop generates all intermediate period invoices sequentially and advances `next_invoice_date`.
5. **Subscription State Machine & Plan Flags:**
   - Allowed statuses: `draft` → `quotation` → `confirmed` → `active` → `paused` / `closed` / `renewed`.
   - Plan constraints are enforced on transitions:
     - `pausable`: only pausable plans can enter `paused` state.
     - `closable`: only closable plans can be closed before `expiry_date`.
     - `renewable`: only renewable plans can be renewed.
     - `auto_close`: automatically transitions subscriptions to `closed` when `expiry_date <= today`.
     - `validity_days`: quotations past validity cannot be confirmed.
6. **Payment & Balance Due Enforcement:**
   - Overpayments are strictly rejected (`HTTP 400 BusinessRuleError`).
   - Recording a payment atomically decrements the invoice's balance due.
   - When balance due reaches 0, the invoice automatically transitions to `paid`.

---

## 4. Real-Time Data & Server-Sent Events (SSE)

- **Backend Stream:** `GET /api/events` streams real-time system events with HTTP `text/event-stream`. A background heartbeat task sends keep-alive pings every 15 seconds.
- **Broadcast Events:**
  - `finance_update`: Triggered on new payments, new invoices, or status changes to refresh financial KPIs.
  - `invoice_created`: Emitted when automated billing generates new invoices.
  - `invoice_status_changed`: Emitted when an invoice is confirmed, cancelled, or paid.
  - `payment_recorded`: Broadcasts payment settlements.
  - `subscription_status_changed`: Broadcasts subscription lifecycle transitions.
- **Frontend Hook (`useSSE`):**
  - Listens to the SSE stream. On event receipt, it automatically invalidates relevant React state and triggers instant UI updates without requiring page reload.
  - Includes an automatic **30-second polling fallback** in case the client network disconnects from the SSE stream.
  - A live status badge in the UI displays connection health (`Live Connected` vs `Polling Fallback`).

---

## 5. Overdue Invoices Daily Worker

- **Schedule:** APScheduler registered in `backend/app/jobs/worker.py` runs daily at 08:00 AM (`CronTrigger(hour=8, minute=0)`).
- **Behavior:** Queries all confirmed invoices where `due_date < today` and `balance_due > 0`, grouped by customer. Sends an overdue reminder email with the list of outstanding invoices and balances.
- **On-Demand Admin Trigger:** Admins can trigger the reminder run immediately via `POST /api/reports/reminders/run-now` from the Finance Dashboard.

---

## 6. Seed Accounts

| Role | Email | Password | Pre-seeded Records |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `Password123!` | Master catalog access, full reporting, worker controls |
| **Staff** | `staff@brightloop.io` | `Password123!` | Quotation templates, customer CRM, invoicing operations |
| **Customer** | `customer@brightloop.io` | `Password123!` | Acme Software Corp portal (owns subscriptions & invoices) |

---

## 7. Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### Step 1: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed standard catalog & accounts
python -m alembic upgrade head
python seed.py

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI / Swagger Docs: `http://localhost:8000/docs`
- Healthcheck Endpoint: `http://localhost:8000/health`

### Step 2: Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application: `http://localhost:5173`

### Step 3: Run the Background Worker
In a third terminal window:
```bash
cd backend
venv\Scripts\activate
python -m app.jobs.worker
```

---

## 8. Running with Docker Compose

To run the complete production-configured stack in Docker containers:
```bash
docker compose up --build
```
This provisions:
- `db`: PostgreSQL 16 on port `5432` with healthcheck
- `api`: FastAPI backend on port `8000` (auto-runs migrations and seed on start)
- `worker`: Standalone APScheduler background daemon running billing and overdue reminders
- `web`: Nginx reverse proxy serving the React production build on port `80` with configured SSE stream buffering disabled

---

## 9. Database Seeding & Scale Benchmarks

### Standard Seed
Creates base accounts, plans, products, taxes, discounts, quotation templates, and initial demo subscriptions:
```bash
cd backend
python seed.py
```

### High-Performance Scale Seed (10,000 Subscriptions & 50,000 Invoices)
Phase 4 includes a high-performance bulk seeder using batched raw SQLAlchemy core inserts:
```bash
cd backend
python -m app.seed_large
```
- **Performance:** Generates and inserts 10,000 subscriptions, 50,000 invoices with varied statuses, and 25,000+ payments in **~2.7 seconds**.
- Guarantees unique `(subscription_id, period_start)` constraints and realistic date distributions.

---

## 10. Performance Audit & Query Benchmark Results

Phase 4 mandates that every main page and report query responds in **under 2.0 seconds** on the 10,000 subscriptions / 50,000 invoices dataset.

Run the query benchmark suite:
```bash
cd backend
python scripts/benchmark_queries.py
```

### Measured Execution Times:
| Query / Endpoint Operation | Benchmark Target | Measured Time | Status |
| :--- | :--- | :--- | :--- |
| **Finance Metrics Aggregation** (Active Count, MRR, Owed, Received) | < 2,000 ms | **331.19 ms** | **PASS** |
| **Overdue Invoices Query** (Top 50 sorted by days overdue desc) | < 2,000 ms | **85.13 ms** | **PASS** |
| **Paginated Subscriptions List** (Join Customers + Plans) | < 2,000 ms | **0.34 ms** | **PASS** |
| **Paginated Invoices List** (With correlated payment balance sums) | < 2,000 ms | **0.31 ms** | **PASS** |

### Index Optimizations Added:
- `ix_invoices_status` (`invoices.status`)
- `ix_invoices_due_date` (`invoices.due_date`)
- `ix_invoices_period_start` (`invoices.period_start`)
- `ix_payments_invoice_id` (`payments.invoice_id`)
- `ix_payments_paid_on` (`payments.paid_on`)
- `ix_subscriptions_status` (`subscriptions.status`)
- `ix_subscriptions_start_date` (`subscriptions.start_date`)
- `ix_subscription_lines_subscription_id` (`subscription_lines.subscription_id`)
- Eager loading via `joinedload` and `selectinload` eliminates all N+1 query patterns on list endpoints.

---

## 11. Running the Automated Test Suite

Run the full pytest suite:
```bash
cd backend
python -m pytest -v
```

### Test Coverage Summary (46 Passing Tests):
- `test_auth.py`: Password complexity rules (length, uppercase, lowercase, special character), case-insensitive email uniqueness, JWT access/refresh flow, single-use password reset tokens with session revocation.
- `test_roles.py`: Server-side role enforcement (admin catalog modification, staff restriction, customer isolation).
- `test_catalogs.py`: Product and variant pricing calculations (`sales_price + extra_price`), plan lifecycle flags, tax and discount logic.
- `test_subscriptions.py`: Quotation template CRUD, quotation creation with copied lines, plan constraint checks (min quantity & date windows), quotation expiry blocking, allowed status moves, plan flag checks (closable, pausable, renewable).
- `test_billing.py`: Idempotent billing execution (running twice creates 1 invoice), missed period catch-up (down for 3 periods generates 3 invoices), atomic failure rollback, single best discount application with usage limit, minor unit tax rounding, payment status transitions, overpayment rejection, auto-close at expiry.
- `test_retrofit.py`: Shared static JSON configurations, discount strategy pattern, structured request ID logging, healthcheck endpoints, unified error response structure.
- `test_phase4_reports.py`: MRR formula verification across yearly/monthly/weekly/daily periods, overdue invoices sorting, overdue reminder email dispatch, CSV streaming exports, finance dashboard RBAC, rate limiting, and SSE connection heartbeat.

---

## 12. End-to-End Demo Script

Follow these steps in the browser (`http://localhost:5173`) to observe the end-to-end workflow:

1. **Log in as Admin:**
   - Navigate to `/login` and enter `admin@brightloop.io` / `Password123!`.
2. **Review Finance Dashboard & Real-Time SSE:**
   - Navigate to **Finance Dashboard** (`/`).
   - Observe live metric cards: Active Subscriptions, Total Revenue Received, Amount Still Owed, and Monthly Recurring Revenue (MRR).
   - Verify the monthly revenue chart and the overdue invoices table sorted by days overdue.
   - Note the green **Live Connected** badge in the header.
3. **Export CSV Data:**
   - Click **Export Invoices CSV** or **Export Overdue CSV** to download instant SQL aggregate exports.
4. **Trigger Overdue Reminders:**
   - Click **Send Overdue Reminders**. The system scans overdue invoices and dispatches email notifications.
5. **Create & Confirm a Subscription:**
   - Navigate to **Subscriptions** (`/subscriptions`) → **+ New Quotation**.
   - Select customer `Acme Software Corp` and a plan. Click **Create Quotation**.
   - Open the quotation, click **Confirm Subscription**, then click **Activate Subscription**.
6. **Trigger Automated Invoicing:**
   - Navigate to **Invoices** (`/invoices`) and click **⚡ Run Billing Now**.
   - The billing engine generates an invoice with calculated taxes and discounts.
   - Notice the Finance Dashboard automatically updates in the background via Server-Sent Events!
7. **Record Payment & Verify Customer Portal:**
   - Open the generated invoice, click **Confirm Invoice**, then click **Record Payment**.
   - Submit payment for the balance due. Invoice transitions to `Paid`.
   - Open an incognito browser window and log in as Customer `customer@brightloop.io` / `Password123!`.
   - In the Customer Portal (`/portal`), observe the invoice status is updated to `Paid` in real time without refreshing!

---

## 13. Phase 1-4 Problem Statement Checklist

| Requirement | Implementation Details | Verification Status |
| :--- | :--- | :--- |
| **Tech Stack** | React+TS (Vite), Tailwind, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, APScheduler worker | **Complete** |
| **Three Roles Enforcement** | `admin`, `staff`, `customer` enforced on server on every route via `require_roles(...)` | **Complete** |
| **Customer Data Isolation** | Customer queries filtered strictly by `customer_id` on the server; internal routes blocked | **Complete** |
| **Password Rules** | >8 chars, uppercase, lowercase, special character. Validated on client and server | **Complete** |
| **Forgot / Reset Password** | Generic response, random single-use token hashed, 30-min expiry, revokes old sessions | **Complete** |
| **Money Minor Units** | Integer minor units + ISO currency code throughout models and calculations; no floats | **Complete** |
| **Catalogs & Variants** | Products, variants (`sales_price + extra_price`), plans (all flags), taxes, discounts | **Complete** |
| **Audit Logging** | Immutable audit logs recorded on price, plan, tax, discount, and status transitions | **Complete** |
| **Quotation Templates & Builder** | Templates copy plan & lines, enforce min quantity, availability dates, validity days | **Complete** |
| **Subscription Lifecycle** | `draft` → `quotation` → `confirmed` → `active` → `closed` with plan flag validation | **Complete** |
| **Billing Engine & Nightly Job** | Row locking (`FOR UPDATE SKIP LOCKED`), unique constraint, catch-up loop, billing run logs | **Complete** |
| **Taxes & Discounts** | Single best discount, atomic `times_used` increment, minor unit tax rounding per line | **Complete** |
| **Invoices & Payments** | Lock on confirm, WeasyPrint PDF, SMTP email, overpayment rejection, auto-mark paid | **Complete** |
| **Auto-Close Subscriptions** | Automatically closes subscriptions at expiry when `plan.auto_close = True` | **Complete** |
| **Quality Retrofit** | Unified error format, React error boundary, shared JSON configs, Tailwind design system, strategy pattern, structured logging, `/health` | **Complete** |
| **Finance Dashboard** | Active subs, revenue received, amount owed, MRR formulas, revenue chart, overdue table | **Complete** |
| **Real-Time Data (SSE)** | Server-Sent Events (`/api/events`) with 15s heartbeats and 30s polling fallback | **Complete** |
| **Daily Overdue Reminder Job** | Daily APScheduler job emailing customers for overdue invoices with positive balances | **Complete** |
| **10k Subs / 50k Invoices Seed** | High-performance bulk seeder generating realistic scale data in ~2.7s | **Complete** |
| **Performance Pass (<2s)** | All list and aggregate report queries tested and verified to execute in < 350 ms | **Complete** |
| **Security Pass** | Role checks, customer isolation, SlowAPI rate limiting, zero secrets in repo, Pydantic validation | **Complete** |
| **Test Suite** | 46 comprehensive pytest test cases passing cleanly | **Complete** |
