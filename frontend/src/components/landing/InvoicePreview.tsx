import React, { useState, useEffect, useRef } from 'react';
import { Receipt, CheckCircle, ShieldCheck } from 'lucide-react';

export const InvoicePreview: React.FC = () => {
  const [isPaid, setIsPaid] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Fill progress bar then pop PAID stamp
          setTimeout(() => setProgressWidth(100), 200);
          setTimeout(() => setIsPaid(true), 600);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

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
      className="relative w-full max-w-md mx-auto bg-white rounded-2xl border border-[#E3DFE5] p-6 shadow-lg shadow-[#6B4A6B]/5 space-y-5 overflow-hidden"
    >
      {/* Rubber Stamp: PAID */}
      <div
        className={`absolute top-12 right-6 pointer-events-none border-4 border-[#1E8E5A] text-[#1E8E5A] font-black uppercase text-[22px] tracking-widest px-3 py-1 rounded-lg transform -rotate-12 transition-all duration-500 ease-out z-10 ${
          isPaid ? 'scale-100 opacity-90' : 'scale-150 opacity-0'
        }`}
        style={{
          boxShadow: '0 0 0 2px rgba(30,142,90,0.2)',
          textShadow: '0 1px 2px rgba(30,142,90,0.15)',
        }}
      >
        PAID
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E3DFE5]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FAF9FA] border border-[#E3DFE5] text-[#6B4A6B] flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-[#1F1A21]">Invoice #INV-2026-042</h4>
            <p className="text-[11px] text-[#6D6572]">Customer: Starlight Studio</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#6D6572]">Oct 28, 2026</span>
      </div>

      {/* Line Items Table */}
      <div className="space-y-2 text-[12px]">
        <div className="flex justify-between items-center text-[#6D6572] pb-1 border-b border-[#E3DFE5]/60 text-[11px] uppercase font-semibold">
          <span>Description</span>
          <span>Amount</span>
        </div>
        <div className="flex justify-between items-center text-[#1F1A21]">
          <span>Dedicated Support Plan (x1)</span>
          <span className="font-mono tabular-nums">$350.00</span>
        </div>
        <div className="flex justify-between items-center text-[#1F1A21]">
          <span>API Gateway Seats (x5)</span>
          <span className="font-mono tabular-nums">$125.00</span>
        </div>
        <div className="flex justify-between items-center text-[#6D6572] pt-1">
          <span>Tax (State Sales Tax 8.25%)</span>
          <span className="font-mono tabular-nums">$39.19</span>
        </div>
        <div className="flex justify-between items-center font-bold text-[14px] text-[#1F1A21] pt-2 border-t border-[#E3DFE5]">
          <span>Total Invoiced</span>
          <span className="font-mono text-[#6B4A6B] tabular-nums">$514.19</span>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-[#6D6572] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1E8E5A]" />
            Payment Status
          </span>
          <span className="font-semibold text-[#1E8E5A]">
            {progressWidth === 100 ? '$514.19 Paid (100%)' : 'Processing...'}
          </span>
        </div>

        <div className="w-full bg-[#F6F5F7] h-2.5 rounded-full overflow-hidden border border-[#E3DFE5]/80">
          <div
            className="bg-[#1E8E5A] h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-[#6D6572] bg-[#FAF9FA] p-2 rounded-md border border-[#E3DFE5] flex items-center justify-between">
        <span>Payment Method: Credit Card ending in 4242</span>
        <CheckCircle className="w-3.5 h-3.5 text-[#1E8E5A]" />
      </div>
    </div>
  );
};

