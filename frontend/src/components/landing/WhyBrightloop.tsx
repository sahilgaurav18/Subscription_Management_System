import React, { useState, useEffect } from 'react';
import { SpotlightCard } from './SpotlightCard';
import {
  ShieldCheck,
  RotateCw,
  Users,
  UserCheck,
  Percent,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const WhyBrightloop: React.FC = () => {
  const [speedMeter, setSpeedMeter] = useState(1.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeedMeter((prev) => (prev === 1.4 ? 0.9 : 1.4));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: No double billing */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F1EAF1] text-[#6B4A6B] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EDFDF5] text-[#1E8E5A]">
                Constraint Enforced
              </span>
            </div>
            <h4 className="text-[17px] font-bold text-[#1F1A21] mb-1">
              No Double Billing
            </h4>
            <p className="text-[14px] text-[#6D6572] leading-relaxed">
              Unique database index on subscription ID and period bounds prevents duplicate invoice creation regardless of job frequency.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DFE5]/80 flex items-center justify-between text-[12px] bg-[#FAF9FA] p-2.5 rounded-xl border border-[#E3DFE5]">
            <span className="font-mono text-[#6B4A6B] font-semibold">uq_sub_period_idx</span>
            <span className="text-[#1E8E5A] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              1 Invoice / Period
            </span>
          </div>
        </SpotlightCard>

        {/* Card 2: No skipped renewals */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EDFDF5] text-[#12C2A5] flex items-center justify-center">
                <RotateCw className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EDFDF5] text-[#12C2A5]">
                Auto Catch-Up
              </span>
            </div>
            <h4 className="text-[17px] font-bold text-[#1F1A21] mb-1">
              No Skipped Renewals
            </h4>
            <p className="text-[14px] text-[#6D6572] leading-relaxed">
              If worker jobs or workers ever go offline, the catch-up mechanism bills all pending missed periods sequentially upon restart.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DFE5]/80 flex items-center justify-between text-[12px]">
            <span className="text-[#6D6572]">Automatic Catch-up:</span>
            <span className="font-bold text-[#12C2A5] bg-[#EDFDF5] px-2 py-0.5 rounded-full border border-[#C6F6D5]">
              Active & Monitored
            </span>
          </div>
        </SpotlightCard>

        {/* Card 3: Role-based access */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EBF8FF] text-[#2BB3F3] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EBF8FF] text-[#2BB3F3]">
                Server Guarded
              </span>
            </div>
            <h4 className="text-[17px] font-bold text-[#1F1A21] mb-1">
              Role-Based Access Control
            </h4>
            <p className="text-[14px] text-[#6D6572] leading-relaxed">
              Admin, Staff, and Customer users are verified server-side on every API request. Customers cannot view other customer data.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DFE5]/80 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#F1EAF1] text-[#6B4A6B]">Admin</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FAF9FA] text-[#1F1A21] border border-[#E3DFE5]">Staff</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#EDFDF5] text-[#1E8E5A]">Customer</span>
          </div>
        </SpotlightCard>

        {/* Card 4: Customer portal */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#F26B6B] flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FEF2F2] text-[#F26B6B]">
                24/7 Access
              </span>
            </div>
            <h4 className="text-[17px] font-bold text-[#1F1A21] mb-1">
              Customer Self-Service
            </h4>
            <p className="text-[14px] text-[#6D6572] leading-relaxed">
              Customers review their active contracts, inspect balance due in real time, and download verified PDF invoices without emailing support.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DFE5]/80 flex items-center justify-between text-[12px] bg-[#FAF9FA] p-2 rounded-lg border border-[#E3DFE5]">
            <span className="text-[#6D6572]">Verified Portal</span>
            <span className="text-[#1E8E5A] font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Token Authenticated
            </span>
          </div>
        </SpotlightCard>

        {/* Card 5: Automated Discounts & Taxes */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#F5A623] flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FFFBEB] text-[#F5A623]">
                Best Value Rule
              </span>
            </div>
            <h4 className="text-[17px] font-bold text-[#1F1A21] mb-1">
              Automatic Tax & Promo Logic
            </h4>
            <p className="text-[14px] text-[#6D6572] leading-relaxed">
              Rules select the best single discount, verify date/usage limits, and calculate exact rounding lines within the same transaction.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DFE5]/80 flex items-center justify-between text-[12px]">
            <span className="text-[#6D6572]">Rule Calculation:</span>
            <span className="font-mono font-bold text-[#F5A623]">Best Single Discount</span>
          </div>
        </SpotlightCard>

        {/* Card 6: Fast Pages */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F1EAF1] text-[#6B4A6B] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EDFDF5] text-[#1E8E5A]">
                EXPLAIN Verified
              </span>
            </div>
            <h4 className="text-[17px] font-bold text-[#1F1A21] mb-1">
              Fast Sub-2 Second Queries
            </h4>
            <p className="text-[14px] text-[#6D6572] leading-relaxed">
              Optimized indexes and pre-aggregated reporting queries confirm every main list and dashboard view responds in under 2 seconds.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DFE5]/80 flex items-center justify-between text-[12px] bg-[#FAF9FA] p-2.5 rounded-xl border border-[#E3DFE5]">
            <span className="text-[#6D6572]">Query Latency:</span>
            <span className="font-mono font-bold text-[#1E8E5A]">{speedMeter}s response</span>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};
