import React, { useState, useEffect, useCallback } from 'react';
import type { Customer, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { formatDate } from '../utils/format';
import { Users, Plus, Search, Building } from 'lucide-react';

export const Customers: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<Customer>>({
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
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Customer>>('/customers', {
        page,
        page_size: pageSize,
        q: search || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormCompany('');
    setFormAddress('');
    setFormTaxId('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormCompany(c.company || '');
    setFormAddress(c.billing_address || '');
    setFormTaxId(c.tax_id || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, {
          name: formName,
          company: formCompany || null,
          billing_address: formAddress || null,
          tax_id: formTaxId || null,
        });
      } else {
        await api.post('/customers', {
          name: formName,
          company: formCompany || null,
          billing_address: formAddress || null,
          tax_id: formTaxId || null,
        });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#6B4A6B]" />
            <span>Customers</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Manage customer accounts, billing profiles and tax identifiers
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Add Customer
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6D6572] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, company, tax ID..."
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
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Tax ID / VAT</th>
                <th className="py-3 px-4">Billing Address</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <LoadingState message="Loading customers..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchCustomers} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 px-4">
                    <EmptyState
                      title="No Customers Found"
                      description="No customer records match your search. Click below to add a customer."
                      actionLabel="+ Add Customer"
                      onAction={openCreateModal}
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F6F5F7]/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#1F1A21]">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-1.5 text-[#1F1A21]">
                      {c.company ? (
                        <>
                          <Building className="w-3.5 h-3.5 text-[#6D6572]" />
                          <span>{c.company}</span>
                        </>
                      ) : (
                        <span className="text-[#6D6572]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px]">
                      {c.tax_id ? (
                        <span className="bg-[#F1EFF2] text-[#1F1A21] px-1.5 py-0.5 rounded border border-[#E3DFE5]">
                          {c.tax_id}
                        </span>
                      ) : (
                        <span className="text-[#6D6572]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[#6D6572]" title={c.billing_address || ''}>
                      {c.billing_address || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#6D6572]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(c)}
                        className="text-[12px] font-medium text-[#6B4A6B] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Full Customer Name" htmlFor="cName" required>
            <input
              id="cName"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="erp-input"
              placeholder="e.g. Acme Corp or John Smith"
            />
          </FormField>

          <FormField label="Company Name" htmlFor="cCompany">
            <input
              id="cCompany"
              type="text"
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              className="erp-input"
              placeholder="e.g. Acme Enterprises LLC"
            />
          </FormField>

          <FormField label="Tax / VAT Registration ID" htmlFor="cTax">
            <input
              id="cTax"
              type="text"
              value={formTaxId}
              onChange={(e) => setFormTaxId(e.target.value)}
              className="erp-input"
              placeholder="e.g. US-88-291039"
            />
          </FormField>

          <FormField label="Billing Address" htmlFor="cAddress">
            <textarea
              id="cAddress"
              rows={3}
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="erp-input py-2"
              placeholder="123 Tech Park Ave, Suite 100, City, Country"
            />
          </FormField>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E3DFE5]">
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
              {isSaving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
