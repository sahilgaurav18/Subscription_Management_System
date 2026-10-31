import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Customer, Subscription } from '../types/models';
import { api } from '../services/api';
import { useSSE } from '../hooks/useSSE';
import { formatMoney, formatDate } from '../utils/format';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState, EmptyState } from '../components/UIStates';
import { Card } from '../components/Card';
import {
  ShieldCheck,
  Building,
  MapPin,
  Receipt,
  Calendar,
  Download,
  Printer,
  Layers,
  Radio,
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices'>('subscriptions');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortalData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (user?.customer_id) {
        const [cRes, sRes, invRes] = await Promise.all([
          api.get<Customer>(`/customers/${user.customer_id}`),
          api.get<{ items: Subscription[] }>('/subscriptions', { page: 1, page_size: 50 }),
          api.get<{ items: any[] }>('/invoices', { page: 1, page_size: 50 }),
        ]);
        setCustomer(cRes);
        setSubscriptions(sRes.items || []);
        setInvoices(invRes.items || []);
      }
    } catch (err) {
      console.error('Failed to load portal data', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Live real-time SSE listener with 30s polling fallback
  const { isConnected } = useSSE({
    onEvent: (eventType) => {
      if (
        eventType === 'payment_recorded' ||
        eventType === 'invoice_status_changed' ||
        eventType === 'invoice_created' ||
        eventType === 'subscription_status_changed'
      ) {
        fetchPortalData(true);
      }
    },
    fallbackIntervalMs: 30000,
    onFallbackPoll: () => {
      fetchPortalData(true);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#1E8E5A]" />
            <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight">Customer Portal</h1>
          </div>
          <p className="text-[13px] text-[#6D6572] mt-1">
            Logged in as <span className="font-semibold text-[#1F1A21]">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${
              isConnected
                ? 'bg-[#EDFDF5] text-[#1E8E5A] border-[#C6F6D5]'
                : 'bg-[#FFFBEB] text-[#B7791F] border-[#FEEBC8]'
            }`}
          >
            <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-[#1E8E5A]' : 'text-[#B7791F]'}`} />
            <span>{isConnected ? 'LIVE' : '30s SYNC'}</span>
          </span>
          <span className="px-3 py-1 bg-[#EDFDF5] text-[#1E8E5A] border border-[#C6F6D5] rounded text-[12px] font-medium">
            Customer Account Verified
          </span>
        </div>
      </Card>

      {/* Organization Profile */}
      <Card className="space-y-4">
        <h2 className="text-[14px] font-semibold text-[#1F1A21] uppercase tracking-wider">
          Organization & Billing Profile
        </h2>

        {isLoading ? (
          <p className="text-[13px] text-[#6D6572]">Loading profile details...</p>
        ) : !customer ? (
          <p className="text-[13px] text-[#6D6572]">No customer organization linked to this account.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded bg-[#F1EAF1] text-[#6B4A6B]">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[12px] text-[#6D6572] block font-medium">Organization</span>
                <p className="text-[14px] font-semibold text-[#1F1A21]">{customer.name}</p>
                {customer.company && (
                  <p className="text-[12px] text-[#6D6572]">{customer.company}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 rounded bg-[#EDFDF5] text-[#1E8E5A]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[12px] text-[#6D6572] block font-medium">Billing Address</span>
                <p className="text-[13px] font-medium text-[#1F1A21]">
                  {customer.billing_address || 'No billing address registered'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 rounded bg-[#F1EAF1] text-[#6B4A6B]">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[12px] text-[#6D6572] block font-medium">Tax Registration</span>
                <p className="text-[13px] font-medium text-[#1F1A21]">
                  {customer.tax_id || 'Exempt / Not Provided'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-[#E3DFE5]">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center space-x-2 py-3 px-4 font-semibold text-[13px] border-b-2 transition ${
            activeTab === 'subscriptions'
              ? 'border-[#6B4A6B] text-[#6B4A6B]'
              : 'border-transparent text-[#6D6572] hover:text-[#1F1A21]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Subscriptions ({subscriptions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center space-x-2 py-3 px-4 font-semibold text-[13px] border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-[#6B4A6B] text-[#6B4A6B]'
              : 'border-transparent text-[#6D6572] hover:text-[#1F1A21]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices & Payments ({invoices.length})</span>
        </button>
      </div>

      {/* Tab 1: Subscriptions List */}
      {activeTab === 'subscriptions' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DFE5] pb-3">
            <h2 className="text-[14px] font-semibold text-[#1F1A21] uppercase tracking-wider">
              Active Software Subscriptions
            </h2>
            <span className="text-[12px] text-[#6D6572] font-mono tabular-nums">
              {subscriptions.length} service(s)
            </span>
          </div>

          {isLoading ? (
            <LoadingState message="Loading your subscriptions..." />
          ) : subscriptions.length === 0 ? (
            <EmptyState
              title="No Active Subscriptions"
              description="No active subscriptions found. Our sales and support team will dispatch your customized quotation shortly."
            />
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-lg border border-[#E3DFE5] bg-[#FFFFFF] hover:border-[#6B4A6B]/40 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E3DFE5] pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-[14px] text-[#6B4A6B]">
                        {sub.number}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>

                    <div className="text-right">
                      <span className="text-[15px] font-semibold text-[#1F1A21] font-mono tabular-nums">
                        {formatMoney(sub.total_amount)}
                      </span>
                      <span className="text-[11px] text-[#6D6572] block capitalize">
                        {sub.plan_billing_period} commitment
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px] text-[#1F1A21] pt-1">
                    <div>
                      <span className="text-[#6D6572] block text-[11px] font-medium">Subscription Plan</span>
                      <strong className="text-[#1F1A21] font-semibold">{sub.plan_name}</strong>
                    </div>
                    <div>
                      <span className="text-[#6D6572] block text-[11px] font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#6B4A6B]" /> Next Billing Date
                      </span>
                      <strong className="text-[#6B4A6B] font-mono tabular-nums">{formatDate(sub.next_invoice_date)}</strong>
                    </div>
                    <div>
                      <span className="text-[#6D6572] block text-[11px] font-medium">Payment Terms</span>
                      <strong className="text-[#1F1A21] font-medium">{sub.payment_terms}</strong>
                    </div>
                  </div>

                  {/* Lines summary */}
                  <div className="bg-[#F6F5F7] p-3 rounded border border-[#E3DFE5] text-[12px] space-y-1">
                    <span className="font-semibold text-[#6D6572] text-[11px] uppercase tracking-wider block mb-1">
                      Included Software & Licenses
                    </span>
                    {sub.lines.map((line) => (
                      <div key={line.id} className="flex justify-between text-[#1F1A21]">
                        <span>
                          {line.product_name} {line.variant_value ? `(${line.variant_value})` : ''} × {line.quantity}
                        </span>
                        <span className="font-medium font-mono tabular-nums">
                          {formatMoney(line.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Invoices & Payments */}
      {activeTab === 'invoices' && (
        <Card noPadding className="overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E3DFE5] flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#1F1A21] uppercase tracking-wider">
              Billing Invoices & Receipts
            </h2>
            <span className="text-[12px] text-[#6D6572] font-mono tabular-nums">{invoices.length} invoice(s) on file</span>
          </div>

          {isLoading ? (
            <div className="p-8">
              <LoadingState message="Loading your invoice history..." />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No Invoices On File"
                description="No billing invoices have been generated yet for your account."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px] min-w-[750px]">
                <thead>
                  <tr className="bg-[#F6F5F7] border-b border-[#E3DFE5] text-[12px] font-medium text-[#6D6572]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DFE5] text-[#1F1A21]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F6F5F7] transition">
                      <td className="py-3.5 px-4 font-bold text-[#6B4A6B] font-mono">
                        {inv.number}
                      </td>
                      <td className="py-3.5 px-4 text-[#6D6572] font-mono tabular-nums text-[12px]">
                        {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                      </td>
                      <td className="py-3.5 px-4 text-[#6D6572] font-mono tabular-nums text-[12px]">
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#1F1A21] font-mono tabular-nums">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#1E8E5A] font-mono tabular-nums">
                        {formatMoney(inv.amount_paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold font-mono tabular-nums">
                        {inv.balance_due > 0 ? (
                          <span className="text-[#C0392B]">{formatMoney(inv.balance_due)}</span>
                        ) : (
                          <span className="text-[#1E8E5A]">$0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} isOverdue={inv.is_overdue} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[12px] font-medium text-[#1F1A21] bg-[#FFFFFF] hover:bg-[#F6F5F7] rounded border border-[#E3DFE5] transition"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-[#6D6572]" />
                            <span>PDF</span>
                          </a>

                          <a
                            href={`/invoices/${inv.id}/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[12px] font-medium text-[#1F1A21] bg-[#FFFFFF] hover:bg-[#F6F5F7] rounded border border-[#E3DFE5] transition"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#6D6572]" />
                            <span>Print</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
