import React from 'react';

export interface SectionDividerProps {
  fillColor?: string;
  bgColor?: string;
  inverted?: boolean;
  className?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  fillColor = '#F4F3F6',
  bgColor = '#FFFFFF',
  inverted = false,
  className = '',
}) => {
  return (
    <div
      className={`w-full overflow-hidden leading-none pointer-events-none select-none ${className}`}
      style={{ backgroundColor: bgColor }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 64"
        preserveAspectRatio="none"
        className={`w-full h-8 sm:h-12 block ${inverted ? 'rotate-180' : ''}`}
        style={{ fill: fillColor }}
      >
        <path d="M0,0 C300,56 900,56 1200,0 L1200,64 L0,64 Z" />
      </svg>
    </div>
  );
};

