import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse bg-[#E3DFE5]/60 ${width} ${height} ${rounded} ${className}`}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full divide-y divide-[#E3DFE5]">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div key={cIdx} className="flex-1">
              <Skeleton height="h-3.5" width={cIdx === 0 ? 'w-3/4' : 'w-1/2'} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ height?: string }> = ({ height = 'h-40' }) => {
  return (
    <div className={`p-6 bg-white border border-[#E3DFE5] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4 ${height}`}>
      <Skeleton width="w-1/3" height="h-4" />
      <Skeleton width="w-2/3" height="h-3" />
      <Skeleton width="w-1/2" height="h-3" />
    </div>
  );
};

