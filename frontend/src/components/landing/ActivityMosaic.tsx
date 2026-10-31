import React, { useState, useEffect } from 'react';
import { DoodleArrowAmber } from './DoodleRays';

interface MosaicTile {
  id: number;
  shape: 'circle' | 'square' | 'leaf-tr' | 'leaf-bl';
  type: 'empty' | 'plum-tint' | 'chip';
  label?: string;
  badgeBg?: string;
  badgeText?: string;
}

const CHIP_POOL = [
  { label: 'Active', bg: 'bg-[#EDFDF5]', text: 'text-[#1E8E5A]' },
  { label: 'Paid', bg: 'bg-[#EDFDF5]', text: 'text-[#1E8E5A]' },
  { label: 'Quote', bg: 'bg-[#EBF8FF]', text: 'text-[#2B6CB0]' },
  { label: '$99/mo', bg: 'bg-[#F1EAF1]', text: 'text-[#6B4A6B]' },
  { label: 'Draft', bg: 'bg-[#FAF9FA]', text: 'text-[#6D6572]' },
  { label: 'Synced', bg: 'bg-[#EDFDF5]', text: 'text-[#12C2A5]' },
  { label: 'Billed', bg: 'bg-[#FFFBEB]', text: 'text-[#B7791F]' },
  { label: 'Renewed', bg: 'bg-[#F1EAF1]', text: 'text-[#6B4A6B]' },
  { label: 'Zero Dupes', bg: 'bg-[#EDFDF5]', text: 'text-[#12C2A5]' },
  { label: 'Auto-Tax', bg: 'bg-[#EBF8FF]', text: 'text-[#2B6CB0]' },
];

export const ActivityMosaic: React.FC = () => {
  // 60 tiles (12 cols x 5 rows)
  const [tiles, setTiles] = useState<MosaicTile[]>(() => {
    const list: MosaicTile[] = [];
    const shapes: ('circle' | 'square' | 'leaf-tr' | 'leaf-bl')[] = ['square', 'circle', 'leaf-tr', 'leaf-bl'];
    
    // Designated indices for chips
    const chipIndices = new Set([1, 4, 9, 13, 23, 26, 35, 38, 47, 50, 55, 58]);

    for (let i = 0; i < 60; i++) {
      const shape = shapes[i % 4];
      if (chipIndices.has(i)) {
        const poolItem = CHIP_POOL[i % CHIP_POOL.length];
        list.push({
          id: i,
          shape,
          type: 'chip',
          label: poolItem.label,
          badgeBg: poolItem.bg,
          badgeText: poolItem.text,
        });
      } else if (i % 3 === 0) {
        list.push({ id: i, shape, type: 'plum-tint' });
      } else {
        list.push({ id: i, shape, type: 'empty' });
      }
    }
    return list;
  });

  // Periodically flip one random chip for live activity feel
  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const interval = setInterval(() => {
      setTiles((prev) => {
        const next = [...prev];
        const chipIndices = [1, 4, 9, 13, 23, 26, 35, 38, 47, 50, 55, 58];
        const randomIdx = chipIndices[Math.floor(Math.random() * chipIndices.length)];
        const randomChip = CHIP_POOL[Math.floor(Math.random() * CHIP_POOL.length)];
        
        next[randomIdx] = {
          ...next[randomIdx],
          label: randomChip.label,
          badgeBg: randomChip.bg,
          badgeText: randomChip.text,
        };
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-16 overflow-hidden">
      {/* 12-column Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 sm:gap-3 select-none opacity-85">
        {tiles.map((tile) => {
          let shapeClasses = 'rounded-2xl';
          if (tile.shape === 'circle') shapeClasses = 'rounded-full';
          if (tile.shape === 'leaf-tr') shapeClasses = 'rounded-2xl rounded-tr-none';
          if (tile.shape === 'leaf-bl') shapeClasses = 'rounded-2xl rounded-bl-none';

          return (
            <div
              key={tile.id}
              className={`h-11 sm:h-13 flex items-center justify-center transition-all duration-700 ${shapeClasses} ${
                tile.type === 'chip'
                  ? `${tile.badgeBg} ${tile.badgeText} font-semibold text-[11px] sm:text-xs shadow-xs border border-black/5`
                  : tile.type === 'plum-tint'
                  ? 'bg-[#F1EAF1]/70 border border-[#E3DFE5]'
                  : 'bg-[#FAF9FA] border border-[#E3DFE5]/70'
              }`}
            >
              {tile.type === 'chip' && (
                <span className="truncate px-1.5">{tile.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Center Caveat Card */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl border-2 border-[#6B4A6B] p-6 sm:p-9 shadow-2xl shadow-[#6B4A6B]/15 text-center">
        {/* Doodle Arrow + sync note */}
        <div className="absolute -top-11 right-6 sm:right-12 flex items-center gap-1 pointer-events-none">
          <span className="font-caveat font-bold text-[22px] text-[#F5A623] tracking-wide rotate-6">
            always on time!
          </span>
          <DoodleArrowAmber className="w-8 h-8" />
        </div>

        {/* Caveat Headline */}
        <h3 className="font-caveat font-bold text-[34px] sm:text-[44px] text-[#1F1A21] leading-tight tracking-tight">
          Every renewal, invoice and payment, in sync
        </h3>

        {/* Sub-line */}
        <p className="text-[15px] sm:text-[16px] text-[#6D6572] mt-2.5 leading-relaxed">
          Deterministic background workers ensure zero double-billing and zero skipped cycles.
        </p>

        {/* Mini stats pill */}
        <div className="mt-5 inline-flex items-center gap-4 text-xs font-semibold px-4 py-1.5 rounded-full bg-[#FAF9FA] border border-[#E3DFE5] text-[#1F1A21]">
          <span className="flex items-center gap-1.5 text-[#1E8E5A]">
            <span className="w-2 h-2 rounded-full bg-[#1E8E5A]"></span>
            Worker Heartbeat Active
          </span>
          <span className="text-[#6D6572]">|</span>
          <span className="text-[#6B4A6B]">Catch-up Guaranteed</span>
        </div>
      </div>
    </div>
  );
};

