import React, { useState, useEffect, useCallback } from 'react';
import type { Discount, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { formatMoney, parseDollarsToMinorUnits } from '../utils/format';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Percent, Plus, Search, Tag } from 'lucide-react';

export const Discounts: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<PaginatedResponse<Discount>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'fixed' | 'percent'>('percent');
  const [formValue, setFormValue] = useState('');
  const [formMinPurchase, setFormMinPurchase] = useState('0');
  const [formMinQuantity, setFormMinQuantity] = useState('0');
  const [formUsageLimit, setFormUsageLimit] = useState('');
  const [formScope, setFormScope] = useState<'product' | 'subscription'>('subscription');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Discount>>('/discounts', {
        page,
        page_size: pageSize,
        q: search || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load discounts');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDiscounts();
  };

  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormName('');
    setFormCode('');
    setFormType('percent');
    setFormValue('');
    setFormMinPurchase('0');
    setFormMinQuantity('0');
    setFormUsageLimit('');
    setFormScope('subscription');
    setIsModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setFormName(d.name);
    setFormCode(d.code || '');
    setFormType(d.type);
    setFormValue(d.type === 'fixed' ? (d.value / 100).toFixed(2) : String(d.value));
    setFormMinPurchase((d.min_purchase / 100).toFixed(2));
    setFormMinQuantity(String(d.min_quantity));
    setFormUsageLimit(d.usage_limit ? String(d.usage_limit) : '');
    setFormScope(d.scope);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const rawVal = parseFloat(formValue) || 0;
      const val = formType === 'fixed' ? parseDollarsToMinorUnits(rawVal) : Math.round(rawVal);
      const minPurchaseUnits = parseDollarsToMinorUnits(formMinPurchase || '0');
      const minQty = parseInt(formMinQuantity) || 0;
      const usageLimit = formUsageLimit ? parseInt(formUsageLimit) : null;

      if (editingDiscount) {
        await api.patch(`/discounts/${editingDiscount.id}`, {
          name: formName,
          code: formCode || null,
          type: formType,
          value: val,
          min_purchase: minPurchaseUnits,
          min_quantity: minQty,
          usage_limit: usageLimit,
          scope: formScope,
        });
      } else {
        await api.post('/discounts', {
          name: formName,
          code: formCode || null,
          type: formType,
          value: val,
          min_purchase: minPurchaseUnits,
          min_quantity: minQty,
          usage_limit: usageLimit,
          scope: formScope,
          product_ids: [],
          subscription_ids: [],
        });
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Failed to save discount');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete discount');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <Percent className="w-6 h-6 text-[#6B4A6B]" />
            <span>Discounts & Promos</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Create fixed credits and percentage discounts with threshold criteria
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Add Discount
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6D6572] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search discounts by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="erp-input pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
        </form>
      </Card>

      {/* Table Card */}
      <Card noPadding className="overflow-hidden">
        {error && (
          <div className="p-4 bg-[#FDF2F2] text-[13px] text-[#C0392B] border-b border-[#F8D2D0]">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-4">Name / Promo Code</th>
                <th className="py-3 px-4 text-right">Type & Value</th>
                <th className="py-3 px-4 text-center">Scope</th>
                <th className="py-3 px-4 text-right">Min Spend</th>
                <th className="py-3 px-4 text-center">Usage Count</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-6">
                    <LoadingState message="Loading discount rules..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchDiscounts} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-6 px-4">
                    <EmptyState
                      title="No Discounts Configured"
                      description="Create fixed or percentage discount rules with promo codes and spend thresholds."
                      actionLabel={isAdmin ? '+ Add Discount' : undefined}
                      onAction={isAdmin ? openCreateModal : undefined}
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F6F5F7] transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#6D6572]" />
                        <span className="font-medium text-[#1F1A21]">{d.name}</span>
                        {d.code && (
                          <span className="font-mono text-[11px] font-bold text-[#6B4A6B] bg-[#F1EAF1] px-1.5 py-0.5 rounded border border-[#E3DFE5]">
                            {d.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1F1A21]">
                      {d.type === 'percent' ? `${d.value}%` : formatMoney(d.value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="capitalize px-2 py-0.5 rounded bg-[#F6F5F7] text-[#6D6572] font-medium text-[11px] border border-[#E3DFE5]">
                        {d.scope}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6D6572]">
                      {d.min_purchase > 0 ? formatMoney(d.min_purchase) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-[#6D6572]">
                      {d.times_used} / {d.usage_limit ? d.usage_limit : '∞'}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(d)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(d.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? 'Edit Discount' : 'Create Discount'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Discount Name" required>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="erp-input"
              placeholder="e.g. Early Bird 15% Off"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Promo Code">
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="erp-input font-mono"
                placeholder="EARLY15"
              />
            </FormField>
            <FormField label="Discount Type" required>
              <select
                value={formType}
                onChange={(e: any) => setFormType(e.target.value)}
                className="erp-select"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={formType === 'percent' ? 'Discount Value (%)' : 'Discount Value ($)'}
              required
            >
              <input
                type="number"
                step={formType === 'fixed' ? '0.01' : '1'}
                min="0"
                required
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="erp-input tabular-nums font-mono"
                placeholder={formType === 'percent' ? '15' : '15.00'}
              />
            </FormField>
            <FormField label="Scope" required>
              <select
                value={formScope}
                onChange={(e: any) => setFormScope(e.target.value)}
                className="erp-select"
              >
                <option value="subscription">Subscription</option>
                <option value="product">Product</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Min Spend ($)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formMinPurchase}
                onChange={(e) => setFormMinPurchase(e.target.value)}
                className="erp-input tabular-nums font-mono"
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Usage Limit (blank=unlimited)">
              <input
                type="number"
                min="1"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value)}
                className="erp-input tabular-nums font-mono"
                placeholder="Unlimited"
              />
            </FormField>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-[#E3DFE5]">
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
              loading={isSaving}
            >
              {editingDiscount ? 'Update Discount' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
