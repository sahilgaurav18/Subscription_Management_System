import React from 'react';
import { Check } from 'lucide-react';

export interface StepperProps {
  currentStatus: string;
  steps?: string[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStatus,
  steps = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'],
  className = '',
}) => {
  const normalizedCurrent = (currentStatus || '').toLowerCase().trim();

  // Find step index
  let currentIndex = steps.findIndex((s) => s.toLowerCase() === normalizedCurrent);
  if (currentIndex === -1) {
    if (normalizedCurrent === 'paused') {
      currentIndex = 3; // Paused is active phase
    } else if (normalizedCurrent === 'renewed') {
      currentIndex = 3;
    } else if (normalizedCurrent === 'cancelled') {
      currentIndex = steps.length - 1;
    } else {
      currentIndex = 0;
    }
  }

  return (
    <div className={`w-full overflow-x-auto py-2 ${className}`}>
      <div className="flex items-center min-w-[500px]">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={step}>
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-[#1E8E5A] text-white'
                      : isCurrent
                      ? 'bg-[#6B4A6B] text-white ring-2 ring-[#6B4A6B]/30'
                      : 'bg-[#F1EFF2] text-[#6D6572] border border-[#E3DFE5]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
                </div>
                <span
                  className={`text-[12px] font-medium select-none ${
                    isCurrent
                      ? 'text-[#1F1A21] font-semibold'
                      : isCompleted
                      ? 'text-[#1E8E5A]'
                      : 'text-[#6D6572]'
                  }`}
                >
                  {step}
                </span>
              </div>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-3 transition-colors ${
                    idx < currentIndex ? 'bg-[#1E8E5A]' : 'bg-[#E3DFE5]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
