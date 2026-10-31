import React, { useState } from 'react';
import {
  PLAYGROUND_PRODUCTS,
  PLAYGROUND_VARIANTS,
} from '../../data/landingDemoData';
import { calculateInvoice } from '../../utils/calculator';
import { CountUp } from './CountUp';
import {
  Calculator,
  Plus,
  Minus,
  Tag,
  Receipt,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const PlanPlayground: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState('analytics');
  const [selectedVariantId, setSelectedVariantId] = useState('pro');
  const [billingPeriod, setBillingPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [quantity, setQuantity] = useState(5);
  const [discountCode, setDiscountCode] = useState('');
  const [taxPercent, setTaxPercent] = useState<number>(5);

  const product = PLAYGROUND_PRODUCTS.find((p) => p.id === selectedProductId) || PLAYGROUND_PRODUCTS[0];
  const variant = PLAYGROUND_VARIANTS.find((v) => v.id === selectedVariantId) || PLAYGROUND_VARIANTS[0];

  const calc = calculateInvoice({
    basePrice: product.basePrice,
    variantExtra: variant.extraPrice,
    billingPeriod,
    quantity,
    minQuantity: 1,
    discountCode: discountCode || undefined,
    taxPercent,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-[#E3DFE5] shadow-xl shadow-[#6B4A6B]/8 p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[#6B4A6B] font-bold text-[12px] uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                <span>Live Calculator</span>
              </div>
              <h3 className="font-caveat font-bold text-[36px] text-[#1F1A21] leading-tight mt-1">
                Design and calculate a custom contract
              </h3>
              <p className="text-[14px] text-[#6D6572]">
                Test our pure pricing algorithm with product variants, billing frequencies, promo codes, and taxes.
              </p>
            </div>

            {/* 1. Product Select */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#1F1A21]">
                1. Select Core Service
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PLAYGROUND_PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedProductId === p.id
                        ? 'bg-[#F1EAF1] border-[#6B4A6B] shadow-xs'
                        : 'bg-[#FAF9FA] border-[#E3DFE5] hover:border-[#6B4A6B]/50'
                    }`}
                  >
                    <div className="font-bold text-[13px] text-[#1F1A21]">{p.name}</div>
                    <div className="font-mono text-[12px] text-[#6B4A6B] font-semibold mt-0.5">
                      ${p.basePrice}/unit
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Variant Surcharge Select (Odoo style) */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#1F1A21]">
                2. Select Edition Variant (Surcharge)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PLAYGROUND_VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedVariantId === v.id
                        ? 'bg-[#F1EAF1] border-[#6B4A6B] shadow-xs'
                        : 'bg-[#FAF9FA] border-[#E3DFE5] hover:border-[#6B4A6B]/50'
                    }`}
                  >
                    <div className="font-semibold text-[12px] text-[#1F1A21]">{v.name}</div>
                    <div className="text-[11px] text-[#6D6572]">
                      {v.extraPrice > 0 ? `+ $${v.extraPrice} variant surcharge` : 'Included base price'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Billing Period & Quantity Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Billing Period */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#1F1A21]">
                  Billing Period
                </label>
                <div className="inline-flex w-full bg-[#FAF9FA] p-1 rounded-xl border border-[#E3DFE5]">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setBillingPeriod(period)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors capitalize ${
                        billingPeriod === period
                          ? 'bg-[#6B4A6B] text-white shadow-xs'
                          : 'text-[#6D6572] hover:text-[#1F1A21]'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#1F1A21]">
                  Quantity (Units / Seats)
                </label>
                <div className="flex items-center border border-[#E3DFE5] rounded-xl overflow-hidden bg-[#FAF9FA]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-[#6D6572] hover:text-[#1F1A21] hover:bg-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center bg-transparent font-mono font-bold text-[14px] text-[#1F1A21] focus:outline-none"
                    aria-label="Quantity value"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3.5 py-2 text-[#6D6572] hover:text-[#1F1A21] hover:bg-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Promo Code & Tax Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Promo Code Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[12px]">
                  <label className="font-semibold text-[#1F1A21]">Discount Code</label>
                  <span className="text-[11px] text-[#6D6572]">Try: SEATS10 or WELCOME200</span>
                </div>
                <div className="relative">
                  <Tag className="w-4 h-4 text-[#6D6572] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter code..."
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF9FA] border border-[#E3DFE5] rounded-xl text-[13px] font-mono uppercase text-[#1F1A21] focus:outline-none focus:border-[#6B4A6B]"
                  />
                </div>
              </div>

              {/* Tax Rate Selection */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#1F1A21]">
                  Tax Rule
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#FAF9FA] p-1 rounded-xl border border-[#E3DFE5]">
                  {[0, 5, 18].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTaxPercent(t)}
                      className={`py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                        taxPercent === t
                          ? 'bg-[#6B4A6B] text-white shadow-xs'
                          : 'text-[#6D6572] hover:text-[#1F1A21]'
                      }`}
                    >
                      {t}% Tax
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message Alert */}
            {!calc.isValid && calc.errorMessage && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[12px] text-[#C0392B] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{calc.errorMessage}</span>
              </div>
            )}
          </div>

          {/* Live Invoice Preview Column (5 cols) */}
          <div className="lg:col-span-5 bg-[#FAF9FA] rounded-2xl border border-[#E3DFE5] p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DFE5]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#6B4A6B]" />
                <span className="font-bold text-[14px] text-[#1F1A21]">
                  Live Invoice Calculation
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#6D6572]">Instant Math</span>
            </div>

            {/* Normalization Chip */}
            <div className="p-3 bg-white rounded-xl border border-[#E3DFE5] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D6572]">
                  Effective Monthly Value
                </div>
                <div className="text-[20px] font-bold font-mono text-[#6B4A6B]">
                  $<CountUp to={calc.effectiveMonthlyValue} decimals={2} durationMs={400} /> / mo
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1EAF1] text-[#6B4A6B] border border-[#E1D4E1]">
                Normalized
              </span>
            </div>

            {/* Itemized Line Breakdown */}
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between items-center text-[#1F1A21]">
                <span>
                  {product.name} ({quantity} units @ ${calc.unitPrice})
                </span>
                <span className="font-mono font-semibold">${calc.subtotal.toFixed(2)}</span>
              </div>

              {variant.extraPrice > 0 && (
                <div className="flex justify-between items-center text-[11px] text-[#6D6572] pl-2 border-l-2 border-[#6B4A6B]">
                  <span>Includes {variant.name} (+${variant.extraPrice}/unit)</span>
                  <span className="font-mono">+${(variant.extraPrice * quantity).toFixed(2)}</span>
                </div>
              )}

              {calc.discountAmount > 0 && (
                <div className="flex justify-between items-center text-[#1E8E5A] font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {calc.discountCodeApplied}
                  </span>
                  <span className="font-mono font-bold">-${calc.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#6D6572]">
                <span>Sales Tax ({taxPercent}%)</span>
                <span className="font-mono">${calc.taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-[#E3DFE5] flex justify-between items-baseline">
                <span className="font-bold text-[16px] text-[#1F1A21]">Total Invoice</span>
                <span className="font-mono font-bold text-[28px] text-[#6B4A6B] tabular-nums">
                  $<CountUp to={calc.total} decimals={2} durationMs={400} />
                </span>
              </div>
            </div>

            {/* Guarantee Note */}
            <div className="p-3 bg-white rounded-xl border border-[#E3DFE5] text-[11px] text-[#6D6572] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F5A623] shrink-0" />
              <span>Calculated deterministically with line rounding; tested by unit suite.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

