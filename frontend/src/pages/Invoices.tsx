import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Zap,
  History,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [billingResult, setBillingResult] = useState<string | null>(null);

  // Billing Run History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [billingRuns, setBillingRuns] = useState<any[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/invoices', {
        page,
        page_size: 15,
        q: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setInvoices(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleRunBillingNow = async () => {
    if (!window.confirm('Trigger the automated billing engine now? This will bill all active subscriptions due for invoicing.')) {
      return;
    }
    setIsBillingRunning(true);
    setBillingResult(null);
    try {
      const res = await api.post<any>('/billing/run-now');
      setBillingResult(
        `Billing run #${res.id} finished: ${res.created_count} invoice(s) created, ${res.failures_count} failure(s).`
      );
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Billing run failed');
    } finally {
      setIsBillingRunning(false);
    }
  };

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setIsLoadingRuns(true);
    try {
      const res = await api.get<any>('/billing/runs', { page: 1, page_size: 20 });
      setBillingRuns(res.items || []);
    } catch (err) {
      console.error('Failed to load billing history', err);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (str: string) => {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#6B4A6B]" />
            <span>Invoices & Billing</span>
          </h1>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Automated billing engine, line-item tax & discount calculations, and payment tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user?.role === 'admin' && (
            <Button
              variant="primary"
              size="md"
              onClick={handleRunBillingNow}
              isLoading={isBillingRunning}
              icon={<Zap className="w-3.5 h-3.5" />}
            >
              Run Billing Now
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={openHistoryModal}
            icon={<History className="w-3.5 h-3.5 text-[#6D6572]" />}
          >
            Run Logs
          </Button>
        </div>
      </Card>

      {/* Result Alert */}
      {billingResult && (
        <div className="p-4 rounded-lg bg-[#EAF6EE] border border-[#C6E8D2] text-[#1E8E5A] flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1E8E5A]" />
            <span className="font-medium">{billingResult}</span>
          </div>
          <button
            onClick={() => setBillingResult(null)}
            className="text-[#1E8E5A] hover:text-[#14603B] font-semibold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D6572]" />
            <input
              type="text"
              placeholder="Search by invoice # or subscription #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="erp-input pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] text-[#6D6572] font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="erp-input text-xs min-w-[130px] bg-white"
          >
            <option value="all">All Invoices</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue Only</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchInvoices}
            title="Refresh list"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          />
        </div>
      </Card>

      {/* Invoices Table Card */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F6F5F7] border-b border-[#E3DFE5] text-[12px] font-medium text-[#6D6572]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-6">
                    <LoadingState message="Loading invoices & billing balances..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-6 px-4">
                    <ErrorState message={error} onRetry={fetchInvoices} />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 px-4">
                    <EmptyState
                      title="No Invoices Found"
                      description="No invoices match your current search or filters. Run the billing engine to generate invoices for due periods."
                      actionLabel={user?.role === 'admin' ? '⚡ Run Billing Now' : undefined}
                      onAction={user?.role === 'admin' ? handleRunBillingNow : undefined}
                    />
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F6F5F7]/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#6B4A6B] font-mono">
                      <Link to={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-[#1F1A21] font-medium">
                      {inv.customer_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6572] font-mono text-[12px]">
                      {inv.subscription_number ? (
                        <Link to={`/subscriptions/${inv.subscription_id}`} className="hover:underline text-[#6B4A6B]">
                          {inv.subscription_number}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6572]">
                      {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6572]">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium tabular-nums text-[#1F1A21]">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold tabular-nums">
                      {inv.balance_due > 0 ? (
                        <span className="text-[#C0392B]">{formatCurrency(inv.balance_due)}</span>
                      ) : (
                        <span className="text-[#1E8E5A]">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} type="invoice" isOverdue={inv.is_overdue} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="p-1.5 text-[#6D6572] hover:text-[#6B4A6B] hover:bg-[#F1EAF1] rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-[#6D6572] hover:text-[#1F1A21] hover:bg-[#F6F5F7] rounded-md transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <Link
                          to={`/invoices/${inv.id}/print`}
                          target="_blank"
                          className="p-1.5 text-[#6D6572] hover:text-[#1F1A21] hover:bg-[#F6F5F7] rounded-md transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pageSize={15}
          total={total}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      </Card>

      {/* Billing Runs Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Billing Engine Execution History"
        maxWidth="lg"
      >
        <div className="space-y-3">
          {isLoadingRuns ? (
            <div className="py-8 text-center text-[13px] text-[#6D6572]">Loading execution runs...</div>
          ) : billingRuns.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#6D6572]">No recorded billing runs yet.</div>
          ) : (
            billingRuns.map((r) => (
              <div key={r.id} className="p-3.5 rounded-lg border border-[#E3DFE5] text-[12px] space-y-1.5 bg-[#F6F5F7]/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1F1A21]">Run #{r.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                      r.status === 'completed'
                        ? 'bg-[#EAF6EE] text-[#1E8E5A]'
                        : r.status === 'failed'
                        ? 'bg-[#FDF2F2] text-[#C0392B]'
                        : 'bg-[#FEF6E7] text-[#B7791F]'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="text-[#6D6572] flex gap-4">
                  <span>Started: {new Date(r.started_at).toLocaleString()}</span>
                  <span>Trigger: {r.triggered_by}</span>
                </div>
                <div className="flex gap-4 font-medium pt-1 text-[#1F1A21]">
                  <span>Invoices Created: <strong className="text-[#6B4A6B]">{r.created_count}</strong></span>
                  <span>Failures: <strong className="text-[#C0392B]">{r.failures_count}</strong></span>
                </div>
              </div>
            ))
          )}

          <div className="pt-3 border-t border-[#E3DFE5] flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowHistoryModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
