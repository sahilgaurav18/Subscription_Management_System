import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
}

export const Pagination: React.FC<Props> = ({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border-t border-[#E3DFE5] text-[13px] text-[#6D6572]">
      <div className="flex items-center gap-2">
        <span>
          Showing <span className="font-semibold text-[#1F1A21] tabular-nums">{startItem}</span> to{' '}
          <span className="font-semibold text-[#1F1A21] tabular-nums">{endItem}</span> of{' '}
          <span className="font-semibold text-[#1F1A21] tabular-nums">{total}</span> entries
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-3 px-2.5 min-h-[36px] text-[12px] border border-[#E3DFE5] rounded-md bg-white text-[#1F1A21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 border border-[#E3DFE5] rounded-md hover:bg-[#F6F5F7] text-[#1F1A21] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-medium text-[#1F1A21] tabular-nums text-[13px]">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 border border-[#E3DFE5] rounded-md hover:bg-[#F6F5F7] text-[#1F1A21] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
