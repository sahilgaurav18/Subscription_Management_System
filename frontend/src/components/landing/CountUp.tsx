import React, { useEffect, useState, useRef } from 'react';

export interface CountUpProps {
  to: number;
  from?: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  durationMs = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const [val, setVal] = useState(from);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(to);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          const startTime = performance.now();

          const step = (currentTime: number) => {
            const progress = Math.min((currentTime - startTime) / durationMs, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentVal = from + (to - from) * ease;
            setVal(currentVal);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setVal(to);
            }
          };

          requestAnimationFrame(step);
          if (elementRef.current) observer.unobserve(elementRef.current);
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [to, from, durationMs]);

  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

