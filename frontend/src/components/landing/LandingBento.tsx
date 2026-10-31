import React, { useState, useEffect } from 'react';
import { SpotlightCard } from './SpotlightCard';
import { CountUp } from './CountUp';
import {
  Layers,
  Receipt,
  Percent,
  CreditCard,
  UserCheck,
  BarChart3,
  CheckCircle2,
  Tag,
  ArrowUpRight,
} from 'lucide-react';

export const LandingBento: React.FC = () => {
  // Tile 3: Price countdown state
  const [discountApplied, setDiscountApplied] = useState(false);
  // Tile 4: Progress bar
  const [payProgress, setPayProgress] = useState(65);
  // Tile 5: Cycling badge
  const [badgeState, setBadgeState] = useState<'draft' | 'active' | 'paid'>('draft');

  useEffect(() => {
    // Tile 3 toggle
    const discountInterval = setInterval(() => {
      setDiscountApplied((prev) => !prev);
    }, 2800);

    // Tile 4 progress toggle
    const progressInterval = setInterval(() => {
      setPayProgress((prev) => (prev === 100 ? 50 : 100));
    }, 3200);

    // Tile 5 cycling badge
    const badgeInterval = setInterval(() => {
      setBadgeState((prev) => {
        if (prev === 'draft') return 'active';
        if (prev === 'active') return 'paid';
        return 'draft';
      });
    }, 2400);

    return () => {
      clearInterval(discountInterval);
      clearInterval(progressInterval);
      clearInterval(badgeInterval);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Tile 1: Stacked Plans Fanning Out */}
      <SpotlightCard className="p-6 group">
        <div>
          <div className="w-10 h-10 rounded-xl bg-[#F1EAF1] text-[#6B4A6B] flex items-center justify-center mb-4">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1F1A21] mb-1">
            Plans & Variants
          </h3>
          <p className="text-[14px] text-[#6D6572] leading-relaxed">
            Configure flexible daily, weekly, monthly, or yearly plans with variant pricing and auto-renew.
          </p>
        </div>

        {/* Visual: Stacked plans that fan out on hover */}
        <div className="mt-8 pt-4 border-t border-[#E3DFE5]/80 flex justify-center items-center h-28 relative">
          <div className="relative w-44 h-20">
            {/* Card 3 (Back) */}
            <div className="absolute inset-0 bg-[#FAF9FA] border border-[#E3DFE5] rounded-lg p-2 transform rotate-6 translate-x-3 -translate-y-2 group-hover:rotate-12 group-hover:translate-x-6 group-hover:-translate-y-4 transition-transform duration-300 shadow-xs">
              <div className="text-[10px] font-semibold text-[#6D6572]">Annual Enterprise</div>
              <div className="text-[12px] font-bold text-[#1F1A21] font-mono">$999/yr</div>
            </div>
            {/* Card 2 (Middle) */}
            <div className="absolute inset-0 bg-[#F1EAF1] border border-[#E1D4E1] rounded-lg p-2 transform -rotate-3 -translate-x-2 -translate-y-1 group-hover:-rotate-8 group-hover:-translate-x-5 group-hover:-translate-y-2 transition-transform duration-300 shadow-xs">
              <div className="text-[10px] font-semibold text-[#6B4A6B]">Pro Monthly</div>
              <div className="text-[12px] font-bold text-[#6B4A6B] font-mono">$99/mo</div>
            </div>
            {/* Card 1 (Front) */}
            <div className="absolute inset-0 bg-white border border-[#6B4A6B] rounded-lg p-2 shadow-sm z-10 transition-transform duration-300">
              <div className="text-[10px] font-bold text-[#1F1A21]">Starter Daily</div>
              <div className="text-[12px] font-bold text-[#6B4A6B] font-mono">$4.90/day</div>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Tile 2: Automatic Invoices Sliding In */}
      <SpotlightCard className="p-6 group">
        <div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF9FA] text-[#6B4A6B] border border-[#E3DFE5] flex items-center justify-center mb-4">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1F1A21] mb-1">
            Automatic Invoicing
          </h3>
          <p className="text-[14px] text-[#6D6572] leading-relaxed">
            Nightly billing engine generates locked PDF invoices with full audit logs and zero duplicates.
          </p>
        </div>

        {/* Visual: Invoice rows sliding in */}
        <div className="mt-8 pt-4 border-t border-[#E3DFE5]/80 space-y-2 h-28 flex flex-col justify-center">
          <div className="bg-[#FAF9FA] p-2 rounded-md border border-[#E3DFE5] flex justify-between items-center text-[11px] transform transition-transform group-hover:translate-x-1 duration-200">
            <span className="font-mono text-[#6B4A6B] font-medium">#INV-2026-091</span>
            <span className="text-[#1E8E5A] font-semibold bg-[#EDFDF5] px-1.5 py-0.5 rounded">Sent</span>
          </div>
          <div className="bg-white p-2 rounded-md border border-[#6B4A6B]/30 flex justify-between items-center text-[11px] shadow-xs transform transition-transform group-hover:-translate-x-1 duration-200">
            <span className="font-mono text-[#1F1A21] font-semibold">#INV-2026-092</span>
            <span className="text-[#6B4A6B] font-semibold bg-[#F1EAF1] px-1.5 py-0.5 rounded">Created Now</span>
          </div>
        </div>
      </SpotlightCard>

      {/* Tile 3: Taxes & Discounts with countdown chip */}
      <SpotlightCard className="p-6 group">
        <div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF9FA] text-[#F5A623] border border-[#E3DFE5] flex items-center justify-center mb-4">
            <Percent className="w-5 h-5" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1F1A21] mb-1">
            Taxes & Discounts
          </h3>
          <p className="text-[14px] text-[#6D6572] leading-relaxed">
            Multi-rule tax engine and intelligent promo discounts applied automatically per transaction.
          </p>
        </div>

        {/* Visual: Live Price Countdown */}
        <div className="mt-8 pt-4 border-t border-[#E3DFE5]/80 flex flex-col items-center justify-center h-28">
          <div className="flex items-center gap-2">
            <span className={`text-[26px] font-bold font-mono transition-all duration-300 ${
              discountApplied ? 'text-[#1E8E5A]' : 'text-[#1F1A21]'
            }`}>
              {discountApplied ? '$79.20' : '$99.00'}
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFFBEB] text-[#B7791F] border border-[#FEEBC8]">
              <Tag className="w-3 h-3" />
              -20% PROMO
            </span>
          </div>
          <span className="text-[11px] text-[#6D6572] mt-1">
            {discountApplied ? 'Best single discount applied' : 'Calculating checkout discount...'}
          </span>
        </div>
      </SpotlightCard>

      {/* Tile 4: Payment Tracking with Progress Bar */}
      <SpotlightCard className="p-6 group">
        <div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF9FA] text-[#1E8E5A] border border-[#E3DFE5] flex items-center justify-center mb-4">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1F1A21] mb-1">
            Payment Reconciliation
          </h3>
          <p className="text-[14px] text-[#6D6572] leading-relaxed">
            Record partial or full payments, prevent overpayments, and auto-mark invoices as paid.
          </p>
        </div>

        {/* Visual: Filling Progress Bar */}
        <div className="mt-8 pt-4 border-t border-[#E3DFE5]/80 flex flex-col justify-center h-28 space-y-2">
          <div className="flex justify-between items-center text-[12px]">
            <span className="text-[#6D6572]">Invoice Balance</span>
            <span className="font-semibold text-[#1F1A21] font-mono">
              {payProgress === 100 ? '$0.00 Due' : '$125.00 Due'}
            </span>
          </div>
          <div className="w-full bg-[#FAF9FA] h-3 rounded-full overflow-hidden border border-[#E3DFE5]">
            <div
              className="bg-[#1E8E5A] h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${payProgress}%` }}
            />
          </div>
          <div className="text-right text-[11px] font-semibold text-[#1E8E5A] flex items-center justify-end gap-1">
            {payProgress === 100 && <CheckCircle2 className="w-3.5 h-3.5" />}
            {payProgress === 100 ? 'Paid in Full' : 'Partial Payment (50%)'}
          </div>
        </div>
      </SpotlightCard>

      {/* Tile 5: Customer Portal with Cycling Badge */}
      <SpotlightCard className="p-6 group">
        <div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF9FA] text-[#2B6CB0] border border-[#E3DFE5] flex items-center justify-center mb-4">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1F1A21] mb-1">
            Self-Serve Portal
          </h3>
          <p className="text-[14px] text-[#6D6572] leading-relaxed">
            Customers view active contracts, download printable invoices, and monitor billing directly.
          </p>
        </div>

        {/* Visual: Status Badge Cycling */}
        <div className="mt-8 pt-4 border-t border-[#E3DFE5]/80 flex flex-col items-center justify-center h-28 space-y-2">
          <div className="text-[11px] text-[#6D6572]">Live Subscription State:</div>
          <div className="transition-all duration-300 transform scale-105">
            {badgeState === 'draft' && (
              <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F6F5F7] text-[#6D6572] border border-[#E3DFE5]">
                Draft Quotation
              </span>
            )}
            {badgeState === 'active' && (
              <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#EDFDF5] text-[#1E8E5A] border border-[#C6F6D5]">
                Active Subscription
              </span>
            )}
            {badgeState === 'paid' && (
              <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#EBF8FF] text-[#2B6CB0] border border-[#BEE3F8]">
                Billed & Paid
              </span>
            )}
          </div>
        </div>
      </SpotlightCard>

      {/* Tile 6: Revenue Analytics with Growing Bars */}
      <SpotlightCard className="p-6 group">
        <div>
          <div className="w-10 h-10 rounded-xl bg-[#F1EAF1] text-[#6B4A6B] flex items-center justify-center mb-4">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#1F1A21] mb-1">
            Real-Time Analytics
          </h3>
          <p className="text-[14px] text-[#6D6572] leading-relaxed">
            Aggregate MRR, overdue exposure, and revenue by month via SSE live updates without reload.
          </p>
        </div>

        {/* Visual: Growing Bars with MRR Stat */}
        <div className="mt-8 pt-4 border-t border-[#E3DFE5]/80 flex items-end justify-between h-28 px-4 pb-2">
          <div className="flex items-center gap-1.5 h-16 items-end">
            <div className="w-4 bg-[#6B4A6B]/20 rounded-t h-8 group-hover:h-10 transition-all duration-300" />
            <div className="w-4 bg-[#6B4A6B]/40 rounded-t h-10 group-hover:h-12 transition-all duration-300" />
            <div className="w-4 bg-[#6B4A6B]/60 rounded-t h-12 group-hover:h-14 transition-all duration-300" />
            <div className="w-4 bg-[#6B4A6B] rounded-t h-14 group-hover:h-16 transition-all duration-300" />
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#6D6572] font-medium">Monthly Run Rate</div>
            <div className="text-[20px] font-bold font-mono text-[#6B4A6B] flex items-center justify-end gap-1">
              <CountUp to={28400} prefix="$" durationMs={1500} />
              <ArrowUpRight className="w-4 h-4 text-[#1E8E5A]" />
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};

