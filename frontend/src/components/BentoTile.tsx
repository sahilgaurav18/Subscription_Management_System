import React from 'react';

export interface BentoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  title?: string;
  label?: string;
  value?: string | number | React.ReactNode;
  subvalue?: string | React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  noPadding?: boolean;
}

export const BentoTile: React.FC<BentoTileProps> = ({
  colSpan = 1,
  rowSpan = 1,
  title,
  label,
  value,
  subvalue,
  icon,
  badge,
  noPadding = false,
  children,
  className = '',
  ...props
}) => {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2 lg:col-span-2',
    3: 'col-span-1 md:col-span-2 lg:col-span-3',
    4: 'col-span-1 md:col-span-2 lg:col-span-4',
  };

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-1 lg:row-span-2',
  };

  return (
    <div
      className={`bento-tile flex flex-col justify-between ${colSpanClasses[colSpan]} ${
        rowSpanClasses[rowSpan]
      } ${noPadding ? '!p-0' : 'p-6'} ${className}`}
      {...props}
    >
      {(label || icon || badge || title) && (
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            {label && (
              <span className="text-[12px] font-medium text-[#6D6572] uppercase tracking-wider block">
                {label}
              </span>
            )}
            {title && (
              <h3 className="text-[18px] font-semibold text-[#1F1A21] tracking-tight mt-0.5">
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-[#F1EAF1] flex items-center justify-center text-[#6B4A6B] shrink-0">
                {icon}
              </div>
            )}
          </div>
        </div>
      )}

      {value !== undefined && (
        <div className="my-auto py-1">
          <div className="text-[32px] font-semibold text-[#1F1A21] tabular-nums tracking-tight">
            {value}
          </div>
          {subvalue && (
            <div className="text-[12px] text-[#6D6572] mt-1">{subvalue}</div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

