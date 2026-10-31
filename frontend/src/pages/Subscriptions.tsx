import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Subscription, PaginatedResponse } from '../types/models';
import { api } from '../services/api';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { formatMoney, formatDate } from '../utils/format';
import { FileText, Plus, Search, Building, Layers } from 'lucide-react';

export const Subscriptions: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<Subscription>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Subscription>>('/subscriptions', {
        page,
        page_size: pageSize,
        q: search || undefined,
        status: statusFilter || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#6B4A6B]" />
            <span>Subscriptions & Quotations</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Lifecycle tracking from draft quotation through active billing and renewal
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/quotation-templates">
            <Button variant="secondary" icon={<Layers className="w-4 h-4 text-[#6D6572]" />}>
              Quotation Templates
            </Button>
          </Link>
          <Link to="/subscriptions/new">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              New Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6D6572] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by number, customer name, company..."
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
          <span className="text-[#6D6572] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="erp-input min-w-[140px] bg-white"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="quotation">Quotation</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </Card>

      {/* Table Card */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
              <tr>
                <th className="py-3 px-4">Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Invoice</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-6">
                    <LoadingState message="Loading subscriptions..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchSubscriptions} />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4">
                    <EmptyState
                      title="No Subscriptions Found"
                      description="No records match your query or filters. Create a new quotation to get started."
                      actionLabel="+ New Quotation"
                      onAction={() => navigate('/subscriptions/new')}
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => navigate(`/subscriptions/${sub.id}`)}
                    className="hover:bg-[#F6F5F7]/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#6B4A6B]">
                      {sub.number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1F1A21]">{sub.customer_name}</p>
                      {sub.customer_company && (
                        <p className="text-[11px] text-[#6D6572] flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          <span>{sub.customer_company}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#1F1A21]">{sub.plan_name}</p>
                      <span className="text-[11px] text-[#6D6572] capitalize">
                        {sub.plan_billing_period}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={sub.status} type="subscription" />
                    </td>
                    <td className="py-3 px-4 text-[#6D6572]">
                      {formatDate(sub.next_invoice_date)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#1F1A21]">
                      {formatMoney(sub.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[12px] font-medium text-[#6B4A6B] hover:underline">
                        View Details →
                      </span>
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
    </div>
  );
};
