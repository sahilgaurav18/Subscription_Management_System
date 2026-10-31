import React from 'react';

export interface DoodleRaysProps {
  className?: string;
  color?: string;
  size?: number;
}

export const DoodleRays: React.FC<DoodleRaysProps> = ({
  className = '',
  color = '#F26B6B',
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Ray 1: Top-right slant */}
      <path
        d="M12 28C16 22 22 15 28 8"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        className="animate-draw-stroke"
        style={{ animationDelay: '300ms' }}
      />
      {/* Ray 2: Middle outward ray */}
      <path
        d="M20 34C28 30 36 24 42 18"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        className="animate-draw-stroke"
        style={{ animationDelay: '450ms' }}
      />
      {/* Ray 3: Lower sweep ray */}
      <path
        d="M24 40C32 38 38 34 44 28"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        className="animate-draw-stroke"
        style={{ animationDelay: '600ms' }}
      />
    </svg>
  );
};

export const DoodleArrowTeal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    width="54"
    height="48"
    viewBox="0 0 54 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
    aria-hidden="true"
  >
    <path
      d="M10 40C18 38 28 28 34 16"
      stroke="#12C2A5"
      strokeWidth="3.2"
      strokeLinecap="round"
      className="animate-draw-stroke"
    />
    <path
      d="M24 14L35 15L36 26"
      stroke="#12C2A5"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-draw-stroke"
      style={{ animationDelay: '200ms' }}
    />
  </svg>
);

export const DoodleArrowAmber: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    width="50"
    height="42"
    viewBox="0 0 50 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${className}`}
    aria-hidden="true"
  >
    <path
      d="M40 8C30 18 18 24 12 30"
      stroke="#F5A623"
      strokeWidth="3"
      strokeLinecap="round"
      className="animate-draw-stroke"
    />
    <path
      d="M10 20L11 32L23 33"
      stroke="#F5A623"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-draw-stroke"
      style={{ animationDelay: '200ms' }}
    />
  </svg>
);

export const DoodleLoopUnderline: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = '#F5A623',
}) => (
  <svg
    viewBox="0 0 160 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`absolute left-0 bottom-[-6px] w-full h-[10px] select-none ${className}`}
    aria-hidden="true"
    preserveAspectRatio="none"
  >
    <path
      d="M2 9C40 3 110 2 158 8C130 14 70 15 15 13"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      className="animate-draw-stroke"
    />
  </svg>
);

