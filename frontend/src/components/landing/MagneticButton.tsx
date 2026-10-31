import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

export interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  to?: string;
  href?: string;
  maxOffset?: number; // default 6px as requested
  ariaLabel?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  onClick,
  to,
  href,
  maxOffset = 6,
  ariaLabel,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    const x = Math.max(-maxOffset, Math.min(maxOffset, deltaX * maxOffset));
    const y = Math.max(-maxOffset, Math.min(maxOffset, deltaY * maxOffset));

    setOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  const style: React.CSSProperties = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    transition: 'transform 150ms ease-out',
  };

  const content = (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className="inline-block"
    >
      {to ? (
        <Link to={to} className={className} aria-label={ariaLabel}>
          {children}
        </Link>
      ) : href ? (
        <a href={href} className={className} aria-label={ariaLabel}>
          {children}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={className} aria-label={ariaLabel}>
          {children}
        </button>
      )}
    </div>
  );

  return content;
};

