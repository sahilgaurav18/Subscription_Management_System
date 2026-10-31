import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  isNumeric?: boolean;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string | number);
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const getRowKey = (row: T, idx: number): string | number => {
    if (typeof keyField === 'function') return keyField(row);
    return row[keyField] ?? idx;
  };

  return (
    <div className={`w-full overflow-x-auto border border-[#E3DFE5] rounded-md bg-white ${className}`}>
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-[#F6F5F7] border-b border-[#E3DFE5]">
            {columns.map((col) => {
              const alignClass =
                col.align === 'right' || col.isNumeric
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';

              return (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 py-3 text-[12px] font-medium text-[#6D6572] ${alignClass} select-none`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E3DFE5] text-[13px] leading-[1.5] text-[#1F1A21]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-[#6D6572]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#6B4A6B] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[13px]">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-[#6D6572]">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-[14px] font-medium text-[#1F1A21]">No Data Available</span>
                  <span className="text-[13px] text-[#6D6572]">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const isClickable = Boolean(onRowClick);
              return (
                <tr
                  key={getRowKey(row, idx)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors duration-100 ${
                    isClickable ? 'cursor-pointer hover:bg-[#F6F5F7]' : 'hover:bg-[#F6F5F7]/60'
                  }`}
                >
                  {columns.map((col) => {
                    const isRight = col.align === 'right' || col.isNumeric;
                    const alignClass = isRight
                      ? 'text-right tabular-nums font-mono'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                    return (
                      <td key={col.key} className={`px-4 py-3 ${alignClass}`}>
                        {col.render ? col.render(row, idx) : row[col.key] ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

