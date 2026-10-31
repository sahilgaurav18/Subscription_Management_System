import React, { useState, useEffect, useRef } from 'react';
import {
  SIM_SUBSCRIPTIONS,
  type SimSubscription,
  type SimInvoice,
} from '../../data/landingDemoData';
import { ConfettiBurst } from './ConfettiBurst';
import {
  Zap,
  CheckCircle2,
  Receipt,
  RotateCcw,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const BillingSimulator: React.FC = () => {
  const [subs, setSubs] = useState<SimSubscription[]>(SIM_SUBSCRIPTIONS);
  const [invoices, setInvoices] = useState<SimInvoice[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeProcessId, setActiveProcessId] = useState<number | null>(null);
  const [hasRunBilling, setHasRunBilling] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [revenueReceived, setRevenueReceived] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Total outstanding is sum of unpaid invoices
  const outstandingDue = invoices
    .filter((inv) => !inv.isPaid)
    .reduce((sum, inv) => sum + inv.total, 0);

  // Run Billing Engine
  const handleRunBilling = () => {
    if (isRunning) return;

    if (hasRunBilling) {
      setToastMessage({
        text: 'Nothing to bill: 0 invoices created (No double billing constraint enforced)',
        type: 'info',
      });
      return;
    }

    setIsRunning(true);
    setToastMessage(null);

    // Stagger process subscriptions one by one
    subs.forEach((sub, index) => {
      setTimeout(() => {
        setActiveProcessId(sub.id);

        // Update sub state
        setSubs((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? {
                  ...s,
                  status: 'billed',
                  nextInvoice: sub.period === 'yearly' ? 'Oct 2027' : 'Nov 2026',
                }
              : s
          )
        );

        // Calculate invoice math
        const dollars = sub.amount / 100;
        const discount = sub.discountDollars;
        const taxable = Math.max(0, dollars - discount);
        const tax = Math.round(taxable * (sub.taxPercent / 100) * 100) / 100;
        const total = Math.round((taxable + tax) * 100) / 100;

        const newInvoice: SimInvoice = {
          id: sub.id,
          invoiceNumber: `INV-2026-0${sub.id}0`,
          subNumber: sub.subNumber,
          customerName: sub.customerName,
          subtotal: dollars,
          discount,
          tax,
          total,
          balanceDue: total,
          isPaid: false,
          status: 'confirmed',
        };

        setInvoices((prev) => [newInvoice, ...prev]);

        // Finish after last row
        if (index === subs.length - 1) {
          setTimeout(() => {
            setIsRunning(false);
            setActiveProcessId(null);
            setHasRunBilling(true);
            setToastMessage({
              text: '6 invoices created, 0 duplicates. Billing run completed successfully.',
              type: 'success',
            });
          }, 400);
        }
      }, (index + 1) * 350);
    });
  };

  // Record Payment on Invoice
  const handleRecordPayment = (invoiceId: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId && !inv.isPaid) {
          setRevenueReceived((r) => Math.round((r + inv.total) * 100) / 100);
          setConfettiActive(true);
          return {
            ...inv,
            isPaid: true,
            balanceDue: 0,
            status: 'paid',
          };
        }
        return inv;
      })
    );
  };

  // Reset demo
  const handleReset = () => {
    setSubs(SIM_SUBSCRIPTIONS);
    setInvoices([]);
    setIsRunning(false);
    setActiveProcessId(null);
    setHasRunBilling(false);
    setToastMessage(null);
    setRevenueReceived(0);
    setConfettiActive(false);
  };

  // Keyboard shortcuts R, P, Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRunBilling();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        const firstUnpaid = invoices.find((inv) => !inv.isPaid);
        if (firstUnpaid) {
          handleRecordPayment(firstUnpaid.id);
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoices, isRunning, hasRunBilling]);

  return (
    <div
      ref={sectionRef}
      tabIndex={0}
      aria-label="Billing Day Simulator"
      className="relative max-w-6xl mx-auto bg-white rounded-3xl border border-[#E3DFE5] shadow-[0_20px_60px_-15px_rgba(107,74,107,0.14)] p-6 sm:p-8 space-y-6 focus:outline-none focus:ring-2 focus:ring-[#6B4A6B]/50"
    >
      {/* Confetti Burst Container */}
      <ConfettiBurst active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* Simulator Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DFE5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E8E5A] animate-pulse" />
            <h3 className="text-[20px] font-bold text-[#1F1A21] tracking-tight">
              Interactive Billing Engine
            </h3>
          </div>
          <p className="text-[13px] text-[#6D6572] mt-0.5">
            Test the deterministic nightly invoicing runner and payment capture in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#6D6572] hover:text-[#1F1A21] hover:bg-[#FAF9FA] border border-[#E3DFE5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
            title="Reset demo (Shortcut: Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset demo</span>
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunBilling}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[14px] text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] focus-visible:ring-offset-2 ${
              isRunning
                ? 'bg-[#6B4A6B]/70 cursor-wait'
                : 'bg-[#6B4A6B] hover:bg-[#593B59] hover:shadow-md'
            }`}
          >
            <Zap className={`w-4 h-4 ${isRunning ? 'animate-bounce text-[#F5A623]' : ''}`} />
            <span>{isRunning ? 'Billing in progress...' : 'Run billing now'}</span>
          </button>
        </div>
      </div>

      {/* Live Toast Announcement */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3 rounded-xl border text-[13px] flex items-center justify-between animate-fade-up ${
            toastMessage.type === 'success'
              ? 'bg-[#EDFDF5] border-[#C6F6D5] text-[#1E8E5A]'
              : 'bg-[#FFFBEB] border-[#FEEBC8] text-[#B7791F]'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#B7791F] shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[11px] font-semibold underline ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel 1: Subscriptions Due Today (5 cols) */}
        <div className="lg:col-span-5 bg-[#FAF9FA] rounded-2xl border border-[#E3DFE5] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3DFE5]">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6D6572]">
              Subscriptions Due Today
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF8FF] text-[#2B6CB0]">
              {subs.filter((s) => s.status === 'active').length} Due
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {subs.map((sub) => {
              const isProcessing = activeProcessId === sub.id;
              const isBilled = sub.status === 'billed';

              return (
                <div
                  key={sub.id}
                  className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    isProcessing
                      ? 'bg-[#FFFBEB] border-[#F5A623] shadow-md scale-[1.02]'
                      : isBilled
                      ? 'bg-white/60 border-[#E3DFE5] opacity-80'
                      : 'bg-white border-[#E3DFE5] hover:border-[#6B4A6B]/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#1F1A21]">{sub.customerName}</span>
                    <span className="font-mono font-bold text-[#1F1A21]">
                      ${(sub.amount / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6D6572] mt-1">
                    <span>
                      {sub.planName} • {sub.period}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isProcessing ? (
                        <span className="inline-flex items-center gap-1 text-[#B7791F] font-semibold animate-pulse">
                          <Clock className="w-3 h-3 animate-spin" />
                          Billing...
                        </span>
                      ) : isBilled ? (
                        <span className="inline-flex items-center gap-1 text-[#1E8E5A] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Billed ({sub.nextInvoice})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F6F5F7] text-[#6D6572]">
                          Due Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Invoices Created (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E3DFE5] p-4 space-y-3 min-h-[380px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3DFE5]">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6D6572] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#6B4A6B]" />
              Generated Invoices
            </span>
            <span className="text-[11px] font-mono font-semibold text-[#6B4A6B]">
              {invoices.length} Created
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[320px] pr-1">
            {invoices.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6D6572] space-y-2">
                <Receipt className="w-8 h-8 opacity-40 text-[#6B4A6B]" />
                <p className="text-[13px]">No invoices generated yet.</p>
                <p className="text-[11px] text-[#6D6572]/80">
                  Click &quot;Run billing now&quot; above to watch the worker create locked records.
                </p>
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-3 rounded-xl border transition-all duration-300 space-y-2 ${
                    inv.isPaid
                      ? 'bg-[#EDFDF5]/50 border-[#C6F6D5]'
                      : 'bg-[#FAF9FA] border-[#E3DFE5] hover:border-[#6B4A6B]/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-mono font-bold text-[#6B4A6B]">{inv.invoiceNumber}</span>
                    <span className="font-mono font-bold text-[#1F1A21]">${inv.total.toFixed(2)}</span>
                  </div>

                  <div className="text-[11px] text-[#6D6572] flex items-center justify-between">
                    <span className="truncate max-w-[120px]">{inv.customerName}</span>
                    <span>
                      {inv.tax > 0 && `+tax $${inv.tax.toFixed(2)} `}
                      {inv.discount > 0 && `-$${inv.discount.toFixed(2)} off`}
                    </span>
                  </div>

                  {/* Payment Action / Paid Badge */}
                  <div className="pt-1 flex items-center justify-between">
                    {inv.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#1E8E5A] text-white">
                        <CheckCircle2 className="w-3 h-3" />
                        PAID
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRecordPayment(inv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#12C2A5] hover:bg-[#0fa990] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12C2A5]"
                        title="Shortcut: P"
                      >
                        <DollarSign className="w-3 h-3" />
                        Record payment
                      </button>
                    )}

                    <span className="text-[11px] text-[#6D6572] font-mono">
                      {inv.isPaid ? '$0.00 Due' : `$${inv.balanceDue.toFixed(2)} Due`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel 3: Revenue & Reconciliation (3 cols) */}
        <div className="lg:col-span-3 bg-[#FAF9FA] rounded-2xl border border-[#E3DFE5] p-4 space-y-4">
          <div className="pb-2 border-b border-[#E3DFE5]">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#6D6572]">
              Live Financials
            </span>
          </div>

          {/* MRR Card */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E3DFE5]">
            <div className="text-[11px] text-[#6D6572] font-medium flex items-center justify-between">
              <span>Monthly Run Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#1E8E5A]" />
            </div>
            <div className="text-[22px] font-bold font-mono text-[#1F1A21] mt-1">
              $24,800.00
            </div>
            <span className="text-[10px] text-[#1E8E5A] font-semibold">+12.4% vs last period</span>
          </div>

          {/* Revenue Received Card */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E3DFE5]">
            <div className="text-[11px] text-[#6D6572] font-medium">Revenue Collected</div>
            <div className="text-[22px] font-bold font-mono text-[#1E8E5A] mt-1 tabular-nums">
              ${revenueReceived.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#6D6572]">Instant bank deposit match</span>
          </div>

          {/* Outstanding Due Card */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E3DFE5]">
            <div className="text-[11px] text-[#6D6572] font-medium">Outstanding Balance</div>
            <div className="text-[20px] font-bold font-mono text-[#F5A623] mt-1 tabular-nums">
              ${outstandingDue.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#6D6572]">Auto-reminder alerts active</span>
          </div>

          {/* Mini Revenue Bars */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E3DFE5]">
            <div className="text-[10px] uppercase font-bold text-[#6D6572] mb-2">Monthly Trajectory</div>
            <div className="flex items-end justify-between h-10 gap-1.5 px-1">
              <div className="w-3 bg-[#6B4A6B]/20 rounded-t h-4" />
              <div className="w-3 bg-[#6B4A6B]/35 rounded-t h-6" />
              <div className="w-3 bg-[#6B4A6B]/50 rounded-t h-7" />
              <div className="w-3 bg-[#6B4A6B]/70 rounded-t h-8" />
              <div className="w-3 bg-[#6B4A6B] rounded-t h-10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Strip */}
      <div className="pt-3 border-t border-[#E3DFE5] flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#6D6572]">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#1F1A21]">Live Shortcuts:</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-[#FAF9FA] border border-[#E3DFE5] font-mono font-bold text-[#6B4A6B]">R</kbd> Run billing</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-[#FAF9FA] border border-[#E3DFE5] font-mono font-bold text-[#12C2A5]">P</kbd> Record payment</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-[#FAF9FA] border border-[#E3DFE5] font-mono font-bold text-[#6D6572]">Z</kbd> Reset</span>
        </div>
        <span className="text-[11px] font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
          Double-billing prevented by unique period constraints
        </span>
      </div>
    </div>
  );
};

