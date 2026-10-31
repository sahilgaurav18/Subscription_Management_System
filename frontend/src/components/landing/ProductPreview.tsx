import React, { useState, useEffect } from 'react';
import { Search, LayoutList, LayoutGrid, CheckCircle2, Clock } from 'lucide-react';

interface SubRow {
  number: string;
  customer: string;
  nextInvoice: string;
  plan: string;
  amount: string;
  initialStatus: 'draft' | 'active' | 'closed';
  animatesToActive?: boolean;
}

const DEMO_ROWS: SubRow[] = [
  {
    number: 'SUB-2026-081',
    customer: 'Acme Technologies Inc.',
    nextInvoice: 'Nov 15, 2026',
    plan: 'Enterprise Annual',
    amount: '$9,990.00',
    initialStatus: 'draft',
    animatesToActive: true,
  },
  {
    number: 'SUB-2026-079',
    customer: 'Apex Logistics LLC',
    nextInvoice: 'Nov 01, 2026',
    plan: 'Standard Monthly',
    amount: '$99.00',
    initialStatus: 'active',
  },
  {
    number: 'SUB-2026-074',
    customer: 'Horizon Creative Studio',
    nextInvoice: 'Nov 08, 2026',
    plan: 'Team Weekly',
    amount: '$29.00',
    initialStatus: 'active',
  },
  {
    number: 'SUB-2026-068',
    customer: 'Vertex Media Labs',
    nextInvoice: 'Expired',
    plan: 'Starter Daily',
    amount: '$4.90',
    initialStatus: 'closed',
  },
];

export const ProductPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'quotations' | 'closed'>('all');
  const [animatedStatus, setAnimatedStatus] = useState<'draft' | 'active'>('draft');

  useEffect(() => {
    // Delay 1.2s then flip draft -> active
    const timer = setTimeout(() => {
      setAnimatedStatus('active');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative mx-auto max-w-[1100px] w-full px-2 sm:px-4">
      {/* Curved light-grey arc background decoration */}
      <svg
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[1140px] h-[340px] -z-10 pointer-events-none opacity-60 hidden md:block"
        viewBox="0 0 1140 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20 280C220 80 920 80 1120 280"
          stroke="#E3DFE5"
          strokeWidth="2.5"
          strokeDasharray="8 8"
          strokeLinecap="round"
        />
        <circle cx="20" cy="280" r="4" fill="#6B4A6B" />
        <circle cx="1120" cy="280" r="4" fill="#F5A623" />
      </svg>

      {/* Main Preview Container */}
      <div className="bg-white rounded-2xl border border-[#E3DFE5] shadow-[0_20px_50px_-15px_rgba(107,74,107,0.12)] overflow-hidden transition-all duration-300">
        {/* Browser / Application Top Toolbar */}
        <div className="bg-[#FAF9FA] px-4 py-3 border-b border-[#E3DFE5] flex flex-wrap items-center justify-between gap-3">
          {/* Mock Window Dots + Module Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-3 h-3 rounded-full bg-[#F26B6B]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#F5A623]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#12C2A5]/80 inline-block" />
            </div>

            <div className="flex items-center gap-1 border-l border-[#E3DFE5] pl-3 text-[12px] font-medium text-[#6D6572]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-[#6B4A6B] font-semibold shadow-xs border border-[#E3DFE5]'
                    : 'hover:text-[#1F1A21]'
                }`}
              >
                All (24)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'active'
                    ? 'bg-white text-[#6B4A6B] font-semibold shadow-xs border border-[#E3DFE5]'
                    : 'hover:text-[#1F1A21]'
                }`}
              >
                Active (18)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quotations')}
                className={`hidden sm:inline-block px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'quotations'
                    ? 'bg-white text-[#6B4A6B] font-semibold shadow-xs border border-[#E3DFE5]'
                    : 'hover:text-[#1F1A21]'
                }`}
              >
                Quotations (4)
              </button>
            </div>
          </div>

          {/* Search box & View icons */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6D6572] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                readOnly
                value="Search subscriptions..."
                aria-label="Search preview"
                className="pl-8 pr-3 py-1 bg-white border border-[#E3DFE5] rounded-md text-[12px] text-[#6D6572] w-36 sm:w-48 cursor-default focus:outline-none"
              />
            </div>
            <div className="flex items-center border border-[#E3DFE5] rounded-md bg-white p-0.5" aria-hidden="true">
              <span className="p-1 rounded bg-[#F1EAF1] text-[#6B4A6B]">
                <LayoutList className="w-3.5 h-3.5" />
              </span>
              <span className="p-1 rounded text-[#6D6572] hover:text-[#1F1A21]">
                <LayoutGrid className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Live Mock Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#E3DFE5] bg-white text-[#6D6572] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 hidden sm:table-cell">Next Invoice</th>
                <th className="py-3 px-4 hidden md:table-cell">Plan</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFE5]/60 bg-white">
              {DEMO_ROWS.map((row, idx) => {
                const isAnimatedRow = row.animatesToActive;
                const currentStatus = isAnimatedRow ? animatedStatus : row.initialStatus;

                return (
                  <tr
                    key={row.number}
                    className="hover:bg-[#FAF9FA] transition-colors duration-150"
                    style={{
                      animationDelay: `${idx * 80}ms`,
                    }}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-[#6B4A6B]">
                      {row.number}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#1F1A21]">
                      {row.customer}
                    </td>
                    <td className="py-3 px-4 text-[#6D6572] hidden sm:table-cell">
                      {row.nextInvoice}
                    </td>
                    <td className="py-3 px-4 text-[#1F1A21] hidden md:table-cell">
                      {row.plan}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#1F1A21] tabular-nums font-semibold">
                      {row.amount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {currentStatus === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDFDF5] text-[#1E8E5A] border border-[#C6F6D5] transition-all duration-500 ease-out">
                          <CheckCircle2 className="w-3 h-3 text-[#1E8E5A]" />
                          Active
                        </span>
                      )}
                      {currentStatus === 'draft' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F6F5F7] text-[#6D6572] border border-[#E3DFE5] transition-all duration-500 ease-out">
                          <Clock className="w-3 h-3 text-[#6D6572]" />
                          Draft
                        </span>
                      )}
                      {currentStatus === 'closed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F6F5F7] text-[#6D6572] border border-[#E3DFE5]">
                          Closed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mock Summary Footer */}
        <div className="bg-[#FAF9FA] px-4 py-2.5 border-t border-[#E3DFE5] flex items-center justify-between text-[11px] text-[#6D6572]">
          <span>Showing 4 of 24 subscriptions</span>
          <span className="font-medium text-[#1F1A21]">Monthly Run Rate: $14,280.00</span>
        </div>
      </div>
    </div>
  );
};

