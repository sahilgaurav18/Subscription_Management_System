import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  onClose,
}) => {
  const iconConfig = {
    success: <CheckCircle2 className="w-4 h-4 text-[#1E8E5A] shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#2B6CB0] shrink-0" />,
  };

  const borderConfig = {
    success: 'border-[#1E8E5A]/30',
    error: 'border-[#C0392B]/30',
    info: 'border-[#2B6CB0]/30',
  };

  return (
    <div
      className={`pointer-events-auto p-3.5 bg-white rounded-lg border ${borderConfig[type]} shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-start gap-3 transition-all duration-150`}
      role="alert"
    >
      <div className="mt-0.5">{iconConfig[type]}</div>
      <div className="flex-1 text-[13px] font-medium text-[#1F1A21] leading-snug">
        {message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-[#6D6572] hover:text-[#1F1A21] p-0.5 rounded transition-colors"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

