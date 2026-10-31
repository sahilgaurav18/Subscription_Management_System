import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoice, normalizeToMonthly } from './calculator.ts';

test('calculateInvoice: base monthly with 0% tax', () => {
  const result = calculateInvoice({
    basePrice: 99,
    variantExtra: 0,
    billingPeriod: 'monthly',
    quantity: 1,
    taxPercent: 0,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.unitPrice, 99);
  assert.equal(result.subtotal, 99);
  assert.equal(result.discountAmount, 0);
  assert.equal(result.taxAmount, 0);
  assert.equal(result.total, 99);
  assert.equal(result.effectiveMonthlyValue, 99);
});

test('calculateInvoice: applies variant extra surcharge and tax rate', () => {
  const result = calculateInvoice({
    basePrice: 99,
    variantExtra: 25, // Pro Edition +$25
    billingPeriod: 'monthly',
    quantity: 2,
    taxPercent: 5,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.unitPrice, 124);
  assert.equal(result.subtotal, 248);
  assert.equal(result.discountAmount, 0);
  assert.equal(result.taxAmount, 12.4);
  assert.equal(result.total, 260.4);
});

test('calculateInvoice: SEATS10 discount applied for quantity >= 10', () => {
  const result = calculateInvoice({
    basePrice: 50,
    billingPeriod: 'monthly',
    quantity: 10,
    discountCode: 'SEATS10',
    taxPercent: 0,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.subtotal, 500);
  assert.equal(result.discountAmount, 50); // 10% of 500
  assert.equal(result.total, 450);
});

test('calculateInvoice: SEATS10 rejected if quantity < 10', () => {
  const result = calculateInvoice({
    basePrice: 50,
    billingPeriod: 'monthly',
    quantity: 5,
    discountCode: 'SEATS10',
    taxPercent: 0,
  });

  assert.equal(result.isValid, false);
  assert.match(result.errorMessage || '', /minimum of 10 seats/);
});

test('calculateInvoice: WELCOME200 discount applied when subtotal >= 200', () => {
  const result = calculateInvoice({
    basePrice: 199,
    variantExtra: 60,
    billingPeriod: 'monthly',
    quantity: 1,
    discountCode: 'WELCOME200',
    taxPercent: 18,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.subtotal, 259);
  assert.equal(result.discountAmount, 200);
  // Tax on $59 at 18% = $10.62
  assert.equal(result.taxAmount, 10.62);
  assert.equal(result.total, 69.62);
});

test('calculateInvoice: rejects quantity below minQuantity', () => {
  const result = calculateInvoice({
    basePrice: 99,
    billingPeriod: 'monthly',
    quantity: 2,
    minQuantity: 5,
    taxPercent: 0,
  });

  assert.equal(result.isValid, false);
  assert.match(result.errorMessage || '', /at least 5/);
});

test('normalizeToMonthly: correctly normalizes annual, weekly, and daily rates', () => {
  assert.equal(normalizeToMonthly(1200, 'yearly'), 100);
  assert.equal(normalizeToMonthly(120, 'monthly'), 120);
  // Weekly: $10/wk * 52 / 12 = $43.33
  assert.equal(normalizeToMonthly(10, 'weekly'), 43.33);
  // Daily: $1/day * 365 / 12 = $30.42
  assert.equal(normalizeToMonthly(1, 'daily'), 30.42);
});
