import React, { useState, useEffect, useRef } from 'react';
import { TOUR_SLIDES, type TourSlide } from '../../data/landingDemoData';
import {
  Play,
  Pause,
  Layers,
  Receipt,
  CreditCard,
  BarChart3,
} from 'lucide-react';

export const ProductTour: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // In-view detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries[0].isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 6-second auto-advance timer with smooth scrub progress
  useEffect(() => {
    if (!isPlaying || isHovered || !inView) return;

    const intervalMs = 60; // tick every 60ms
    const totalDuration = 6000;
    const increment = (intervalMs / totalDuration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlideIndex((c) => (c + 1) % TOUR_SLIDES.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, inView, currentSlideIndex]);

  const goToSlide = (idx: number) => {
    setCurrentSlideIndex(idx);
    setProgress(0);
  };

  const currentSlide: TourSlide = TOUR_SLIDES[currentSlideIndex];

  // Render mock real UI for each slide
  const renderSlideContent = () => {
    switch (currentSlide.id) {
      case 'subscriptions':
        return (
          <div className="bg-[#FAF9FA] rounded-2xl border border-[#E3DFE5] p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3DFE5]">
              <span className="font-bold text-[13px] text-[#1F1A21] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6B4A6B]" />
                Active Subscription Lifecycle
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EDFDF5] text-[#1E8E5A]">
                SUB-2026-0042
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="bg-white p-2.5 rounded-lg border border-[#E3DFE5]">
                <div className="text-[#6D6572]">Customer</div>
                <div className="font-bold text-[#1F1A21]">Acme Technologies Inc.</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E3DFE5]">
                <div className="text-[#6D6572]">Contract Plan</div>
                <div className="font-bold text-[#6B4A6B]">Enterprise Annual ($9,990)</div>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#E3DFE5] flex items-center justify-between text-[12px]">
              <span>Next Renewal: Oct 15, 2027</span>
              <span className="font-bold text-[#1E8E5A]">Auto-Renew Active</span>
            </div>
          </div>
        );

      case 'invoices':
        return (
          <div className="bg-[#FAF9FA] rounded-2xl border border-[#E3DFE5] p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3DFE5]">
              <span className="font-bold text-[13px] text-[#1F1A21] flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#6B4A6B]" />
                Locked PDF Invoice Details
              </span>
              <span className="font-mono text-[12px] font-bold text-[#6B4A6B]">#INV-2026-091</span>
            </div>
            <div className="space-y-1.5 text-[12px] bg-white p-3 rounded-xl border border-[#E3DFE5]">
              <div className="flex justify-between">
                <span>Core Analytics Seats x 5</span>
                <span className="font-mono">$495.00</span>
              </div>
              <div className="flex justify-between text-[#1E8E5A]">
                <span>Promo Discount (-10%)</span>
                <span className="font-mono">-$49.50</span>
              </div>
              <div className="flex justify-between text-[#6D6572]">
                <span>State Tax (5%)</span>
                <span className="font-mono">+$22.28</span>
              </div>
              <div className="pt-2 border-t border-[#E3DFE5] flex justify-between font-bold text-[#1F1A21]">
                <span>Total Due</span>
                <span className="font-mono text-[#6B4A6B]">$467.78</span>
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="bg-[#FAF9FA] rounded-2xl border border-[#E3DFE5] p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3DFE5]">
              <span className="font-bold text-[13px] text-[#1F1A21] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#1E8E5A]" />
                Payment Capture & Settlement
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDFDF5] text-[#1E8E5A]">
                Overpayment Guard Active
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E3DFE5] space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#6D6572]">Payment Amount Recorded:</span>
                <span className="font-mono font-bold text-[#1E8E5A]">$467.78</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6D6572]">Method:</span>
                <span className="font-semibold text-[#1F1A21]">Credit Card (Stripe)</span>
              </div>
              <div className="flex justify-between text-[#1E8E5A] font-bold pt-1 border-t border-[#E3DFE5]">
                <span>Remaining Balance Due:</span>
                <span className="font-mono">$0.00 (PAID)</span>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <div className="bg-[#FAF9FA] rounded-2xl border border-[#E3DFE5] p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3DFE5]">
              <span className="font-bold text-[13px] text-[#1F1A21] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#6B4A6B]" />
                Finance Telemetry Dashboard
              </span>
              <span className="text-[11px] font-bold text-[#1E8E5A] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1E8E5A] animate-pulse" />
                Live SSE Connected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="bg-white p-3 rounded-xl border border-[#E3DFE5]">
                <div className="text-[11px] text-[#6D6572]">Current MRR</div>
                <div className="text-[20px] font-mono font-bold text-[#1F1A21]">$28,400.00</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E3DFE5]">
                <div className="text-[11px] text-[#6D6572]">Active Subscriptions</div>
                <div className="text-[20px] font-mono font-bold text-[#6B4A6B]">142 contracts</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="max-w-4xl mx-auto px-4 sm:px-6"
    >
      {/* Framed Player Container */}
      <div className="bg-white rounded-3xl border border-[#E3DFE5] shadow-[0_20px_50px_-15px_rgba(107,74,107,0.12)] p-6 sm:p-8 space-y-6">
        {/* Slide Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DFE5]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B4A6B] bg-[#F1EAF1] px-2.5 py-0.5 rounded">
              Feature Tour 0{currentSlideIndex + 1}
            </span>
            <h3 className="font-caveat font-bold text-[32px] text-[#1F1A21] leading-tight mt-1">
              {currentSlide.title}
            </h3>
            <p className="text-[13px] text-[#6D6572]">
              {currentSlide.description}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#1E8E5A] bg-[#EDFDF5] border border-[#C6F6D5] px-2.5 py-1 rounded-full">
              {currentSlide.highlight}
            </span>
          </div>
        </div>

        {/* Slide Real React Preview Content with Crossfade */}
        <div className="transition-opacity duration-300 min-h-[220px]">
          {renderSlideContent()}
        </div>

        {/* Controls Bar: Pause/Play, Scrubbable Progress Bar, Slide Dots */}
        <div className="pt-4 border-t border-[#E3DFE5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg border border-[#E3DFE5] text-[#1F1A21] hover:bg-[#FAF9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B]"
              aria-label={isPlaying ? 'Pause tour auto-advance' : 'Play tour auto-advance'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-[#6B4A6B]" /> : <Play className="w-4 h-4 text-[#6B4A6B]" />}
            </button>

            {/* Scrubbable Progress Bar */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = clickX / rect.width;
                const targetIdx = Math.floor(ratio * TOUR_SLIDES.length);
                goToSlide(Math.min(TOUR_SLIDES.length - 1, Math.max(0, targetIdx)));
              }}
              className="w-44 sm:w-64 h-2 bg-[#FAF9FA] border border-[#E3DFE5] rounded-full overflow-hidden cursor-pointer relative"
              title="Click anywhere to scrub slides"
            >
              <div
                className="h-full bg-[#6B4A6B] rounded-full transition-all duration-75 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Slide Dots */}
          <div className="flex items-center gap-2">
            {TOUR_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  currentSlideIndex === idx
                    ? 'w-7 bg-[#6B4A6B]'
                    : 'bg-[#E3DFE5] hover:bg-[#6D6572]'
                }`}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
