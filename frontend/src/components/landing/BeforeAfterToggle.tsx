import React, { useState } from 'react';
import { PAIN_FIX_ITEMS } from '../../data/landingDemoData';
import { Sparkles, AlertTriangle, CheckCircle2, FileSpreadsheet, ArrowRight } from 'lucide-react';

export const BeforeAfterToggle: React.FC = () => {
  const [isBrightloop, setIsBrightloop] = useState(true);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Centered Pill Toggle with Doodle Spark */}
      <div className="flex flex-col items-center justify-center mb-10">
        <div className="relative inline-flex items-center p-1.5 bg-[#FAF9FA] border border-[#E3DFE5] rounded-full shadow-xs">
          <button
            type="button"
            onClick={() => setIsBrightloop(false)}
            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 ${
              !isBrightloop
                ? 'bg-[#C0392B] text-white shadow-xs'
                : 'text-[#6D6572] hover:text-[#1F1A21]'
            }`}
          >
            Messy Spreadsheets (Before)
          </button>

          <button
            type="button"
            onClick={() => setIsBrightloop(true)}
            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 flex items-center gap-1.5 ${
              isBrightloop
                ? 'bg-[#6B4A6B] text-white shadow-xs'
                : 'text-[#6D6572] hover:text-[#1F1A21]'
            }`}
          >
            <span>Brightloop SaaS (After)</span>
            <Sparkles className="w-3.5 h-3.5 text-[#F5A623] animate-spin" />
          </button>
        </div>
        <span className="text-[11px] text-[#6D6572] mt-2 font-medium">
          Toggle between manual spreadsheet headaches and automated governance
        </span>
      </div>

      {/* Main Container: Preview Card + Pain/Fix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Visual Card (7 cols) */}
        <div className="lg:col-span-7 relative min-h-[380px] bg-white rounded-3xl border border-[#E3DFE5] p-6 shadow-xl shadow-[#6B4A6B]/5 overflow-hidden flex flex-col justify-between">
          {!isBrightloop ? (
            /* OFF: Messy Spreadsheets View */
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3DFE5]">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#C0392B]" />
                  <span className="text-[14px] font-mono font-bold text-[#C0392B]">
                    q4_final_final_v3.xlsx (Conflicted Copy)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA]">
                  Formula Errors
                </span>
              </div>

              {/* Scattered Messy Cells */}
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#C0392B] relative">
                  <div>C12: #REF!</div>
                  <div className="text-[9px] mt-1 text-[#C0392B]">Starlight Qty Missing</div>
                </div>

                <div className="p-2 bg-[#FFFBEB] border border-[#FEEBC8] rounded text-[#B7791F]">
                  <div>D14: $49.00 (?)</div>
                  <div className="text-[9px] mt-1">Was price updated?</div>
                </div>

                <div className="p-2 bg-[#FAF9FA] border border-[#E3DFE5] rounded text-[#6D6572]">
                  <div>E15: $99.00</div>
                  <div className="text-[9px] mt-1">Acme Corp</div>
                </div>
              </div>

              {/* Sticky Note Mock */}
              <div className="bg-[#FFF9C4] border border-[#FFF59D] p-3 rounded-lg shadow-sm text-[12px] text-[#827717] rotate-[-2deg] max-w-sm">
                <strong>⚠️ Urgently check:</strong> Did we remember to bill Apex Logistics for October? I think their contract ended last week!
              </div>

              {/* Red Bubble: Wrong Total & Missed Renewal */}
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] p-2.5 rounded-xl text-[12px] text-[#C0392B]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Missed Renewal:</strong> Vertex AI cluster went unbilled for 2 months ($500.00 lost revenue).
                </span>
              </div>
            </div>
          ) : (
            /* ON: Clean Brightloop View */
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3DFE5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#6B4A6B] flex items-center justify-center text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[#1F1A21]">
                    Brightloop Live Governance
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDFDF5] text-[#1E8E5A] border border-[#C6F6D5]">
                  100% In Sync
                </span>
              </div>

              {/* Tidy Table Rows */}
              <div className="space-y-2 text-[12px]">
                <div className="p-2.5 bg-[#FAF9FA] rounded-xl border border-[#E3DFE5] flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-[#1F1A21]">
                    <span className="w-2 h-2 rounded-full bg-[#1E8E5A]" />
                    <span>Acme Cloud Corp</span>
                    <span className="text-[11px] text-[#6D6572]">• Enterprise Annual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">$490.00</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDFDF5] text-[#1E8E5A]">Paid</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#FAF9FA] rounded-xl border border-[#E3DFE5] flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-[#1F1A21]">
                    <span className="w-2 h-2 rounded-full bg-[#1E8E5A]" />
                    <span>Starlight Studio</span>
                    <span className="text-[11px] text-[#6D6572]">• Pro Monthly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">$99.00</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDFDF5] text-[#1E8E5A]">Paid</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#FAF9FA] rounded-xl border border-[#E3DFE5] flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-[#1F1A21]">
                    <span className="w-2 h-2 rounded-full bg-[#1E8E5A]" />
                    <span>Vertex AI Systems</span>
                    <span className="text-[11px] text-[#6D6572]">• Dedicated Cluster</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">$250.00</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDFDF5] text-[#1E8E5A]">Auto-Billed</span>
                  </div>
                </div>
              </div>

              {/* Status Guarantee Callout */}
              <div className="p-3 bg-[#F1EAF1] border border-[#E1D4E1] rounded-xl text-[12px] text-[#6B4A6B] flex items-center justify-between">
                <span>Deterministic nightly catch-up running active audit logs</span>
                <span className="font-bold">Zero Duplicates</span>
              </div>
            </div>
          )}

          <div className="text-[11px] text-[#6D6572] pt-4 border-t border-[#E3DFE5] flex justify-between items-center">
            <span>State: {isBrightloop ? 'Brightloop Continuous Automation' : 'Manual File Sync'}</span>
            <span className="font-medium text-[#1F1A21]">
              {isBrightloop ? 'Database Locked Records' : 'Local Disk Versioning'}
            </span>
          </div>
        </div>

        {/* 4 Pain vs Fix Comparison Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <h3 className="font-caveat font-bold text-[32px] text-[#1F1A21] leading-tight mb-2">
            Imagine billing without spreadsheets
          </h3>
          <p className="text-[14px] text-[#6D6572] mb-4">
            Four key reasons scaling companies migrate their subscription operations to Brightloop:
          </p>

          {PAIN_FIX_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-2xl border border-[#E3DFE5] shadow-xs space-y-1.5"
            >
              <div className="flex items-center gap-2 text-[12px] text-[#C0392B] line-through font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B]" />
                <span>{item.pain}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[#1E8E5A] font-semibold">
                <ArrowRight className="w-3.5 h-3.5 text-[#1E8E5A] shrink-0" />
                <span>{item.fix}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

