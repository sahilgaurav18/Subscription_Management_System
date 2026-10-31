import React from 'react';
import type { ModuleTileData } from '../../data/landingDemoData';

interface Props {
  module: ModuleTileData;
  index: number;
}

export const ModuleTile: React.FC<Props> = ({ module, index }) => {
  const getIcon = () => {
    switch (module.id) {
      case 'plans':
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="20" height="18" rx="4" fill="#F1EAF1" stroke="#6B4A6B" strokeWidth="2" />
            <rect x="8" y="4" width="20" height="18" rx="4" fill="#FFFFFF" stroke="#6B4A6B" strokeWidth="2" />
            <path d="M12 11H22" stroke="#6B4A6B" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 15H18" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'subscriptions':
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="11" fill="#EDFDF5" stroke="#12C2A5" strokeWidth="2" />
            <path d="M12 16L15 19L21 13" stroke="#12C2A5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 7L24 10" stroke="#6B4A6B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'invoices':
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 5C7 3.9 7.9 3 9 3H21L25 7V27C25 28.1 24.1 29 23 29H9C7.9 29 7 28.1 7 27V5Z" fill="#FFFBEB" stroke="#F5A623" strokeWidth="2" />
            <path d="M11 11H19" stroke="#6B4A6B" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 16H21" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 21H16" stroke="#6B4A6B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'payments':
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="7" width="24" height="18" rx="4" fill="#FEF2F2" stroke="#F26B6B" strokeWidth="2" />
            <path d="M4 12H28" stroke="#F26B6B" strokeWidth="2" />
            <circle cx="10" cy="18" r="2" fill="#6B4A6B" />
            <path d="M16 18H22" stroke="#6B4A6B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'taxes':
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="22" height="22" rx="5" fill="#EBF8FF" stroke="#2BB3F3" strokeWidth="2" />
            <path d="M11 21L21 11" stroke="#2BB3F3" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="#6B4A6B" />
            <circle cx="20" cy="20" r="2" fill="#6B4A6B" />
          </svg>
        );
      case 'reports':
      default:
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="24" height="24" rx="4" fill="#F1EAF1" stroke="#6B4A6B" strokeWidth="2" />
            <path d="M9 22V16" stroke="#6B4A6B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 22V11" stroke="#12C2A5" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23 22V7" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  const borderHoverColors = {
    plum: 'hover:border-[#6B4A6B]',
    amber: 'hover:border-[#F5A623]',
    teal: 'hover:border-[#12C2A5]',
    coral: 'hover:border-[#F26B6B]',
    sky: 'hover:border-[#2BB3F3]',
  };

  return (
    <div
      className="relative group cursor-pointer"
      style={{
        animationDelay: `${index * 120}ms`,
      }}
    >
      {/* Floating Bob Card */}
      <div
        className={`bg-white rounded-2xl border border-[#E3DFE5] p-4 sm:p-5 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 animate-bob ${
          borderHoverColors[module.accent]
        }`}
        style={{
          animationDelay: `${index * 400}ms`,
        }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3">
          {getIcon()}
        </div>

        <h4 className="text-[14px] font-semibold text-[#1F1A21] tracking-tight">
          {module.title}
        </h4>
        <span className="text-[11px] font-medium text-[#6D6572] mt-0.5">
          {module.category}
        </span>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1F1A21] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-30 text-center leading-snug">
        {module.tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1F1A21]" />
      </div>
    </div>
  );
};

