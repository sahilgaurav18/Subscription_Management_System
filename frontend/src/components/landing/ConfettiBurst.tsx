import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  tx: number;
  ty: number;
  tr: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
}

export const ConfettiBurst: React.FC<{ active: boolean; onComplete?: () => void }> = ({
  active,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (onComplete) onComplete();
      return;
    }

    const colors = ['#6B4A6B', '#F5A623', '#12C2A5', '#F26B6B', '#2BB3F3', '#1E8E5A'];
    const generated: Particle[] = Array.from({ length: 20 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
      const distance = 40 + Math.random() * 70;
      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        tr: Math.floor(Math.random() * 720) - 360,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 5,
        shape: i % 2 === 0 ? 'rect' : 'circle',
      };
    });

    setParticles(generated);

    const timer = setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-visible"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti"
          style={
            {
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--tr': `${p.tr}deg`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

