import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, Receipt, DollarSign } from 'lucide-react';

interface Step {
  title: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: 'Quote',
    label: '01',
    desc: 'Build custom line-item quotations from templates with automated customer and product pricing.',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: 'Subscribe',
    label: '02',
    desc: 'Activate quotes into governed subscriptions with pause, renewal, and auto-close policies.',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    title: 'Invoice',
    label: '03',
    desc: 'Automated nightly billing runs calculate exact taxes, apply promo discounts, and generate locked invoices.',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    title: 'Get Paid',
    label: '04',
    desc: 'Record partial or full payments, prevent overpayments, and grant instant customer portal access.',
    icon: <DollarSign className="w-5 h-5" />,
  },
];

export const LandingStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Progressively activate steps
          const timer1 = setTimeout(() => setActiveStep(2), 400);
          const timer2 = setTimeout(() => setActiveStep(3), 800);
          const timer3 = setTimeout(() => setActiveStep(4), 1200);

          return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
          };
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative max-w-5xl mx-auto px-4 py-8">
      {/* Background Connecting Line (Desktop) */}
      <div className="hidden md:block absolute top-[68px] left-[10%] right-[10%] h-[3px] bg-[#E3DFE5] -z-0">
        <div
          className="h-full bg-[#6B4A6B] transition-all duration-700 ease-out"
          style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
        {STEPS.map((step, idx) => {
          const stepNumber = idx + 1;
          const isPassedOrActive = activeStep >= stepNumber;

          return (
            <div
              key={step.title}
              className="flex flex-col items-center text-center group cursor-pointer"
              onClick={() => setActiveStep(stepNumber)}
            >
              {/* Step Circle */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-[16px] transition-all duration-500 ease-out border-2 shadow-xs ${
                  isPassedOrActive
                    ? 'bg-[#6B4A6B] text-white border-[#6B4A6B] scale-105'
                    : 'bg-white text-[#6D6572] border-[#E3DFE5] hover:border-[#6B4A6B]/50'
                }`}
              >
                {step.icon}
              </div>

              {/* Step Title in Caveat */}
              <h3 className="font-caveat font-bold text-[28px] text-[#1F1A21] mt-4 leading-tight">
                {step.title}
              </h3>

              {/* Step Description in Inter */}
              <p className="text-[14px] text-[#6D6572] mt-1.5 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

