import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1F1A21]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-lg border border-[#E3DFE5] shadow-[0_4px_12px_rgba(0,0,0,0.08)] w-full overflow-hidden ${maxWidthClasses[maxWidth]}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-[#E3DFE5] flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-semibold text-[#1F1A21]">{title}</h3>
            {description && (
              <p className="text-[12px] text-[#6D6572] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#6D6572] hover:text-[#1F1A21] p-1.5 rounded hover:bg-[#F6F5F7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-160px)] overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-[#E3DFE5] bg-[#F6F5F7] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

