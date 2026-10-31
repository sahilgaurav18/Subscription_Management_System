import React, { useState, useEffect, useCallback } from 'react';
import type { Plan, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { formatMoney, parseDollarsToMinorUnits } from '../utils/format';
import { Calendar, Plus, Search, Check, X } from 'lucide-react';
import billingPeriodsConfig from '@shared/config/billing_periods.json';

export const Plans: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<PaginatedResponse<Plan>>({
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
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formPeriod, setFormPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [formMinQuantity, setFormMinQuantity] = useState('1');
  const [formAutoClose, setFormAutoClose] = useState(false);
  const [formClosable, setFormClosable] = useState(true);
  const [formPausable, setFormPausable] = useState(true);
  const [formRenewable, setFormRenewable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Plan>>('/plans', {
        page,
        page_size: pageSize,
        q: search || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPlans();
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormName('');
    setFormPrice('');
    setFormPeriod('monthly');
    setFormMinQuantity('1');
    setFormAutoClose(false);
    setFormClosable(true);
    setFormPausable(true);
    setFormRenewable(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setFormName(p.name);
    setFormPrice((p.price / 100).toFixed(2));
    setFormPeriod(p.billing_period);
    setFormMinQuantity(String(p.min_quantity));
    setFormAutoClose(p.auto_close);
    setFormClosable(p.closable);
    setFormPausable(p.pausable);
    setFormRenewable(p.renewable);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const priceUnits = parseDollarsToMinorUnits(formPrice);
      const minQty = parseInt(formMinQuantity) || 1;

      if (editingPlan) {
        await api.patch(`/plans/${editingPlan.id}`, {
          name: formName,
          price: priceUnits,
          billing_period: formPeriod,
          min_quantity: minQty,
          auto_close: formAutoClose,
          closable: formClosable,
          pausable: formPausable,
          renewable: formRenewable,
        });
      } else {
        await api.post('/plans', {
          name: formName,
          price: priceUnits,
          currency: 'USD',
          billing_period: formPeriod,
          min_quantity: minQty,
          auto_close: formAutoClose,
          closable: formClosable,
          pausable: formPausable,
          renewable: formRenewable,
        });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this billing plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#6B4A6B]" />
            <span>Billing Plans</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-0.5">
            Define recurring billing periods, renewal conditions, and auto-closure rules
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Create Plan
          </Button>
        )}
      </div>

      {/* Filter */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6D6572] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search plans..."
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4 text-right">Recurring Price</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4 text-center">Min Quantity</th>
                <th className="py-3 px-4 text-center">Pausable</th>
                <th className="py-3 px-4 text-center">Renewable</th>
                <th className="py-3 px-4 text-center">Auto-Close</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-6">
                    <LoadingState message="Loading billing plans..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchPlans} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 px-4">
                    <EmptyState
                      title="No Billing Plans"
                      description="Create plans to define recurring subscription intervals and rules."
                      actionLabel={isAdmin ? '+ Create Plan' : undefined}
                      onAction={isAdmin ? openCreateModal : undefined}
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F6F5F7]/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#1F1A21]">{p.name}</td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums text-[#1E8E5A]">
                      {formatMoney(p.price, p.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-[#F1EAF1] text-[#6B4A6B] font-medium text-[11px] border border-[#E1D4E1]">
                        {p.billing_period}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">{p.min_quantity}</td>
                    <td className="py-3 px-4 text-center">
                      {p.pausable ? (
                        <Check className="w-4 h-4 text-[#1E8E5A] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#6D6572]/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.renewable ? (
                        <Check className="w-4 h-4 text-[#1E8E5A] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#6D6572]/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.auto_close ? (
                        <span className="text-[11px] font-medium text-[#B7791F] bg-[#FEF6E7] px-2 py-0.5 rounded border border-[#FADDA8]">
                          YES
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#6D6572]">NO</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="font-medium text-[#1F1A21] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="font-medium text-[#C0392B] hover:underline"
                        >
                          Delete
                        </button>
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Plan' : 'Create Billing Plan'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Plan Name" htmlFor="plName" required>
            <input
              id="plName"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="erp-input"
              placeholder="e.g. Enterprise Monthly"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price ($)" htmlFor="plPrice" required>
              <input
                id="plPrice"
                type="number"
                step="0.01"
                min="0"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="erp-input tabular-nums"
                placeholder="99.00"
              />
            </FormField>
            <FormField label="Billing Period" htmlFor="plPeriod">
              <select
                id="plPeriod"
                value={formPeriod}
                onChange={(e: any) => setFormPeriod(e.target.value)}
                className="erp-input bg-white"
              >
                {billingPeriodsConfig.periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Min Quantity" htmlFor="plMinQty">
            <input
              id="plMinQty"
              type="number"
              min="1"
              required
              value={formMinQuantity}
              onChange={(e) => setFormMinQuantity(e.target.value)}
              className="erp-input tabular-nums"
            />
          </FormField>

          {/* Behavior Flags */}
          <div className="pt-2 border-t border-[#E3DFE5] space-y-2 text-[13px]">
            <p className="font-semibold text-[#1F1A21]">Lifecycle Settings</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formPausable}
                onChange={(e) => setFormPausable(e.target.checked)}
                className="rounded border-[#E3DFE5] text-[#6B4A6B] focus:ring-[#6B4A6B]"
              />
              <span>Pausable (Allows pausing subscription invoicing)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formRenewable}
                onChange={(e) => setFormRenewable(e.target.checked)}
                className="rounded border-[#E3DFE5] text-[#6B4A6B] focus:ring-[#6B4A6B]"
              />
              <span>Renewable (Extends subscription expiry date)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formAutoClose}
                onChange={(e) => setFormAutoClose(e.target.checked)}
                className="rounded border-[#E3DFE5] text-[#6B4A6B] focus:ring-[#6B4A6B]"
              />
              <span>Auto-close (Automatically close subscription on expiry)</span>
            </label>
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
              {isSaving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
