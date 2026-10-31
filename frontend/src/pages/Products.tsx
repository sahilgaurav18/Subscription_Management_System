import React, { useState, useEffect, useCallback } from 'react';
import type { Product, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { formatMoney, parseDollarsToMinorUnits } from '../utils/format';
import { Package, Plus, Search, Tag, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<PaginatedResponse<Product>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Modal State for Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('software');
  const [formSalesPrice, setFormSalesPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Variant Modal
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variantProductId, setVariantProductId] = useState<number | null>(null);
  const [variantAttr, setVariantAttr] = useState('brand');
  const [variantVal, setVariantVal] = useState('');
  const [variantExtra, setVariantExtra] = useState('');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Product>>('/products', {
        page,
        page_size: pageSize,
        q: search || undefined,
        type: typeFilter || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, typeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormType('software');
    setFormSalesPrice('');
    setFormCostPrice('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormType(p.type);
    setFormSalesPrice((p.sales_price / 100).toFixed(2));
    setFormCostPrice((p.cost_price / 100).toFixed(2));
    setFormNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const salesPriceUnits = parseDollarsToMinorUnits(formSalesPrice);
      const costPriceUnits = parseDollarsToMinorUnits(formCostPrice || '0');

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, {
          name: formName,
          type: formType,
          sales_price: salesPriceUnits,
          cost_price: costPriceUnits,
          notes: formNotes || null,
        });
      } else {
        await api.post('/products', {
          name: formName,
          type: formType,
          sales_price: salesPriceUnits,
          cost_price: costPriceUnits,
          notes: formNotes || null,
          variants: [],
        });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const openAddVariantModal = (productId: number) => {
    setVariantProductId(productId);
    setVariantAttr('brand');
    setVariantVal('');
    setVariantExtra('0');
    setIsVariantModalOpen(true);
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantProductId) return;
    try {
      const extraMinorUnits = parseDollarsToMinorUnits(variantExtra || '0');
      await api.post(`/products/${variantProductId}/variants`, {
        attribute: variantAttr,
        value: variantVal,
        extra_price: extraMinorUnits,
      });
      setIsVariantModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to add variant');
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('Delete this variant?')) return;
    try {
      await api.delete(`/products/variants/${variantId}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete variant');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#6B4A6B]" />
            <span>Products & Variants</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-0.5">
            Base products, custom variant attributes, and dynamic price surcharges
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Add Product
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6D6572] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="erp-input pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
        </form>

        <div className="flex items-center gap-2 self-start sm:self-auto text-[12px]">
          <span className="text-[#6D6572] font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="erp-input min-w-[130px] bg-white"
          >
            <option value="">All Types</option>
            <option value="software">Software</option>
            <option value="service">Service</option>
            <option value="license">License</option>
          </select>
        </div>
      </Card>

      {/* Table Card */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Base Sales Price</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-center">Variants Count</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-6">
                    <LoadingState message="Loading catalog products..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchProducts} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4">
                    <EmptyState
                      title="No Products Found"
                      description="No products match your search or filter. Create a new product to populate your catalog."
                      actionLabel={isAdmin ? '+ Add Product' : undefined}
                      onAction={isAdmin ? openCreateModal : undefined}
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((p) => {
                  const isExpanded = expandedRow === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-[#F6F5F7]/80 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                            className="text-[#6D6572] hover:text-[#1F1A21] p-1 rounded-md"
                            title="Toggle variants"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#1F1A21]">
                          {p.name}
                          {p.notes && (
                            <p className="text-[11px] text-[#6D6572] font-normal truncate max-w-xs mt-0.5">
                              {p.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded bg-[#F1EFF2] text-[#1F1A21] font-medium text-[11px] border border-[#E3DFE5]">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums text-[#1F1A21]">
                          {formatMoney(p.sales_price, p.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-[#6D6572] tabular-nums">
                          {formatMoney(p.cost_price, p.currency)}
                        </td>
                        <td className="py-3 px-4 text-center font-medium tabular-nums">
                          {p.variants.length} variant(s)
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right space-x-3">
                            <button
                              onClick={() => openAddVariantModal(p.id)}
                              className="font-medium text-[#6B4A6B] hover:underline"
                            >
                              + Variant
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="font-medium text-[#1F1A21] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="font-medium text-[#C0392B] hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Expanded Variants Row */}
                      {isExpanded && (
                        <tr className="bg-[#F6F5F7]/70 border-b border-[#E3DFE5]">
                          <td colSpan={7} className="p-4 pl-12">
                            <div className="bg-white p-4 rounded-lg border border-[#E3DFE5]">
                              <h4 className="font-semibold text-[13px] text-[#1F1A21] mb-2 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-[#6B4A6B]" />
                                <span>Variants for {p.name} (Final Price = Base + Extra)</span>
                              </h4>
                              {p.variants.length === 0 ? (
                                <p className="text-[12px] text-[#6D6572] italic">No variants added yet.</p>
                              ) : (
                                <div className="divide-y divide-[#E3DFE5]">
                                  {p.variants.map((v) => {
                                    const finalPrice = p.sales_price + v.extra_price;
                                    return (
                                      <div
                                        key={v.id}
                                        className="py-2 flex items-center justify-between text-[13px]"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-[#6D6572]">
                                            {v.attribute}:
                                          </span>
                                          <span className="font-semibold text-[#1F1A21]">
                                            {v.value}
                                          </span>
                                          <span className="text-[#6D6572] text-[11px] tabular-nums">
                                            (+{formatMoney(v.extra_price, p.currency)})
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                          <span className="font-semibold text-[#1E8E5A] bg-[#EAF6EE] px-2 py-0.5 rounded border border-[#C6E8D2] tabular-nums text-[12px]">
                                            Final: {formatMoney(finalPrice, p.currency)}
                                          </span>
                                          {isAdmin && (
                                            <button
                                              onClick={() => handleDeleteVariant(v.id)}
                                              className="text-[#6D6572] hover:text-[#C0392B] p-1 rounded-md"
                                              title="Delete variant"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
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

      {/* Create/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <FormField label="Product Name" htmlFor="pName" required>
            <input
              id="pName"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="erp-input"
              placeholder="e.g. Cloud Security Suite"
            />
          </FormField>

          <FormField label="Type" htmlFor="pType">
            <select
              id="pType"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="erp-input bg-white"
            >
              <option value="software">Software</option>
              <option value="service">Service</option>
              <option value="license">License</option>
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Base Sales Price ($)" htmlFor="sPrice" required>
              <input
                id="sPrice"
                type="number"
                step="0.01"
                min="0"
                required
                value={formSalesPrice}
                onChange={(e) => setFormSalesPrice(e.target.value)}
                className="erp-input tabular-nums"
                placeholder="99.00"
              />
            </FormField>
            <FormField label="Cost Price ($)" htmlFor="cPrice">
              <input
                id="cPrice"
                type="number"
                step="0.01"
                min="0"
                value={formCostPrice}
                onChange={(e) => setFormCostPrice(e.target.value)}
                className="erp-input tabular-nums"
                placeholder="30.00"
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="pNotes">
            <textarea
              id="pNotes"
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="erp-input py-2"
              placeholder="Internal description and catalog notes"
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
              {isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title="Add Product Variant"
        maxWidth="sm"
      >
        <form onSubmit={handleAddVariant} className="space-y-4">
          <FormField label="Attribute Name" htmlFor="vAttr" required>
            <input
              id="vAttr"
              type="text"
              required
              value={variantAttr}
              onChange={(e) => setVariantAttr(e.target.value)}
              className="erp-input"
              placeholder="e.g. brand, tier, edition"
            />
          </FormField>

          <FormField label="Value" htmlFor="vVal" required>
            <input
              id="vVal"
              type="text"
              required
              value={variantVal}
              onChange={(e) => setVariantVal(e.target.value)}
              className="erp-input"
              placeholder="e.g. Odoo, Enterprise"
            />
          </FormField>

          <FormField label="Extra Price ($)" htmlFor="vExtra" required>
            <input
              id="vExtra"
              type="number"
              step="0.01"
              min="0"
              required
              value={variantExtra}
              onChange={(e) => setVariantExtra(e.target.value)}
              className="erp-input tabular-nums"
              placeholder="5.60"
            />
          </FormField>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E3DFE5]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsVariantModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Save Variant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
