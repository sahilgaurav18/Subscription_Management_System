import React, { useState, useEffect } from 'react';
import { LIFECYCLE_STEPS } from '../../data/landingDemoData';
import { DoodleArrowAmber } from './DoodleRays';
import { Check, ChevronRight, FileText, ArrowRight } from 'lucide-react';

export const LifecycleStory: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Auto-advance stages every 4 seconds if untouched
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % LIFECYCLE_STEPS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const currentStep = LIFECYCLE_STEPS[activeStageIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Horizontal Stepper (Desktop) */}
      <div className="hidden md:block relative mb-12">
        {/* Track Line */}
        <div className="absolute top-5 left-10 right-10 h-1 bg-[#E3DFE5] -z-0">
          <div
            className="h-full bg-[#6B4A6B] transition-all duration-500 ease-out"
            style={{ width: `${(activeStageIndex / (LIFECYCLE_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-between relative z-10">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = activeStageIndex > idx;
            const isCurrent = activeStageIndex === idx;

            return (
              <button
                key={step.stage}
                type="button"
                onClick={() => setActiveStageIndex(idx)}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] transition-all duration-300 border-2 ${
                    isCurrent
                      ? 'bg-[#6B4A6B] text-white border-[#6B4A6B] scale-110 shadow-md'
                      : isCompleted
                      ? 'bg-[#6B4A6B] text-white border-[#6B4A6B]'
                      : 'bg-white text-[#6D6572] border-[#E3DFE5] group-hover:border-[#6B4A6B]'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>

                <span
                  className={`text-[13px] font-semibold mt-2 transition-colors ${
                    isCurrent ? 'text-[#6B4A6B]' : 'text-[#6D6572]'
                  }`}
                >
                  {step.badgeText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Animated Card Representation */}
      <div className="relative max-w-2xl mx-auto bg-white rounded-3xl border border-[#E3DFE5] p-6 sm:p-8 shadow-xl shadow-[#6B4A6B]/8 space-y-6">
        {/* Doodle Arrow pointing at active stage on desktop */}
        <div className="hidden md:flex items-center gap-1.5 absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="font-caveat font-bold text-[20px] text-[#F5A623]">
            current stage
          </span>
          <DoodleArrowAmber className="w-6 h-6 rotate-90" />
        </div>

        {/* Card Header with Moving Status Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E3DFE5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF9FA] border border-[#E3DFE5] flex items-center justify-center text-[#6B4A6B]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[16px] text-[#1F1A21]">
                  SUB-2026-0042
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold border transition-all duration-500 ${currentStep.badgeClass}`}
                >
                  {currentStep.badgeText}
                </span>
              </div>
              <span className="text-[12px] text-[#6D6572]">Customer: Starlight Studio</span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono font-bold text-[18px] text-[#1F1A21]">$199.00 / mo</div>
            <span className="text-[11px] text-[#1E8E5A] font-semibold">Pro Plan (Auto-Renew)</span>
          </div>
        </div>

        {/* Caption & Explanation */}
        <div className="p-4 rounded-2xl bg-[#FAF9FA] border border-[#E3DFE5] space-y-2 animate-fade-up">
          <div className="flex items-center gap-2 text-[#6B4A6B] font-bold text-[14px]">
            <ArrowRight className="w-4 h-4" />
            <span>{currentStep.caption}</span>
          </div>
          <p className="text-[13px] text-[#6D6572] leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Step Progression Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[12px] text-[#6D6572]">
            Stage {activeStageIndex + 1} of {LIFECYCLE_STEPS.length}
          </div>

          <div className="flex items-center gap-2">
            {activeStageIndex > 0 && (
              <button
                type="button"
                onClick={() => setActiveStageIndex((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#E3DFE5] text-[#1F1A21] hover:bg-[#FAF9FA]"
              >
                Previous
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveStageIndex((p) => (p + 1) % LIFECYCLE_STEPS.length)}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-[#6B4A6B] text-white hover:bg-[#593B59] shadow-xs"
            >
              <span>{activeStageIndex === LIFECYCLE_STEPS.length - 1 ? 'Start over' : 'Next stage'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Vertical Timeline (fallback on < 768px) */}
      <div className="md:hidden mt-8 space-y-3">
        {LIFECYCLE_STEPS.map((step, idx) => (
          <div
            key={step.stage}
            onClick={() => setActiveStageIndex(idx)}
            className={`p-3 rounded-xl border transition-all ${
              activeStageIndex === idx
                ? 'bg-white border-[#6B4A6B] shadow-sm'
                : 'bg-[#FAF9FA] border-[#E3DFE5] opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[13px] text-[#1F1A21]">{step.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${step.badgeClass}`}>
                {step.badgeText}
              </span>
            </div>
            <p className="text-[12px] text-[#6D6572] mt-1">{step.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
