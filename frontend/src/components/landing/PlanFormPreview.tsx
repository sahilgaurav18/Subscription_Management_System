import React, { useState, useEffect, useRef } from 'react';
import { Layers, Check } from 'lucide-react';

export const PlanFormPreview: React.FC = () => {
  const [togglesOn, setTogglesOn] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Animate toggles on
          setTimeout(() => setTogglesOn(true), 350);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only tilt on desktop with fine pointers
    if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle tilt: max 6 degrees
    const rotateY = ((x - centerX) / centerX) * 5;
    const rotateX = -((y - centerY) / centerY) * 5;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 180ms ease-out',
      }}
      className="w-full max-w-md mx-auto bg-white rounded-2xl border border-[#E3DFE5] p-6 shadow-lg shadow-[#6B4A6B]/5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E3DFE5]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F1EAF1] text-[#6B4A6B] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-[#1F1A21]">Plan Configuration</h4>
            <p className="text-[11px] text-[#6D6572]">Admin rule definition</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EDFDF5] text-[#1E8E5A] border border-[#C6F6D5]">
          Active Plan
        </span>
      </div>

      {/* Plan Name & Period */}
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <label className="block text-[#6D6572] font-medium mb-1">Plan Name</label>
          <div className="p-2 rounded-md bg-[#FAF9FA] border border-[#E3DFE5] font-semibold text-[#1F1A21]">
            Pro Growth Tier
          </div>
        </div>
        <div>
          <label className="block text-[#6D6572] font-medium mb-1">Billing Period</label>
          <div className="p-2 rounded-md bg-[#FAF9FA] border border-[#E3DFE5] font-semibold text-[#6B4A6B]">
            Monthly
          </div>
        </div>
      </div>

      {/* Min Quantity */}
      <div className="text-[12px]">
        <label className="block text-[#6D6572] font-medium mb-1">Min. Commitment Quantity</label>
        <div className="p-2 rounded-md bg-[#FAF9FA] border border-[#E3DFE5] text-[#1F1A21] flex justify-between items-center">
          <span>1 seat minimum</span>
          <span className="text-[11px] text-[#6D6572]">Enforced on quote</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2 border-t border-[#E3DFE5]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D6572]">
          Lifecycle Governance
        </div>

        {/* Toggle 1: Auto-close */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-medium text-[#1F1A21]">Auto-close at expiry</div>
            <div className="text-[11px] text-[#6D6572]">Stops renewing without staff intervention</div>
          </div>
          <div
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-default ${
              togglesOn ? 'bg-[#6B4A6B]' : 'bg-[#E3DFE5]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-300 flex items-center justify-center ${
                togglesOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {togglesOn && <Check className="w-2.5 h-2.5 text-[#6B4A6B]" />}
            </div>
          </div>
        </div>

        {/* Toggle 2: Pausable */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-medium text-[#1F1A21]">Pausable subscriptions</div>
            <div className="text-[11px] text-[#6D6572]">Allow temporary holds on billing</div>
          </div>
          <div
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-default ${
              togglesOn ? 'bg-[#6B4A6B]' : 'bg-[#E3DFE5]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-300 flex items-center justify-center ${
                togglesOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {togglesOn && <Check className="w-2.5 h-2.5 text-[#6B4A6B]" />}
            </div>
          </div>
        </div>

        {/* Toggle 3: Renewable */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-medium text-[#1F1A21]">Renewable contract</div>
            <div className="text-[11px] text-[#6D6572]">Automatic period advancement</div>
          </div>
          <div
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-default ${
              togglesOn ? 'bg-[#6B4A6B]' : 'bg-[#E3DFE5]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-300 flex items-center justify-center ${
                togglesOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {togglesOn && <Check className="w-2.5 h-2.5 text-[#6B4A6B]" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

