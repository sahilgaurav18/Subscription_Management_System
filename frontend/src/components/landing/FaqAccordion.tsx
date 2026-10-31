import React, { useState } from 'react';
import { FAQ_ITEMS, type FaqItem } from '../../data/landingDemoData';

export const FaqAccordion: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id || null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1EAF1] text-[#6B4A6B] border border-[#E3DFE5] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#6B4A6B]"></span>
          Questions & Answers
        </div>
        <h2 className="font-caveat font-bold text-[38px] sm:text-[48px] text-[#1F1A21] leading-tight">
          Frequently asked questions
        </h2>
        <p className="text-[16px] sm:text-[17px] text-[#6D6572] max-w-xl mx-auto mt-2">
          Everything you need to know about billing precision, concurrency locks, data privacy, and lifecycle automation.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3.5">
        {FAQ_ITEMS.map((item: FaqItem) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-white border-[#6B4A6B]/40 shadow-sm'
                  : 'bg-[#FAF9FA] hover:bg-white border-[#E3DFE5]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                className="w-full px-5 sm:px-6 py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6B4A6B]/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F1EAF1] text-[#6B4A6B] shrink-0">
                    {item.category}
                  </span>
                  <span className="font-semibold text-sm sm:text-base text-[#1F1A21]">
                    {item.question}
                  </span>
                </div>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-200 ${
                    isOpen
                      ? 'bg-[#6B4A6B] text-white border-[#6B4A6B] rotate-180'
                      : 'bg-white text-[#6D6572] border-[#E3DFE5]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 pt-1 text-sm sm:text-[15px] text-[#6D6572] leading-relaxed border-t border-[#E3DFE5]/60 bg-white">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
