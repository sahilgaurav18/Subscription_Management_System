export interface ModuleTileData {
  id: string;
  title: string;
  category: string;
  tooltip: string;
  accent: 'plum' | 'amber' | 'teal' | 'coral' | 'sky';
}

export const MODULE_TILES: ModuleTileData[] = [
  {
    id: 'plans',
    title: 'Plans & Variants',
    category: 'Catalog',
    tooltip: 'Define daily, weekly, monthly or yearly recurring contracts with variant pricing.',
    accent: 'plum',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    category: 'Lifecycle',
    tooltip: 'Govern quotes, activations, pauses, auto-close and contract renewals.',
    accent: 'teal',
  },
  {
    id: 'invoices',
    title: 'Invoices',
    category: 'Billing',
    tooltip: 'Automated nightly billing runs generate immutable locked invoices with zero duplicates.',
    accent: 'amber',
  },
  {
    id: 'payments',
    title: 'Payments',
    category: 'Finance',
    tooltip: 'Record transactions, prevent overpayment, and auto-settle balances.',
    accent: 'coral',
  },
  {
    id: 'taxes',
    title: 'Taxes & Discounts',
    category: 'Rules',
    tooltip: 'Admin-configured tax rules and automatic best-single-discount application.',
    accent: 'sky',
  },
  {
    id: 'reports',
    title: 'Reports & MRR',
    category: 'Analytics',
    tooltip: 'Live SSE financial dashboard with aging overdue schedules and CSV exports.',
    accent: 'plum',
  },
];

export interface SimSubscription {
  id: number;
  subNumber: string;
  customerName: string;
  planName: string;
  period: 'monthly' | 'weekly' | 'yearly';
  amount: number; // in minor units / cents
  taxPercent: number;
  discountDollars: number;
  status: 'active' | 'processing' | 'billed';
  nextInvoice: string;
}

export const SIM_SUBSCRIPTIONS: SimSubscription[] = [
  {
    id: 1,
    subNumber: 'SUB-2026-001',
    customerName: 'Starlight Studio',
    planName: 'Pro Monthly',
    period: 'monthly',
    amount: 9900,
    taxPercent: 5,
    discountDollars: 0,
    status: 'active',
    nextInvoice: 'Today',
  },
  {
    id: 2,
    subNumber: 'SUB-2026-002',
    customerName: 'Acme Cloud Corp',
    planName: 'Enterprise Annual',
    period: 'yearly',
    amount: 49000,
    taxPercent: 18,
    discountDollars: 50,
    status: 'active',
    nextInvoice: 'Today',
  },
  {
    id: 3,
    subNumber: 'SUB-2026-003',
    customerName: 'Horizon Labs',
    planName: 'Standard Monthly',
    period: 'monthly',
    amount: 7500,
    taxPercent: 5,
    discountDollars: 0,
    status: 'active',
    nextInvoice: 'Today',
  },
  {
    id: 4,
    subNumber: 'SUB-2026-004',
    customerName: 'Apex Logistics LLC',
    planName: 'Team Weekly',
    period: 'weekly',
    amount: 2900,
    taxPercent: 0,
    discountDollars: 0,
    status: 'active',
    nextInvoice: 'Today',
  },
  {
    id: 5,
    subNumber: 'SUB-2026-005',
    customerName: 'Zenith Media',
    planName: 'Pro Monthly',
    period: 'monthly',
    amount: 15000,
    taxPercent: 5,
    discountDollars: 20,
    status: 'active',
    nextInvoice: 'Today',
  },
  {
    id: 6,
    subNumber: 'SUB-2026-006',
    customerName: 'Vertex AI Systems',
    planName: 'Dedicated Cluster',
    period: 'monthly',
    amount: 25000,
    taxPercent: 18,
    discountDollars: 0,
    status: 'active',
    nextInvoice: 'Today',
  },
];

export interface SimInvoice {
  id: number;
  invoiceNumber: string;
  subNumber: string;
  customerName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  balanceDue: number;
  isPaid: boolean;
  status: 'confirmed' | 'paid';
}

export interface PainFixItem {
  pain: string;
  fix: string;
}

export const PAIN_FIX_ITEMS: PainFixItem[] = [
  {
    pain: 'Missed renewals & unbilled periods',
    fix: 'Deterministic nightly worker with automatic catch-up',
  },
  {
    pain: 'Hand-typed invoice totals & miscalculations',
    fix: 'System-generated immutable PDF invoices with verified tax engine',
  },
  {
    pain: 'Payments matched by manually scrolling bank feeds',
    fix: 'Payments recorded directly against invoices with balance enforcement',
  },
  {
    pain: 'Quarterly stale reporting in spreadsheets',
    fix: 'Real-time financial dashboard streaming active MRR & overdue aging',
  },
];

export interface LifecycleStep {
  stage: 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed';
  label: string;
  badgeText: string;
  badgeClass: string;
  caption: string;
  description: string;
}

export const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    stage: 'draft',
    label: '1. Draft',
    badgeText: 'Draft',
    badgeClass: 'bg-[#F6F5F7] text-[#6D6572] border-[#E3DFE5]',
    caption: 'Template copied & line items drafted',
    description: 'Select customer, choose products, apply initial variants and configure validity dates.',
  },
  {
    stage: 'quotation',
    label: '2. Quotation',
    badgeText: 'Quotation',
    badgeClass: 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]',
    caption: 'Price locked & validity countdown started',
    description: 'Unit prices and terms are locked. Quote can be accepted by the customer online.',
  },
  {
    stage: 'confirmed',
    label: '3. Confirmed',
    badgeText: 'Confirmed',
    badgeClass: 'bg-[#FFFBEB] text-[#B7791F] border-[#FEEBC8]',
    caption: 'Contract confirmed & ready for start',
    description: 'Terms agreed. Customer is primed for recurring billing and customer portal credentials.',
  },
  {
    stage: 'active',
    label: '4. Active',
    badgeText: 'Active',
    badgeClass: 'bg-[#EDFDF5] text-[#1E8E5A] border-[#C6F6D5]',
    caption: 'Recurring billing cycles running automatically',
    description: 'Invoices generated each period without manual entry. Payments recorded seamlessly.',
  },
  {
    stage: 'closed',
    label: '5. Closed',
    badgeText: 'Closed',
    badgeClass: 'bg-[#F6F5F7] text-[#6D6572] border-[#E3DFE5]',
    caption: 'Auto-closed at expiry or terminated gracefully',
    description: 'Contract completed or closed by customer/admin. Historical billing record preserved.',
  },
];

export interface PlaygroundProduct {
  id: string;
  name: string;
  basePrice: number; // in dollars
  description: string;
}

export const PLAYGROUND_PRODUCTS: PlaygroundProduct[] = [
  {
    id: 'api-gateway',
    name: 'Cloud API Gateway',
    basePrice: 49,
    description: 'High-throughput secure API proxy with automatic routing',
  },
  {
    id: 'analytics',
    name: 'Analytics Suite',
    basePrice: 99,
    description: 'Real-time telemetry, MRR tracking and metric dashboards',
  },
  {
    id: 'enterprise-suite',
    name: 'Enterprise Suite',
    basePrice: 199,
    description: 'Complete billing automation with dedicated worker and SLA',
  },
];

export interface PlaygroundVariant {
  id: string;
  name: string;
  extraPrice: number; // in dollars
}

export const PLAYGROUND_VARIANTS: PlaygroundVariant[] = [
  { id: 'standard', name: 'Standard Edition', extraPrice: 0 },
  { id: 'pro', name: 'Pro Edition (+$25)', extraPrice: 25 },
  { id: 'enterprise', name: 'Enterprise Edition (+$60)', extraPrice: 60 },
];

export interface BentoBenefit {
  id: string;
  title: string;
  description: string;
  badge: string;
  accent: 'plum' | 'amber' | 'teal' | 'coral' | 'sky';
}

export const BENTO_BENEFITS: BentoBenefit[] = [
  {
    id: 'no-double-billing',
    title: 'No Double Billing',
    description: 'Deterministic database constraints ensure active subscriptions are billed exactly once per period.',
    badge: 'Zero Duplicates',
    accent: 'plum',
  },
  {
    id: 'no-skipped-renewals',
    title: 'No Skipped Renewals',
    description: 'Nightly worker catches up missed periods automatically if scheduled jobs or servers were offline.',
    badge: '100% Reliable',
    accent: 'teal',
  },
  {
    id: 'rbac',
    title: 'Role-Based Access Control',
    description: 'Strict server-side enforcement across Admin, Staff, and Customer user accounts with audit logs.',
    badge: 'RBAC Enforced',
    accent: 'sky',
  },
  {
    id: 'portal',
    title: 'Customer Self-Service Portal',
    description: 'Customers view their subscriptions, download official PDF invoices, and monitor balances 24/7.',
    badge: 'Self-Serve',
    accent: 'coral',
  },
  {
    id: 'discounts-taxes',
    title: 'Automated Tax & Discount Engine',
    description: 'Calculates jurisdictional tax rules and verifies best single promo codes directly at invoice creation.',
    badge: 'Automated Math',
    accent: 'amber',
  },
  {
    id: 'performance',
    title: 'Sub-2 Second Performance',
    description: 'Optimized SQL aggregate queries and indexed schemas tested across 50,000+ invoices.',
    badge: '< 2s Response',
    accent: 'plum',
  },
];

export interface TourSlide {
  id: string;
  title: string;
  tagline: string;
  description: string;
  highlight: string;
}

export const TOUR_SLIDES: TourSlide[] = [
  {
    id: 'subscriptions',
    title: 'Subscription Governance',
    tagline: 'Manage every stage of recurring contracts',
    description: 'From customized quotations to auto-renewing commitments, track plan flags, next billing dates, and pauses from a single unified view.',
    highlight: '6 status states with rule enforcement',
  },
  {
    id: 'invoices',
    title: 'Automated Invoicing Engine',
    tagline: 'Nightly background job with locked records',
    description: 'Generate locked PDF invoices with exact itemized lines, calculated tax rates, and automatic promo discount usage tracking.',
    highlight: 'Zero double billing guarantee',
  },
  {
    id: 'payments',
    title: 'Payment Reconciliation',
    tagline: 'Record payments and avoid overpayment',
    description: 'Accept credit card, bank transfer, and cash entries with instant balance due adjustment and audit trail recording.',
    highlight: 'Real-time balance deduction',
  },
  {
    id: 'dashboard',
    title: 'Real-Time Financial Dashboard',
    tagline: 'Live MRR, aging overdue invoices, and reports',
    description: 'Stream live updates via Server-Sent Events without reloading. View revenue by month and export clean CSV reports instantly.',
    highlight: 'Instant SSE live sync',
  },
];

export interface RoleConfig {
  role: 'admin' | 'staff' | 'customer';
  title: string;
  badge: string;
  summary: string;
  visibleModules: string[];
  permissions: string[];
}

export const ROLE_CONFIGS: Record<'admin' | 'staff' | 'customer', RoleConfig> = {
  admin: {
    role: 'admin',
    title: 'Administrator',
    badge: 'Full Access',
    summary: 'Master control over product catalog, plan definitions, staff invites, tax rules, and billing triggers.',
    visibleModules: ['Dashboard & MRR', 'Product Catalog & Variants', 'Plans & Periods', 'Taxes & Discounts', 'Staff User Management', 'Audit Trail Logs'],
    permissions: ['Create staff accounts', 'Configure tax & promo rules', 'Trigger manual billing runs', 'View all financial aggregates'],
  },
  staff: {
    role: 'staff',
    title: 'Staff Member',
    badge: 'Operations',
    summary: 'Operational control to create customer accounts, build quotations, manage subscriptions, and record payments.',
    visibleModules: ['Finance Dashboard (Read-Only)', 'Customer Management', 'Quotations & Subscriptions', 'Invoice Review', 'Payment Recording'],
    permissions: ['Draft & confirm quotations', 'Record customer payments', 'View customer details', 'Read-only financial reports'],
  },
  customer: {
    role: 'customer',
    title: 'Customer Portal',
    badge: 'Self-Serve',
    summary: 'Isolated customer view to review active subscriptions, inspect itemized invoices, and print receipts.',
    visibleModules: ['My Active Subscriptions', 'My Invoices & Receipts', 'Balance Due Tracking', 'Print PDF Invoices'],
    permissions: ['View own subscriptions', 'Self-close subscription if allowed', 'Print verified invoices', 'Zero access to other customer records'],
  },
};

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'q1',
    category: 'Billing',
    question: 'How does Brightloop prevent duplicate billing?',
    answer: 'Every invoice is governed by unique database constraints locking the subscription ID and billing period start/end dates. Running the automated billing job multiple times will only generate invoices for new, unbilled periods.',
  },
  {
    id: 'q2',
    category: 'Billing',
    question: 'What happens if the billing worker was offline during a scheduled run?',
    answer: 'Brightloop features automatic missed-period catch-up. When the worker resumes, it detects any active subscription whose next invoice date has passed and generates the missed invoices sequentially without skipping revenue.',
  },
  {
    id: 'q3',
    category: 'Discounts & Taxes',
    question: 'How are discounts and sales taxes calculated?',
    answer: 'Taxes are calculated based on active admin-configured rates (e.g. 5%, 18%). Discounts are validated for eligibility (usage limit, expiry date, minimum quantity or purchase amount), and the single highest-value discount is automatically applied per invoice.',
  },
  {
    id: 'q4',
    category: 'Security',
    question: 'How is customer data isolated?',
    answer: 'Customer portal routes strictly scope database queries by the authenticated user customer_id. Customers cannot query, view, or modify invoices or contracts belonging to any other company.',
  },
  {
    id: 'q5',
    category: 'Payments',
    question: 'Can customers be overcharged or make overpayments?',
    answer: 'No. The payment engine validates payments against the invoice balance_due in the same database transaction. Any payment exceeding the outstanding balance is rejected with a clear business rule error.',
  },
  {
    id: 'q6',
    category: 'Contracts',
    question: 'What lifecycle actions can a subscription go through?',
    answer: 'Subscriptions progress through Draft → Quotation → Confirmed → Active → Closed. Active subscriptions can be paused, renewed, or auto-closed at expiry based on the plan governance flags.',
  },
];

