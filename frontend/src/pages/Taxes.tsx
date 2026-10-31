import React, { useState, useEffect, useCallback } from 'react';
import type { Tax, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Receipt, Plus, Search, Percent } from 'lucide-react';

export const Taxes: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<PaginatedResponse<Tax>>({
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
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [formName, setFormName] = useState('');
  const [formRate, setFormRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTaxes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Tax>>('/taxes', {
        page,
        page_size: pageSize,
        q: search || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load tax rates');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTaxes();
  };

  const openCreateModal = () => {
    setEditingTax(null);
    setFormName('');
    setFormRate('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tax) => {
    setEditingTax(t);
    setFormName(t.name);
    setFormRate(t.rate_percent);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingTax) {
        await api.patch(`/taxes/${editingTax.id}`, {
          name: formName,
          rate_percent: parseFloat(formRate).toFixed(2),
        });
      } else {
        await api.post('/taxes', {
          name: formName,
          rate_percent: parseFloat(formRate).toFixed(2),
        });
      }
      setIsModalOpen(false);
      fetchTaxes();
    } catch (err: any) {
      alert(err.message || 'Failed to save tax');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tax rate?')) return;
    try {
      await api.delete(`/taxes/${id}`);
      fetchTaxes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete tax');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#6B4A6B]" />
            <span>Tax Rates</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Configure line-item taxes, VAT rates, and jurisdiction percentages
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Add Tax Rate
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
              placeholder="Search taxes..."
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
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-4">Tax Name</th>
                <th className="py-3 px-4 text-right">Rate Percentage</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 3 : 2} className="py-6">
                    <LoadingState message="Loading tax rates..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isAdmin ? 3 : 2} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchTaxes} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 3 : 2} className="py-6 px-4">
                    <EmptyState
                      title="No Tax Rates Found"
                      description="Add tax rules to configure percentage rates applied to line items."
                      actionLabel={isAdmin ? '+ Add Tax Rate' : undefined}
                      onAction={isAdmin ? openCreateModal : undefined}
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F6F5F7] transition">
                    <td className="py-3 px-4 font-medium text-[#1F1A21] flex items-center gap-2">
                      <Percent className="w-4 h-4 text-[#6D6572]" />
                      <span>{t.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1F1A21]">
                      <span className="bg-[#F1EAF1] text-[#6B4A6B] px-2 py-0.5 rounded text-[12px]">
                        {Number(t.rate_percent).toFixed(2)}%
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(t)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(t.id)}
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
        title={editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Tax Name" required>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="erp-input"
              placeholder="e.g. VAT (20%)"
            />
          </FormField>

          <FormField label="Percentage Rate (%)" required>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              value={formRate}
              onChange={(e) => setFormRate(e.target.value)}
              className="erp-input tabular-nums font-mono"
              placeholder="20.00"
            />
          </FormField>

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
              {editingTax ? 'Update Tax' : 'Create Tax'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
