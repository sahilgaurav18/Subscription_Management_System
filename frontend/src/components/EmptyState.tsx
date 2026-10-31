import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No items found',
  description = 'There are no records matching your criteria.',
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-lg border border-dashed border-[#E3DFE5] space-y-3 my-4 ${className}`}>
      <div className="p-3 bg-[#F6F5F7] rounded-full border border-[#E3DFE5] text-[#6D6572]">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold text-[#1F1A21]">{title}</h3>
        <p className="text-[13px] text-[#6D6572] max-w-sm">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

