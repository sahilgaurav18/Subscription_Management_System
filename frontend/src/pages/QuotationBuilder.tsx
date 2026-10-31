import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Customer,
  Plan,
  Product,
  QuotationTemplate,
} from '../types/models';
import { api } from '../services/api';
import { formatMoney } from '../utils/format';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { FileText, Plus, Trash2, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

interface LineItemDraft {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  unit_price: number;
}

export const QuotationBuilder: React.FC = () => {
  const navigate = useNavigate();

  // Reference Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Immediate');
  const [validityDays, setValidityDays] = useState<number>(30);
  const [lines, setLines] = useState<LineItemDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [cRes, pRes, prRes, tRes] = await Promise.all([
          api.get<{ items: Customer[] }>('/customers', { page: 1, page_size: 100 }),
          api.get<{ items: Plan[] }>('/plans', { page: 1, page_size: 100 }),
          api.get<{ items: Product[] }>('/products', { page: 1, page_size: 100 }),
          api.get<{ items: QuotationTemplate[] }>('/quotation-templates', { page: 1, page_size: 100 }),
        ]);

        setCustomers(cRes.items || []);
        setPlans(pRes.items || []);
        setProducts(prRes.items || []);
        setTemplates(tRes.items || []);

        if (cRes.items?.length > 0) setSelectedCustomerId(String(cRes.items[0].id));
        if (pRes.items?.length > 0) setSelectedPlanId(String(pRes.items[0].id));
      } catch (err: any) {
        setError(err.message || 'Failed to load options');
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleTemplateSelect = (templateIdStr: string) => {
    setSelectedTemplateId(templateIdStr);
    if (!templateIdStr) return;

    const tpl = templates.find((t) => t.id === Number(templateIdStr));
    if (!tpl) return;

    setSelectedPlanId(String(tpl.plan_id));
    setValidityDays(tpl.validity_days);

    const mappedLines: LineItemDraft[] = tpl.lines.map((tl) => {
      const prod = products.find((p) => p.id === tl.product_id);
      const variant = prod?.variants.find((v) => v.id === tl.variant_id);
      const basePrice = prod ? prod.sales_price : 0;
      const extraPrice = variant ? variant.extra_price : 0;
      return {
        product_id: tl.product_id,
        variant_id: tl.variant_id,
        quantity: tl.quantity,
        unit_price: basePrice + extraPrice,
      };
    });

    setLines(mappedLines);
  };

  const addEmptyLine = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct.variants.length > 0 ? defaultProduct.variants[0] : null;
    const unitPrice = defaultProduct.sales_price + (defaultVariant ? defaultVariant.extra_price : 0);

    setLines([
      ...lines,
      {
        product_id: defaultProduct.id,
        variant_id: defaultVariant ? defaultVariant.id : null,
        quantity: 1,
        unit_price: unitPrice,
      },
    ]);
  };

  const updateLineProduct = (index: number, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const defaultVariant = prod.variants.length > 0 ? prod.variants[0] : null;
    const unitPrice = prod.sales_price + (defaultVariant ? defaultVariant.extra_price : 0);

    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      product_id: productId,
      variant_id: defaultVariant ? defaultVariant.id : null,
      unit_price: unitPrice,
    };
    setLines(updated);
  };

  const updateLineVariant = (index: number, variantId: number | null) => {
    const updated = [...lines];
    const prod = products.find((p) => p.id === updated[index].product_id);
    if (!prod) return;
    const variant = prod.variants.find((v) => v.id === variantId);
    const unitPrice = prod.sales_price + (variant ? variant.extra_price : 0);

    updated[index] = {
      ...updated[index],
      variant_id: variantId,
      unit_price: unitPrice,
    };
    setLines(updated);
  };

  const updateLineQuantity = (index: number, qty: number) => {
    const updated = [...lines];
    updated[index].quantity = Math.max(1, qty);
    setLines(updated);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const selectedPlan = plans.find((p) => p.id === Number(selectedPlanId));
  const totalQuantity = lines.reduce((acc, l) => acc + l.quantity, 0);
  const totalAmount = lines.reduce((acc, l) => acc + l.unit_price * l.quantity, 0);
  const meetsMinQuantity = !selectedPlan || totalQuantity >= selectedPlan.min_quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (!selectedPlanId) {
      setError('Please select a plan.');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one line item to the quotation.');
      return;
    }
    if (!meetsMinQuantity && selectedPlan) {
      setError(`Plan requires a minimum total quantity of ${selectedPlan.min_quantity}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedTemplateId) {
        const payload = {
          template_id: Number(selectedTemplateId),
          customer_id: Number(selectedCustomerId),
          payment_terms: paymentTerms,
          custom_lines: lines.map((l) => ({
            product_id: l.product_id,
            variant_id: l.variant_id || null,
            quantity: l.quantity,
            unit_price: l.unit_price,
          })),
        };
        const sub = await api.post<any>('/subscriptions/from-template', payload);
        navigate(`/subscriptions/${sub.id}`);
      } else {
        const payload = {
          customer_id: Number(selectedCustomerId),
          plan_id: Number(selectedPlanId),
          payment_terms: paymentTerms,
          status: 'quotation',
          lines: lines.map((l) => ({
            product_id: l.product_id,
            variant_id: l.variant_id || null,
            quantity: l.quantity,
            unit_price: l.unit_price,
          })),
        };
        const sub = await api.post<any>('/subscriptions', payload);
        navigate(`/subscriptions/${sub.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <p className="text-center text-[13px] text-[#6D6572]">Loading quotation options...</p>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/subscriptions')}
          className="p-2 rounded-md border border-[#E3DFE5] text-[#1F1A21] hover:bg-[#F6F5F7] min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
          aria-label="Back to subscriptions"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#6B4A6B]" />
            <span>Create New Quotation</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-0.5">
            Build custom subscription quotation from a pre-defined template or from scratch
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FDF2F2] border border-[#F8D2D0] rounded-lg text-[13px] text-[#C0392B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Template Pre-loader */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-[#6B4A6B] font-semibold text-[12px] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Optional: Pre-load from Quotation Template</span>
          </div>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="erp-input bg-white text-[#1F1A21]"
          >
            <option value="">-- Start from blank custom draft --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.lines.length} lines, plan: {t.plan_name}, {t.validity_days} days validity)
              </option>
            ))}
          </select>
        </Card>

        {/* Step 2: Customer and Plan (two columns desktop, one column mobile) */}
        <Card className="space-y-4">
          <h2 className="font-semibold text-[16px] text-[#1F1A21] border-b border-[#E3DFE5] pb-2">
            Customer & Billing Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Select Customer" htmlFor="custSelect" required>
              <select
                id="custSelect"
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="erp-input bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Billing Plan" htmlFor="planSelect" required>
              <select
                id="planSelect"
                required
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="erp-input bg-white"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatMoney(p.price)} / {p.billing_period} (min {p.min_quantity})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Payment Terms" htmlFor="termsSelect">
              <select
                id="termsSelect"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="erp-input bg-white"
              >
                <option value="Immediate">Immediate / Due on Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </FormField>

            <FormField label="Quotation Validity (Days)" htmlFor="valDays">
              <input
                id="valDays"
                type="number"
                min="1"
                max="365"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="erp-input"
              />
            </FormField>
          </div>
        </Card>

        {/* Step 3: Product Lines */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DFE5] pb-2">
            <h2 className="font-semibold text-[16px] text-[#1F1A21]">Quotation Line Items</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addEmptyLine}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Line
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#6D6572] bg-[#F6F5F7] rounded-lg border border-dashed border-[#E3DFE5]">
              No products selected. Click <strong>+ Add Line</strong> or pick a quotation template above.
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => {
                const currentProd = products.find((p) => p.id === line.product_id);
                return (
                  <div
                    key={idx}
                    className="p-4 bg-[#F6F5F7] rounded-lg border border-[#E3DFE5] flex flex-col md:flex-row md:items-center gap-3 text-[13px]"
                  >
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-[#6D6572] mb-1">Product</label>
                      <select
                        value={line.product_id}
                        onChange={(e) => updateLineProduct(idx, Number(e.target.value))}
                        className="erp-input text-xs bg-white"
                      >
                        {products.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.name} ({formatMoney(pr.sales_price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-44">
                      <label className="block text-[11px] font-medium text-[#6D6572] mb-1">Variant</label>
                      <select
                        value={line.variant_id || ''}
                        onChange={(e) => updateLineVariant(idx, e.target.value ? Number(e.target.value) : null)}
                        className="erp-input text-xs bg-white"
                      >
                        <option value="">Default (No Variant)</option>
                        {currentProd?.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.attribute}: {v.value} (+{formatMoney(v.extra_price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-20">
                      <label className="block text-[11px] font-medium text-[#6D6572] mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLineQuantity(idx, Number(e.target.value))}
                        className="erp-input text-xs text-center tabular-nums"
                      />
                    </div>

                    <div className="w-full md:w-28 text-left md:text-right">
                      <span className="block text-[11px] font-medium text-[#6D6572] mb-1">Unit Price</span>
                      <span className="font-medium tabular-nums text-[#1F1A21]">{formatMoney(line.unit_price)}</span>
                    </div>

                    <div className="w-full md:w-28 text-left md:text-right">
                      <span className="block text-[11px] font-medium text-[#6D6572] mb-1">Amount</span>
                      <span className="font-semibold tabular-nums text-[#1F1A21]">
                        {formatMoney(line.unit_price * line.quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-[#C0392B] hover:text-[#902A20] self-end md:self-center p-1.5 rounded-md hover:bg-[#FDF2F2]"
                      title="Remove line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Validation & Totals Bar */}
          <div className="pt-3 border-t border-[#E3DFE5] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="text-[#6D6572]">Total Quantity:</span>
              <span className={`font-semibold px-2 py-0.5 rounded text-[12px] tabular-nums ${meetsMinQuantity ? 'bg-[#EAF6EE] text-[#1E8E5A]' : 'bg-[#FDF2F2] text-[#C0392B]'}`}>
                {totalQuantity} {selectedPlan && `(Plan Min: ${selectedPlan.min_quantity})`}
              </span>
            </div>

            <div className="flex items-center gap-3 text-right">
              <span className="text-[#6D6572]">Quotation Total:</span>
              <span className="text-[18px] font-semibold text-[#6B4A6B] tabular-nums">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>
        </Card>

        {/* Submit Actions (primary button right-aligned) */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/subscriptions')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={lines.length === 0 || !meetsMinQuantity}
          >
            {isSubmitting ? 'Creating Quotation...' : 'Create Quotation'}
          </Button>
        </div>
      </form>
    </div>
  );
};
