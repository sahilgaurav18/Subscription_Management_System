import React from 'react';
import { Loader2, Inbox, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const LoadingState: React.FC<{ message?: string; minHeight?: string }> = ({
  message = 'Loading records...',
  minHeight = 'min-h-[220px]',
}) => (
  <div className={`flex flex-col items-center justify-center p-8 ${minHeight} space-y-3`}>
    <Loader2 className="w-6 h-6 text-[#6B4A6B] animate-spin" />
    <p className="text-[13px] font-medium text-[#6D6572]">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({
  title = 'No items found',
  description = 'There are no records matching your criteria.',
  actionLabel,
  onAction,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-lg border border-dashed border-[#E3DFE5] space-y-3 my-4">
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

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Failed to load content',
  message = 'An unexpected network or server error occurred while retrieving this data.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-[#FDF2F2] rounded-lg border border-[#F8D2D0] space-y-3 my-4">
    <div className="p-2.5 bg-white rounded-full border border-[#F8D2D0] text-[#C0392B]">
      <AlertCircle className="w-5 h-5" />
    </div>
    <div className="space-y-1">
      <h3 className="text-[14px] font-semibold text-[#C0392B]">{title}</h3>
      <p className="text-[13px] text-[#6D6572] max-w-md">{message}</p>
    </div>
    {onRetry && (
      <Button
        variant="secondary"
        onClick={onRetry}
        icon={<RefreshCw className="w-4 h-4" />}
        className="mt-2"
      >
        Try Again
      </Button>
    )}
  </div>
);
