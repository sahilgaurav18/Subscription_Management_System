import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  QuotationTemplate,
  Plan,
  Product,
  PaginatedResponse,
} from '../types/models';
import { api } from '../services/api';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { formatMoney } from '../utils/format';
import { Layers, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

interface TemplateLineDraft {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
}

export const QuotationTemplates: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<PaginatedResponse<QuotationTemplate>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formValidity, setFormValidity] = useState(30);
  const [formPlanId, setFormPlanId] = useState<string>('');
  const [lines, setLines] = useState<TemplateLineDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<QuotationTemplate>>('/quotation-templates', {
        page,
        page_size: pageSize,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    const loadPlansAndProducts = async () => {
      try {
        const [pRes, prRes] = await Promise.all([
          api.get<{ items: Plan[] }>('/plans', { page: 1, page_size: 100 }),
          api.get<{ items: Product[] }>('/products', { page: 1, page_size: 100 }),
        ]);
        setPlans(pRes.items || []);
        setProducts(prRes.items || []);
        if (pRes.items?.length > 0) setFormPlanId(String(pRes.items[0].id));
      } catch (err) {
        console.error(err);
      }
    };
    loadPlansAndProducts();
  }, []);

  const openCreateModal = () => {
    setFormName('');
    setFormValidity(30);
    if (plans.length > 0) setFormPlanId(String(plans[0].id));
    setLines([]);
    setIsModalOpen(true);
  };

  const addLine = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct.variants.length > 0 ? defaultProduct.variants[0] : null;

    setLines([
      ...lines,
      {
        product_id: defaultProduct.id,
        variant_id: defaultVariant ? defaultVariant.id : null,
        quantity: 1,
      },
    ]);
  };

  const updateLineProduct = (index: number, productId: number) => {
    const prod = products.find((p) => p.id === productId);
    const defaultVariant = prod && prod.variants.length > 0 ? prod.variants[0] : null;

    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      product_id: productId,
      variant_id: defaultVariant ? defaultVariant.id : null,
    };
    setLines(updated);
  };

  const updateLineVariant = (index: number, variantId: number | null) => {
    const updated = [...lines];
    updated[index].variant_id = variantId;
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlanId) {
      alert('Please select a plan.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/quotation-templates', {
        name: formName,
        validity_days: formValidity,
        plan_id: Number(formPlanId),
        lines: lines.map((l) => ({
          product_id: l.product_id,
          variant_id: l.variant_id || null,
          quantity: l.quantity,
        })),
      });
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to save quotation template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quotation template?')) return;
    try {
      await api.delete(`/quotation-templates/${id}`);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <Layers className="w-6 h-6 text-[#6B4A6B]" />
              <span>Quotation Templates</span>
            </h1>
            <p className="text-[13px] text-[#6D6572] mt-0.5">
              Reusable pre-configured bundles with plans, default products and validity rules
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-8 text-center text-[#6D6572]">Loading templates...</div>
        ) : data.items.length === 0 ? (
          <Card className="col-span-2 text-center p-8 text-[#6D6572]">
            No quotation templates found. Click <strong>+ New Template</strong> to configure one.
          </Card>
        ) : (
          data.items.map((tpl) => (
            <Card
              key={tpl.id}
              className="space-y-4 hover:border-[#6B4A6B]/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[16px] text-[#1F1A21]">{tpl.name}</h3>
                    <p className="text-[12px] text-[#6B4A6B] font-medium mt-0.5">
                      Plan: {tpl.plan_name} ({tpl.plan_billing_period})
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="text-[#6D6572] hover:text-[#C0392B] p-1.5 rounded-md hover:bg-[#FDF2F2]"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[12px] text-[#6D6572] flex items-center justify-between border-y border-[#E3DFE5] py-2.5 my-3">
                  <span>Default Validity: <strong className="text-[#1F1A21]">{tpl.validity_days} Days</strong></span>
                  <span>Product Lines: <strong className="text-[#1F1A21]">{tpl.lines.length} items</strong></span>
                </div>

                {/* Lines Preview */}
                <div className="space-y-1.5 text-[12px]">
                  {tpl.lines.map((l) => (
                    <div key={l.id} className="flex justify-between text-[#6D6572]">
                      <span>
                        {l.product_name} {l.variant_value ? `(${l.variant_value})` : ''} × {l.quantity}
                      </span>
                      <span className="font-medium text-[#1F1A21] tabular-nums">
                        {formatMoney(
                          ((l.product_price || 0) + (l.variant_extra_price || 0)) * l.quantity
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/subscriptions/new')}
                >
                  <span>Build Quotation from this Template</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Pagination
        page={data.page}
        pageSize={data.page_size}
        total={data.total}
        totalPages={data.total_pages}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Quotation Template"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Template Name" htmlFor="tplName" required>
            <input
              id="tplName"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="erp-input"
              placeholder="e.g. Standard 5-User SaaS Bundle"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Billing Plan" htmlFor="tplPlan" required>
              <select
                id="tplPlan"
                required
                value={formPlanId}
                onChange={(e) => setFormPlanId(e.target.value)}
                className="erp-input bg-white"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billing_period})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Validity (Days)" htmlFor="tplVal" required>
              <input
                id="tplVal"
                type="number"
                min="1"
                max="365"
                required
                value={formValidity}
                onChange={(e) => setFormValidity(Number(e.target.value))}
                className="erp-input"
              />
            </FormField>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2 border-t border-[#E3DFE5]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#1F1A21]">Pre-configured Products</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addLine}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Product
              </Button>
            </div>

            <div className="space-y-2">
              {lines.map((l, idx) => {
                const currentProd = products.find((p) => p.id === l.product_id);
                return (
                  <div key={idx} className="p-3 bg-[#F6F5F7] rounded-md border border-[#E3DFE5] flex items-center gap-2 text-[12px]">
                    <select
                      value={l.product_id}
                      onChange={(e) => updateLineProduct(idx, Number(e.target.value))}
                      className="erp-input text-xs flex-1 bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={l.variant_id || ''}
                      onChange={(e) => updateLineVariant(idx, e.target.value ? Number(e.target.value) : null)}
                      className="erp-input text-xs w-36 bg-white"
                    >
                      <option value="">Default</option>
                      {currentProd?.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.attribute}: {v.value}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => updateLineQuantity(idx, Number(e.target.value))}
                      className="erp-input text-xs w-16 text-center tabular-nums"
                    />

                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-[#C0392B] hover:text-[#902A20] p-1.5 rounded-md hover:bg-[#FDF2F2]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E3DFE5] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
