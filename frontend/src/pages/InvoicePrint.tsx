import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Printer } from 'lucide-react';

export const InvoicePrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get<any>(`/invoices/${id}`);
        setInvoice(res);
      } catch (err) {
        console.error('Failed to load invoice for printing', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

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
    return <div className="p-8 text-center text-[#6D6572] font-sans">Loading invoice print view...</div>;
  }

  if (!invoice) {
    return <div className="p-8 text-center text-[#C0392B] font-sans">Invoice not found or inaccessible.</div>;
  }

  return (
    <div className="bg-white min-h-screen text-[#1F1A21] p-8 sm:p-12 font-sans selection:bg-[#F1EAF1]">
      {/* Top action toolbar (hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden border-b border-[#E3DFE5] pb-4">
        <span className="text-[13px] text-[#6D6572]">Print Preview for <strong>{invoice.number}</strong></span>
        <Button
          variant="primary"
          onClick={() => window.print()}
          icon={<Printer className="w-4 h-4" />}
        >
          Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#E3DFE5] pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-[#6B4A6B] flex items-center justify-center text-white">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </div>
              <span className="text-[22px] font-bold text-[#1F1A21] tracking-tight">Brightloop</span>
            </div>
            <p className="text-[12px] text-[#6D6572]">Subscription Billing & Revenue Platform</p>
            <p className="text-[12px] text-[#6D6572]">billing@brightloop.io | https://brightloop.io</p>
          </div>
          <div className="text-right">
            <h1 className="text-[24px] font-bold text-[#1F1A21] uppercase tracking-wider">INVOICE</h1>
            <p className="text-[14px] font-mono font-semibold text-[#6B4A6B] mt-1">{invoice.number}</p>
            <div className="mt-2">
              <StatusBadge status={invoice.status} type="invoice" isOverdue={invoice.is_overdue} />
            </div>
          </div>
        </div>

        {/* Customer & Period Info */}
        <div className="grid grid-cols-2 gap-8 bg-[#F6F5F7] p-6 rounded-lg text-[13px] border border-[#E3DFE5]">
          <div>
            <div className="font-semibold text-[#6D6572] uppercase tracking-wider text-[11px] mb-2">Billed To</div>
            <div className="text-[15px] font-semibold text-[#1F1A21]">{invoice.customer_name}</div>
            <div className="text-[#6D6572] mt-1">Customer Account #{invoice.customer_id}</div>
          </div>
          <div className="text-right space-y-1 text-[#6D6572]">
            <div>
              <strong>Subscription:</strong> {invoice.subscription_number || 'N/A'}
            </div>
            <div>
              <strong>Period:</strong> {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
            </div>
            <div>
              <strong>Issued On:</strong> {formatDate(invoice.created_at)}
            </div>
            <div className="text-[#C0392B] font-semibold">
              <strong>Due Date:</strong> {formatDate(invoice.due_date)}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b-2 border-[#E3DFE5] text-[#6D6572] uppercase text-[11px] font-semibold">
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Tax</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5]">
              {invoice.lines.map((l: any) => (
                <tr key={l.id}>
                  <td className="py-3 font-medium text-[#1F1A21]">{l.description}</td>
                  <td className="py-3 text-center text-[#6D6572] tabular-nums">{l.quantity}</td>
                  <td className="py-3 text-right text-[#6D6572] tabular-nums">{formatCurrency(l.unit_price)}</td>
                  <td className="py-3 text-right text-[#6D6572] tabular-nums">{formatCurrency(l.tax_amount)}</td>
                  <td className="py-3 text-right font-semibold text-[#1F1A21] tabular-nums">{formatCurrency(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-1.5 text-[13px]">
            <div className="flex justify-between text-[#6D6572]">
              <span>Subtotal:</span>
              <span className="font-medium text-[#1F1A21] tabular-nums">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-[#1E8E5A] font-medium">
                <span>Discount:</span>
                <span className="tabular-nums">-{formatCurrency(invoice.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6D6572]">
              <span>Taxes:</span>
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
            <div className="flex justify-between text-[15px] font-semibold pt-1.5 border-t border-[#E3DFE5]">
              <span>Balance Due:</span>
              <span className={`tabular-nums ${invoice.balance_due > 0 ? 'text-[#C0392B]' : 'text-[#1E8E5A]'}`}>
                {formatCurrency(invoice.balance_due)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t border-[#E3DFE5] text-center text-[12px] text-[#6D6572]">
          Thank you for choosing Brightloop. For inquiries regarding this invoice, please reach out to billing@brightloop.io.
        </div>
      </div>
    </div>
  );
};
