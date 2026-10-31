export interface InvoiceCalculationInput {
  basePrice: number; // in dollars
  variantExtra?: number; // in dollars
  billingPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  quantity: number;
  minQuantity?: number;
  discountCode?: string;
  taxPercent: number; // e.g. 0, 5, 18
}

export interface InvoiceCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  discountCodeApplied?: string;
  taxAmount: number;
  total: number;
  effectiveMonthlyValue: number;
}

export function calculateInvoice(input: InvoiceCalculationInput): InvoiceCalculationResult {
  const minQty = input.minQuantity ?? 1;

  if (input.quantity < minQty) {
    return {
      isValid: false,
      errorMessage: `Quantity must be at least ${minQty} for this plan.`,
      unitPrice: 0,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
      effectiveMonthlyValue: 0,
    };
  }

  const variantExtra = input.variantExtra || 0;
  const unitPrice = input.basePrice + variantExtra;
  const subtotal = Math.round(unitPrice * input.quantity * 100) / 100;

  // Discount rule evaluation
  let discountAmount = 0;
  let discountCodeApplied: string | undefined = undefined;
  let codeError: string | undefined = undefined;

  const rawCode = (input.discountCode || '').trim().toUpperCase();

  if (rawCode) {
    if (rawCode === 'SEATS10') {
      if (input.quantity >= 10) {
        discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
        discountCodeApplied = 'SEATS10 (10% off 10+ seats)';
      } else {
        codeError = 'SEATS10 requires a minimum of 10 seats.';
      }
    } else if (rawCode === 'WELCOME200') {
      if (subtotal >= 200) {
        discountAmount = 200;
        discountCodeApplied = 'WELCOME200 ($200 welcome discount)';
      } else {
        codeError = 'WELCOME200 requires a minimum subtotal of $200.';
      }
    } else {
      codeError = `Unknown promo code "${rawCode}". Try SEATS10 or WELCOME200.`;
    }
  }

  if (codeError) {
    return {
      isValid: false,
      errorMessage: codeError,
      unitPrice,
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      total: subtotal,
      effectiveMonthlyValue: normalizeToMonthly(subtotal, input.billingPeriod),
    };
  }

  // Ensure discount does not exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * (input.taxPercent / 100) * 100) / 100;
  const total = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const effectiveMonthlyValue = normalizeToMonthly(total, input.billingPeriod);

  return {
    isValid: true,
    unitPrice,
    subtotal,
    discountAmount,
    discountCodeApplied,
    taxAmount,
    total,
    effectiveMonthlyValue,
  };
}

export function normalizeToMonthly(
  amount: number,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
): number {
  let monthly = amount;
  if (period === 'yearly') {
    monthly = amount / 12;
  } else if (period === 'weekly') {
    monthly = (amount * 52) / 12;
  } else if (period === 'daily') {
    monthly = (amount * 365) / 12;
  }
  return Math.round(monthly * 100) / 100;
}

