import React, { useEffect, useState, useRef } from 'react';

export interface MarkerHighlightProps {
  children: React.ReactNode;
  color?: 'amber' | 'teal' | 'sky' | 'coral' | 'plum';
  type?: 'behind' | 'underline';
  className?: string;
  delayMs?: number;
}

export const MarkerHighlight: React.FC<MarkerHighlightProps> = ({
  children,
  color = 'amber',
  type = 'behind',
  className = '',
  delayMs = 200,
}) => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const timer = setTimeout(() => setInView(true), delayMs);
          if (containerRef.current) observer.unobserve(containerRef.current);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [delayMs]);

  const colorMap = {
    amber: '#F5A623',
    teal: '#12C2A5',
    sky: '#2BB3F3',
    coral: '#F26B6B',
    plum: '#6B4A6B',
  };

  const chosenColor = colorMap[color];

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      {type === 'behind' && (
        <svg
          viewBox="0 0 240 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -inset-x-2 -bottom-1 -top-1 w-[calc(100%+16px)] h-[calc(100%+8px)] pointer-events-none -z-10 select-none overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M4 22 C60 14, 180 12, 236 24 C170 32, 70 30, 8 28"
            stroke={chosenColor}
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.32"
            style={{
              strokeDasharray: 480,
              strokeDashoffset: inView ? 0 : 480,
              transition: 'stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>
      )}

      {type === 'underline' && (
        <svg
          viewBox="0 0 160 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-0 -bottom-2 w-full h-[12px] pointer-events-none -z-10 select-none overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M2 10C40 4 110 3 158 9C120 15 65 14 10 12"
            stroke={chosenColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            style={{
              strokeDasharray: 320,
              strokeDashoffset: inView ? 0 : 320,
              transition: 'stroke-dashoffset 750ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>
      )}

      <span className="relative z-10">{children}</span>
    </span>
  );
};
