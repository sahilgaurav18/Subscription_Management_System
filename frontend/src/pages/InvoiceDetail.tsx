import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { LoadingState, ErrorState } from '../components/UIStates';
import paymentMethodsConfig from '@shared/config/payment_methods.json';
import {
  ArrowLeft,
  Building,
  Calendar,
  Clock,
  Download,
  Printer,
  Mail,
  DollarSign,
  Tag,
  CheckCircle,
} from 'lucide-react';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payMethod, setPayMethod] = useState('credit_card');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>(`/invoices/${id}`);
      setInvoice(res);
      if (res.balance_due > 0) {
        setPayAmount((res.balance_due / 100).toFixed(2));
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to load invoice details.' });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleConfirm = async () => {
    if (!window.confirm('Confirm this invoice? Once confirmed, the invoice is locked and ready for payment.')) return;
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await api.post<any>(`/invoices/${id}/confirm`);
      setInvoice(res);
      setActionMessage({ type: 'success', text: 'Invoice confirmed successfully.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to confirm invoice.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await api.post<any>(`/invoices/${id}/cancel`);
      setInvoice(res);
      setActionMessage({ type: 'success', text: 'Invoice cancelled.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to cancel invoice.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await api.post<any>(`/invoices/${id}/send-email`);
      setActionMessage({ type: 'success', text: res.message || 'Invoice email dispatched.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to dispatch email.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const dollars = parseFloat(payAmount);
    if (isNaN(dollars) || dollars <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }
    const cents = Math.round(dollars * 100);
    if (cents > invoice.balance_due) {
      alert(`Payment amount ($${dollars.toFixed(2)}) cannot exceed balance due ($${(invoice.balance_due / 100).toFixed(2)}).`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await api.post<any>(`/invoices/${id}/payments`, {
        method: payMethod,
        amount: cents,
        paid_on: payDate ? new Date(payDate).toISOString() : undefined,
        note: payNote || undefined,
      });
      setInvoice(res);
      setShowPaymentModal(false);
      setPayNote('');
      setActionMessage({ type: 'success', text: 'Payment recorded successfully.' });
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmittingPayment(false);
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

  if (isLoading) {
    return (
      <Card>
        <LoadingState message="Loading invoice and payment snapshot..." />
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card className="p-6">
        <ErrorState
          title="Invoice Not Found"
          message="Invoice could not be retrieved or you do not have permission to view it."
          onRetry={fetchInvoice}
        />
        <div className="text-center mt-3">
          <Link to="/invoices">
            <Button variant="link">← Back to Invoices</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6D6572] hover:text-[#1F1A21] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-lg text-[13px] font-medium flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-[#EAF6EE] text-[#1E8E5A] border-[#C6E8D2]'
              : 'bg-[#FDF2F2] text-[#C0392B] border-[#F8D2D0]'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[#6D6572] hover:text-[#1F1A21] p-1 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Card with action buttons on right */}
      <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-[#1F1A21] tracking-tight font-mono">{invoice.number}</h1>
            <StatusBadge status={invoice.status} type="invoice" isOverdue={invoice.is_overdue} />
          </div>
          <p className="text-[12px] text-[#6D6572] mt-1">
            Subscription: <strong className="text-[#1F1A21]">{invoice.subscription_number || 'N/A'}</strong> | Billed to: <strong className="text-[#1F1A21]">{invoice.customer_name}</strong>
          </p>
        </div>

        {/* Action Buttons: Confirm, Record payment, Email, PDF, Print, Cancel */}
        <div className="flex flex-wrap items-center gap-2">
          {isStaffOrAdmin && invoice.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              isLoading={isActionLoading}
              icon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Confirm Invoice
            </Button>
          )}

          {isStaffOrAdmin && invoice.status === 'confirmed' && invoice.balance_due > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPaymentModal(true)}
              icon={<DollarSign className="w-3.5 h-3.5" />}
            >
              Record Payment
            </Button>
          )}

          {isStaffOrAdmin && (invoice.status === 'confirmed' || invoice.status === 'paid') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSendEmail}
              isLoading={isActionLoading}
              icon={<Mail className="w-3.5 h-3.5" />}
            >
              Email PDF
            </Button>
          )}

          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
              PDF
            </Button>
          </a>

          <Link
            to={`/invoices/${invoice.id}/print`}
            target="_blank"
          >
            <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>
              Print
            </Button>
          </Link>

          {isStaffOrAdmin && (invoice.status === 'draft' || invoice.status === 'confirmed') && invoice.payments.length === 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              isLoading={isActionLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Customer and Period Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6D6572] uppercase tracking-wider">
            <Building className="w-3.5 h-3.5 text-[#6D6572]" />
            <span>Customer Details</span>
          </div>
          <div className="text-[15px] font-semibold text-[#1F1A21]">{invoice.customer_name || 'N/A'}</div>
          <div className="text-[12px] text-[#6D6572]">ID: #{invoice.customer_id}</div>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6D6572] uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-[#6D6572]" />
            <span>Billing Period</span>
          </div>
          <div className="text-[15px] font-semibold text-[#1F1A21]">
            {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
          </div>
          <div className="text-[12px] text-[#6D6572]">Generated automatically by nightly billing engine</div>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6D6572] uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#6D6572]" />
            <span>Payment Terms & Due Date</span>
          </div>
          <div className="text-[15px] font-semibold text-[#C0392B]">
            Due: {formatDate(invoice.due_date)}
          </div>
          <div className="text-[12px] text-[#6D6572]">Issued On: {formatDate(invoice.created_at)}</div>
        </Card>
      </div>

      {/* Line Items Snapshot */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E3DFE5] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#1F1A21]">Itemized Invoice Lines (Snapshot)</h2>
          <span className="text-[12px] text-[#6D6572]">Frozen upon invoice generation</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6 text-center">Quantity</th>
                <th className="py-3 px-6 text-right">Unit Price</th>
                <th className="py-3 px-6 text-right">Line Tax</th>
                <th className="py-3 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {invoice.lines.map((l: any) => (
                <tr key={l.id} className="hover:bg-[#F6F5F7]/80">
                  <td className="py-3.5 px-6 font-semibold text-[#1F1A21]">{l.description}</td>
                  <td className="py-3.5 px-6 text-center tabular-nums text-[#6D6572]">{l.quantity}</td>
                  <td className="py-3.5 px-6 text-right tabular-nums text-[#6D6572]">{formatCurrency(l.unit_price)}</td>
                  <td className="py-3.5 px-6 text-right tabular-nums text-[#6D6572]">{formatCurrency(l.tax_amount)}</td>
                  <td className="py-3.5 px-6 text-right tabular-nums font-semibold text-[#1F1A21]">{formatCurrency(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="p-6 bg-[#F6F5F7]/60 border-t border-[#E3DFE5] flex justify-end">
          <div className="w-72 space-y-2 text-[13px]">
            <div className="flex justify-between text-[#6D6572]">
              <span>Subtotal:</span>
              <span className="font-medium text-[#1F1A21] tabular-nums">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-[#1E8E5A] font-medium">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Discount Applied:</span>
                </span>
                <span className="tabular-nums">-{formatCurrency(invoice.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6D6572]">
              <span>Tax Total:</span>
              <span className="font-medium text-[#1F1A21] tabular-nums">{formatCurrency(invoice.tax_total)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold text-[#1F1A21] pt-2 border-t border-[#E3DFE5]">
              <span>Grand Total:</span>
              <span className="text-[#6B4A6B] tabular-nums">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-[#1E8E5A] font-medium pt-1">
              <span>Amount Paid:</span>
              <span className="tabular-nums">{formatCurrency(invoice.amount_paid)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold pt-2 border-t border-[#E3DFE5]">
              <span className="text-[#1F1A21]">Remaining Balance:</span>
              <span className={`tabular-nums ${invoice.balance_due > 0 ? 'text-[#C0392B]' : 'text-[#1E8E5A]'}`}>
                {formatCurrency(invoice.balance_due)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment History Card */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E3DFE5] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#1F1A21] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#1E8E5A]" />
            <span>Recorded Payment History</span>
          </h2>
          {isStaffOrAdmin && invoice.status === 'confirmed' && invoice.balance_due > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPaymentModal(true)}
            >
              + Record Payment
            </Button>
          )}
        </div>

        {invoice.payments.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#6D6572]">
            No payments have been recorded against this invoice yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#F6F5F7] text-[12px] font-medium text-[#6D6572] border-b border-[#E3DFE5]">
                <th className="py-2.5 px-6">Payment ID</th>
                <th className="py-2.5 px-6">Paid On</th>
                <th className="py-2.5 px-6">Method</th>
                <th className="py-2.5 px-6">Note</th>
                <th className="py-2.5 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5] text-[13px] text-[#1F1A21]">
              {invoice.payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-[#F6F5F7]/80">
                  <td className="py-3 px-6 font-mono text-[12px] text-[#6D6572]">#{p.id}</td>
                  <td className="py-3 px-6 text-[#1F1A21]">{formatDate(p.paid_on)}</td>
                  <td className="py-3 px-6 capitalize text-[#1F1A21]">{p.method.replace('_', ' ')}</td>
                  <td className="py-3 px-6 text-[#6D6572]">{p.note || '—'}</td>
                  <td className="py-3 px-6 text-right font-semibold text-[#1E8E5A] tabular-nums">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <FormField label="Payment Method" htmlFor="payMethod">
            <select
              id="payMethod"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="erp-input bg-white"
            >
              {paymentMethodsConfig.methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Payment Amount ($ USD)"
            htmlFor="payAmount"
            helperText={`Current balance due: ${formatCurrency(invoice.balance_due)}. Overpayment is strictly rejected.`}
          >
            <div className="flex flex-col gap-1">
              <input
                id="payAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={(invoice.balance_due / 100).toFixed(2)}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="erp-input font-medium tabular-nums"
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setPayAmount((invoice.balance_due / 100).toFixed(2))}
                  className="text-[11px] font-medium text-[#6B4A6B] hover:underline"
                >
                  Pay Full Balance ({formatCurrency(invoice.balance_due)})
                </button>
              </div>
            </div>
          </FormField>

          <FormField label="Payment Date" htmlFor="payDate" required>
            <input
              id="payDate"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="erp-input"
              required
            />
          </FormField>

          <FormField label="Note / Reference (Optional)" htmlFor="payNote">
            <textarea
              id="payNote"
              rows={2}
              placeholder="e.g. Wire transfer ref #TX-998811"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="erp-input py-2"
            />
          </FormField>

          <div className="pt-3 border-t border-[#E3DFE5] flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingPayment}
            >
              Save Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
