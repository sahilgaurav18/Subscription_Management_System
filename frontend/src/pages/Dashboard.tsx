import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useSSE } from '../hooks/useSSE';
import { LoadingState, EmptyState, ErrorState } from '../components/UIStates';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { BentoTile } from '../components/BentoTile';
import { formatMoney, formatDate } from '../utils/format';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Repeat,
  Download,
  Filter,
  RefreshCw,
  Mail,
  Eye,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface FinanceMetrics {
  active_subscriptions_count: number;
  revenue_received: number;
  amount_still_owed: number;
  mrr: number;
  revenue_by_month: Array<{ month: string; revenue: number }>;
}

interface OverdueInvoice {
  id: number;
  number: string;
  customer_id: number;
  customer_name: string;
  subscription_number: string;
  due_date: string;
  period_start: string;
  period_end: string;
  total: number;
  amount_paid: number;
  balance_due: number;
  days_overdue: number;
  status: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Dropdown options
  const [customersList, setCustomersList] = useState<Array<{ id: number; name: string }>>([]);
  const [plansList, setPlansList] = useState<Array<{ id: number; name: string }>>([]);

  // Data State
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reminders Action State
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  // Fetch metrics and overdue list
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate).toISOString();
      if (selectedCustomerId) params.customer_id = parseInt(selectedCustomerId);
      if (selectedPlanId) params.plan_id = parseInt(selectedPlanId);
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get<{
        metrics: FinanceMetrics;
        overdue_invoices: OverdueInvoice[];
        is_admin: boolean;
      }>('/reports/finance', params);

      setMetrics(res.metrics);
      setOverdueInvoices(res.overdue_invoices);
    } catch (err: any) {
      setError(err.message || 'Failed to load finance reporting metrics');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [startDate, endDate, selectedCustomerId, selectedPlanId, selectedStatus]);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          api.get<{ items: Array<{ id: number; name: string }> }>('/customers', { page: 1, page_size: 100 }),
          api.get<{ items: Array<{ id: number; name: string }> }>('/plans', { page: 1, page_size: 100 }),
        ]);
        setCustomersList(cRes.items || []);
        setPlansList(pRes.items || []);
      } catch (e) {
        console.error('Failed to load filter metadata', e);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch on filter change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time SSE connection with 30s polling fallback
  const { isConnected } = useSSE({
    onEvent: (eventType) => {
      if (
        eventType === 'finance_update' ||
        eventType === 'payment_recorded' ||
        eventType === 'invoice_created' ||
        eventType === 'invoice_status_changed' ||
        eventType === 'subscription_status_changed'
      ) {
        fetchDashboardData(true);
      }
    },
    fallbackIntervalMs: 30000,
    onFallbackPoll: () => {
      fetchDashboardData(true);
    },
  });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCustomerId('');
    setSelectedPlanId('');
    setSelectedStatus('');
  };

  const handleTriggerReminders = async () => {
    if (!window.confirm('Dispatch overdue reminder emails to all customers with outstanding overdue invoices?')) return;
    setIsSendingReminders(true);
    setReminderMessage(null);
    try {
      const res = await api.post<any>('/reports/reminders/run-now');
      setReminderMessage(res.message || 'Overdue reminder dispatch completed.');
      fetchDashboardData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger overdue reminders');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const maxMonthlyRevenue = metrics?.revenue_by_month?.reduce(
    (max, item) => Math.max(max, item.revenue),
    0
  ) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#6B4A6B]" />
              <span>Finance Dashboard</span>
            </h1>
            <Badge variant={isConnected ? 'success' : 'warning'} size="sm">
              <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-[#1E8E5A]' : 'text-[#B7791F]'}`} />
              <span>{isConnected ? 'LIVE STREAM' : '30s POLLING'}</span>
            </Badge>
          </div>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Real-time telemetry, normalized MRR aggregates, and collections management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleTriggerReminders}
              isLoading={isSendingReminders}
              icon={<Mail className="w-4 h-4" />}
            >
              Send Overdue Reminders
            </Button>
          ) : (
            <Badge variant="neutral" size="md">
              Staff Read-Only Access
            </Badge>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => fetchDashboardData(false)}
            icon={<RefreshCw className="w-4 h-4" />}
            aria-label="Refresh dashboard data"
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Reminder Action Feedback */}
      {reminderMessage && (
        <div className="p-4 rounded-lg bg-[#EAF6EE] border border-[#C6E8D2] text-[#1E8E5A] text-[13px] font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1E8E5A]" />
            <span>{reminderMessage}</span>
          </div>
          <button
            onClick={() => setReminderMessage(null)}
            className="text-[#1E8E5A] hover:text-[#14603B] font-bold p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Interactive Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1F1A21] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#6B4A6B]" />
            <span>Filter Metrics & Collections</span>
          </div>
          {(startDate || endDate || selectedCustomerId || selectedPlanId || selectedStatus) && (
            <button
              onClick={handleClearFilters}
              className="text-[12px] font-medium text-[#6B4A6B] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-[12px]">
          <div>
            <label className="block text-[#6D6572] font-medium mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="erp-input text-xs"
            />
          </div>

          <div>
            <label className="block text-[#6D6572] font-medium mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="erp-input text-xs"
            />
          </div>

          <div>
            <label className="block text-[#6D6572] font-medium mb-1">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="erp-input text-xs bg-white"
            >
              <option value="">All Customers</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6D6572] font-medium mb-1">Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="erp-input text-xs bg-white"
            >
              <option value="">All Plans</option>
              {plansList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6D6572] font-medium mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="erp-input text-xs bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="confirmed">Confirmed</option>
              <option value="quotation">Quotation</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Bento Grid */}
      {isLoading && !metrics ? (
        <Card>
          <LoadingState message="Computing SQL financial aggregates and active MRR..." />
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchDashboardData(false)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[160px] gap-4">
          {/* Bento Tile 1: Active Subscriptions (1x1) */}
          <BentoTile
            colSpan={1}
            rowSpan={1}
            label="Active Subscriptions"
            value={metrics?.active_subscriptions_count.toLocaleString() || '0'}
            subvalue="Active recurring software contracts"
            icon={<Repeat className="w-4 h-4" />}
          />

          {/* Bento Tile 2: Monthly Recurring Revenue (1x1) */}
          <BentoTile
            colSpan={1}
            rowSpan={1}
            label="Monthly Recurring Revenue"
            value={formatMoney(metrics?.mrr || 0)}
            subvalue="Normalized across yearly, weekly, daily"
            icon={<TrendingUp className="w-4 h-4" />}
          />

          {/* Bento Tile 3: Large Tile (2x2) - Revenue By Month Chart */}
          <BentoTile
            colSpan={2}
            rowSpan={2}
            title="Revenue Trend"
            label="12-Month Performance"
            className="flex flex-col justify-between"
          >
            {metrics?.revenue_by_month?.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[13px] text-[#6D6572]">
                No monthly transactions recorded yet
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-end pt-3">
                <div className="h-44 sm:h-48 flex items-end justify-between gap-1.5 sm:gap-2 pt-4 px-1">
                  {metrics?.revenue_by_month?.map((item) => {
                    const heightPercent = Math.max(
                      Math.round((item.revenue / maxMonthlyRevenue) * 100),
                      6
                    );
                    return (
                      <div
                        key={item.month}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-8 bg-[#1F1A21] text-white text-[11px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                          {item.month}: {formatMoney(item.revenue)}
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-[#6B4A6B]/80 group-hover:bg-[#6B4A6B] rounded-t transition-all duration-150"
                        />

                        {/* Month Label */}
                        <span className="text-[10px] sm:text-[11px] font-mono text-[#6D6572] mt-1.5 truncate">
                          {item.month.slice(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </BentoTile>

          {/* Bento Tile 4: Revenue Received (1x1) */}
          <BentoTile
            colSpan={1}
            rowSpan={1}
            label="Revenue Received"
            value={formatMoney(metrics?.revenue_received || 0)}
            subvalue="Total collections settled to date"
            icon={<DollarSign className="w-4 h-4" />}
          />

          {/* Bento Tile 5: Amount Outstanding (1x1) */}
          <BentoTile
            colSpan={1}
            rowSpan={1}
            label="Amount Outstanding"
            value={formatMoney(metrics?.amount_still_owed || 0)}
            subvalue="Confirmed invoices awaiting payment"
            icon={<AlertTriangle className="w-4 h-4 text-[#B7791F]" />}
          />

          {/* Bento Tile 6: Overdue Count (1x1) */}
          <BentoTile
            colSpan={1}
            rowSpan={1}
            label="Overdue Invoices"
            value={overdueInvoices.length.toLocaleString()}
            subvalue={`${overdueInvoices.length} account(s) past payment terms`}
            icon={<AlertTriangle className="w-4 h-4 text-[#C0392B]" />}
          />

          {/* Bento Tile 7: Wide Collections & Export Tile (3x1) */}
          <BentoTile
            colSpan={3}
            rowSpan={1}
            title="Data Snapshots & Exports"
            label="Point-in-time CSV Backups"
            className="flex flex-col justify-between"
          >
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a href="/api/reports/export/invoices" target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                  Invoices CSV
                </Button>
              </a>
              <a href="/api/reports/export/subscriptions" target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                  Subscriptions CSV
                </Button>
              </a>
              <a href="/api/reports/export/customers" target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                  Customers CSV
                </Button>
              </a>
              <a href="/api/reports/export/overdue" target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                  Overdue CSV
                </Button>
              </a>
            </div>
          </BentoTile>

          {/* Bento Tile 8: Full-Width Overdue Invoices Table Tile */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bento-tile !p-0 overflow-hidden">
            <div className="p-6 border-b border-[#E3DFE5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold text-[#1F1A21] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#C0392B]" />
                  <span>Delinquent Accounts & Overdue Invoices</span>
                </h2>
                <p className="text-[13px] text-[#6D6572] mt-1">
                  Confirmed invoices past due date sorted by urgency (highest days overdue first)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/reports/export/overdue"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                    Export Overdue CSV
                  </Button>
                </a>
              </div>
            </div>

            {overdueInvoices.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Overdue Invoices"
                  description="All customer subscriptions are in good standing with zero delinquent balances."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Subscription</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-center">Days Overdue</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
                    {overdueInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#F6F5F7]/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#6B4A6B] font-mono">
                          <Link to={`/invoices/${inv.id}`} className="hover:underline">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1F1A21]">
                          {inv.customer_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[12px] text-[#6D6572]">
                          {inv.subscription_number}
                        </td>
                        <td className="py-3 px-4 text-[#6D6572]">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="danger" size="sm">
                            {inv.days_overdue} Day(s) Overdue
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#1F1A21]">
                          {formatMoney(inv.total)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#1E8E5A]">
                          {formatMoney(inv.amount_paid)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#C0392B]">
                          {formatMoney(inv.balance_due)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6B4A6B] hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
