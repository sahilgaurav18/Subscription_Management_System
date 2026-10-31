import React from 'react';
import { DoodleArrowAmber } from './DoodleRays';

interface TileData {
  id: number;
  type: 'empty-soft' | 'empty-plum' | 'avatar';
  shape?: 'circle' | 'square' | 'leaf';
  initials?: string;
  bg?: string;
  text?: string;
  pulse?: boolean;
}

// 60 tile definitions (12 cols x 5 rows)
const MOSAIC_TILES: TileData[] = [
  // Row 1
  { id: 1, type: 'empty-soft' },
  { id: 2, type: 'avatar', initials: 'AC', shape: 'leaf', bg: 'bg-[#F1EAF1]', text: 'text-[#6B4A6B]' },
  { id: 3, type: 'empty-soft' },
  { id: 4, type: 'empty-plum' },
  { id: 5, type: 'avatar', initials: 'TL', shape: 'circle', bg: 'bg-[#EDFDF5]', text: 'text-[#12C2A5]', pulse: true },
  { id: 6, type: 'empty-soft' },
  { id: 7, type: 'empty-soft' },
  { id: 8, type: 'avatar', initials: 'RD', shape: 'square', bg: 'bg-[#FFFBEB]', text: 'text-[#F5A623]' },
  { id: 9, type: 'empty-plum' },
  { id: 10, type: 'avatar', initials: 'BW', shape: 'circle', bg: 'bg-[#FEF2F2]', text: 'text-[#F26B6B]' },
  { id: 11, type: 'empty-soft' },
  { id: 12, type: 'empty-soft' },

  // Row 2
  { id: 13, type: 'avatar', initials: 'VK', shape: 'circle', bg: 'bg-[#EDFDF5]', text: 'text-[#12C2A5]' },
  { id: 14, type: 'empty-plum' },
  { id: 15, type: 'empty-soft' },
  { id: 16, type: 'empty-soft' },
  { id: 17, type: 'empty-soft' },
  { id: 18, type: 'empty-soft' },
  { id: 19, type: 'empty-soft' },
  { id: 20, type: 'empty-soft' },
  { id: 21, type: 'empty-soft' },
  { id: 22, type: 'empty-soft' },
  { id: 23, type: 'empty-plum' },
  { id: 24, type: 'avatar', initials: 'MS', shape: 'leaf', bg: 'bg-[#F1EAF1]', text: 'text-[#6B4A6B]', pulse: true },

  // Row 3
  { id: 25, type: 'empty-soft' },
  { id: 26, type: 'avatar', initials: 'EL', shape: 'square', bg: 'bg-[#FFFBEB]', text: 'text-[#F5A623]' },
  { id: 27, type: 'empty-soft' },
  { id: 28, type: 'empty-soft' },
  { id: 29, type: 'empty-soft' },
  { id: 30, type: 'empty-soft' },
  { id: 31, type: 'empty-soft' },
  { id: 32, type: 'empty-soft' },
  { id: 33, type: 'empty-soft' },
  { id: 34, type: 'empty-soft' },
  { id: 35, type: 'avatar', initials: 'PR', shape: 'circle', bg: 'bg-[#EDFDF5]', text: 'text-[#12C2A5]' },
  { id: 36, type: 'empty-soft' },

  // Row 4
  { id: 37, type: 'empty-plum' },
  { id: 38, type: 'empty-soft' },
  { id: 39, type: 'empty-soft' },
  { id: 40, type: 'empty-soft' },
  { id: 41, type: 'empty-soft' },
  { id: 42, type: 'empty-soft' },
  { id: 43, type: 'empty-soft' },
  { id: 44, type: 'empty-soft' },
  { id: 45, type: 'empty-soft' },
  { id: 46, type: 'empty-soft' },
  { id: 47, type: 'empty-soft' },
  { id: 48, type: 'avatar', initials: 'NW', shape: 'leaf', bg: 'bg-[#FEF2F2]', text: 'text-[#F26B6B]', pulse: true },

  // Row 5
  { id: 49, type: 'empty-soft' },
  { id: 50, type: 'avatar', initials: 'SK', shape: 'circle', bg: 'bg-[#F1EAF1]', text: 'text-[#6B4A6B]' },
  { id: 51, type: 'empty-soft' },
  { id: 52, type: 'empty-plum' },
  { id: 53, type: 'avatar', initials: 'JD', shape: 'square', bg: 'bg-[#FFFBEB]', text: 'text-[#F5A623]' },
  { id: 54, type: 'empty-soft' },
  { id: 55, type: 'empty-soft' },
  { id: 56, type: 'avatar', initials: 'CF', shape: 'circle', bg: 'bg-[#EDFDF5]', text: 'text-[#12C2A5]' },
  { id: 57, type: 'empty-soft' },
  { id: 58, type: 'empty-plum' },
  { id: 59, type: 'avatar', initials: 'HT', shape: 'leaf', bg: 'bg-[#F1EAF1]', text: 'text-[#6B4A6B]' },
  { id: 60, type: 'empty-soft' },
];

export const AvatarMosaic: React.FC = () => {
  return (
    <div className="relative max-w-6xl mx-auto px-4 py-12">
      {/* 12-column by 5-row Grid (simplified to 6 cols on small screens) */}
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2.5 sm:gap-3 select-none">
        {MOSAIC_TILES.map((tile, idx) => {
          let shapeClasses = 'rounded-xl';
          if (tile.shape === 'circle') shapeClasses = 'rounded-full';
          if (tile.shape === 'leaf') shapeClasses = 'rounded-2xl rounded-tr-none';

          return (
            <div
              key={tile.id}
              className={`h-11 sm:h-14 flex items-center justify-center transition-all duration-500 ${
                tile.type === 'empty-soft'
                  ? 'bg-[#FAF9FA] border border-[#E3DFE5]/60'
                  : tile.type === 'empty-plum'
                  ? 'bg-[#F1EAF1]/70 border border-[#E1D4E1]/80'
                  : `${tile.bg} ${tile.text} font-bold text-[12px] sm:text-[13px] border border-black/5 shadow-xs ${
                      tile.pulse ? 'animate-pulse-gentle' : ''
                    }`
              } ${shapeClasses}`}
              style={{
                animationDelay: `${(idx % 12) * 50}ms`,
              }}
            >
              {tile.type === 'avatar' && tile.initials}
            </div>
          );
        })}
      </div>

      {/* Floating Center White Card */}
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#6B4A6B] p-6 sm:p-8 shadow-xl shadow-[#6B4A6B]/15 text-center">
        {/* Doodle Arrow + Happy note */}
        <div className="absolute -top-10 right-4 sm:right-10 flex items-center gap-1 pointer-events-none">
          <span className="font-caveat font-bold text-[22px] text-[#F5A623] tracking-wide rotate-6">
            happy!
          </span>
          <DoodleArrowAmber className="w-8 h-8" />
        </div>

        {/* Caveat Headline */}
        <h3 className="font-caveat font-bold text-[34px] sm:text-[42px] text-[#1F1A21] leading-tight tracking-tight">
          Built for teams that bill every month
        </h3>

        {/* Sub-line */}
        <p className="text-[15px] sm:text-[16px] text-[#6D6572] mt-2 leading-relaxed">
          Run subscriptions, invoices and payments without spreadsheets.
        </p>
      </div>
    </div>
  );
};

