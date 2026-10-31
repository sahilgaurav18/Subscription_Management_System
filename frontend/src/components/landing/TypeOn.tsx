import React, { useEffect, useState, useRef } from 'react';

export interface TypeOnProps {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  showCaret?: boolean;
  caretColor?: string;
  className?: string;
  onComplete?: () => void;
  triggerInView?: boolean;
}

export const TypeOn: React.FC<TypeOnProps> = ({
  text,
  speedMs = 45,
  startDelayMs = 200,
  showCaret = true,
  caretColor = '#6B4A6B',
  className = '',
  onComplete,
  triggerInView = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // If reduced motion, skip typing effect
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(text);
      setIsTypingDone(true);
      if (onComplete) onComplete();
      return;
    }

    if (!triggerInView) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [text, triggerInView, onComplete]);

  useEffect(() => {
    if (!hasStarted) return;

    let index = 0;
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        index += 1;
        setDisplayedText(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(interval);
          setIsTypingDone(true);
          if (onComplete) onComplete();
        }
      }, speedMs);

      return () => clearInterval(interval);
    }, startDelayMs);

    return () => clearTimeout(startTimer);
  }, [hasStarted, text, speedMs, startDelayMs, onComplete]);

  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {displayedText}
      {showCaret && !isTypingDone && (
        <span
          className="inline-block w-[3px] h-[0.9em] align-middle ml-1 animate-pulse"
          style={{ backgroundColor: caretColor }}
          aria-hidden="true"
        />
      )}
    </span>
  );
};

