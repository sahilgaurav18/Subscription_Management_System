export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  customer_id?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  company?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  attribute: string;
  value: string;
  extra_price: number; // in minor units
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  type: string;
  sales_price: number; // in minor units
  cost_price: number;  // in minor units
  currency: string;
  notes?: string | null;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  price: number; // minor units
  currency: string;
  billing_period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  min_quantity: number;
  available_from?: string | null;
  available_to?: string | null;
  auto_close: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tax {
  id: number;
  name: string;
  rate_percent: string;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: number;
  name: string;
  code?: string | null;
  type: 'fixed' | 'percent';
  value: number; // minor units for fixed, % for percent
  min_purchase: number;
  min_quantity: number;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  times_used: number;
  scope: 'product' | 'subscription';
  linked_product_ids: number[];
  linked_subscription_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: number | null;
  actor_email?: string | null;
  action: string;
  entity: string;
  entity_id: string;
  before?: string | null;
  after?: string | null;
  created_at: string;
}

export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'paused' | 'closed';

export interface SubscriptionLine {
  id: number;
  subscription_id: number;
  product_id: number;
  product_name?: string | null;
  variant_id?: number | null;
  variant_attribute?: string | null;
  variant_value?: string | null;
  quantity: number;
  unit_price: number;
  tax_id?: number | null;
  tax_rate?: string | null;
  amount: number;
}

export interface Subscription {
  id: number;
  number: string;
  customer_id: number;
  customer_name?: string | null;
  customer_company?: string | null;
  customer_billing_address?: string | null;
  customer_tax_id?: string | null;
  plan_id: number;
  plan_name?: string | null;
  plan_billing_period?: string | null;
  plan_price?: number | null;
  plan_pausable?: boolean | null;
  plan_closable?: boolean | null;
  plan_renewable?: boolean | null;
  plan_auto_close?: boolean | null;
  start_date: string;
  expiry_date?: string | null;
  payment_terms: string;
  status: SubscriptionStatus;
  next_invoice_date?: string | null;
  total_amount: number;
  lines: SubscriptionLine[];
  created_at: string;
  updated_at: string;
}

export interface QuotationTemplateLine {
  id: number;
  product_id: number;
  product_name?: string | null;
  product_price?: number | null;
  variant_id?: number | null;
  variant_attribute?: string | null;
  variant_value?: string | null;
  variant_extra_price?: number | null;
  quantity: number;
}

export interface QuotationTemplate {
  id: number;
  name: string;
  validity_days: number;
  plan_id: number;
  plan_name?: string | null;
  plan_price?: number | null;
  plan_billing_period?: string | null;
  lines: QuotationTemplateLine[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
