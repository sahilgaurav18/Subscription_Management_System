import React from 'react';
import { Reveal } from './Reveal';

// Custom Hand-Drawn SVG 1: Invoice Sheet in Teal (#12C2A5)
const HandDrawnInvoice: React.FC = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="doodle-wiggle transition-transform duration-200"
    aria-hidden="true"
  >
    {/* Paper Sheet with hand-drawn organic curve */}
    <path
      d="M12 8C12 6.5 13.5 5 15.5 5H35L45 15V47C45 49 43.5 50.5 41.5 50.5H15.5C13.5 50.5 12 49 12 47V8Z"
      stroke="#12C2A5"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#EDFDF5"
    />
    {/* Folded corner */}
    <path
      d="M34 5V15H45"
      stroke="#12C2A5"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Invoice lines */}
    <path d="M19 22H37" stroke="#12C2A5" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M19 29H33" stroke="#12C2A5" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M19 36H28" stroke="#12C2A5" strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="37" cy="38" r="3.5" fill="#12C2A5" />
  </svg>
);

// Custom Hand-Drawn SVG 2: Smiley face in Amber (#F5A623)
const HandDrawnSmiley: React.FC = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="doodle-wiggle transition-transform duration-200"
    aria-hidden="true"
  >
    {/* Head circle with loose organic stroke */}
    <circle
      cx="28"
      cy="28"
      r="22"
      stroke="#F5A623"
      strokeWidth="3.2"
      fill="#FFFBEB"
      strokeLinecap="round"
    />
    {/* Left Eye */}
    <circle cx="20" cy="22" r="2.8" fill="#F5A623" />
    {/* Right Eye: playful wink or arc */}
    <path
      d="M33 22C35 20 38 20 40 22"
      stroke="#F5A623"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Happy smile */}
    <path
      d="M18 32C22 40 34 40 38 32"
      stroke="#F5A623"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);

// Custom Hand-Drawn SVG 3: Target in Coral (#F26B6B)
const HandDrawnTarget: React.FC = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="doodle-wiggle transition-transform duration-200"
    aria-hidden="true"
  >
    {/* Outer ring */}
    <circle
      cx="28"
      cy="28"
      r="22"
      stroke="#F26B6B"
      strokeWidth="3"
      strokeLinecap="round"
      fill="#FEF2F2"
    />
    {/* Inner ring */}
    <circle
      cx="28"
      cy="28"
      r="13"
      stroke="#F26B6B"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Bullseye center */}
    <circle cx="28" cy="28" r="5" fill="#F26B6B" />
    {/* Dart / Arrow accent line */}
    <path
      d="M36 14L46 6"
      stroke="#F26B6B"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <path
      d="M42 6H46V10"
      stroke="#F26B6B"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TeamBenefits: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Sales acceleration */}
        <Reveal staggerIndex={0}>
          <div className="group bg-white rounded-2xl border border-[#E3DFE5] p-8 text-center flex flex-col items-center hover:border-[#12C2A5]/60 hover:shadow-md transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-[#EDFDF5] flex items-center justify-center mb-5">
              <HandDrawnInvoice />
            </div>
            <h4 className="font-caveat font-bold text-[28px] text-[#1F1A21] leading-tight">
              Rapid Sales Cycles
            </h4>
            <p className="text-[15px] text-[#6D6572] mt-2 leading-relaxed">
              Quotation templates speed up sales.
              <br />
              Turn prospects into contracted subscriptions in minutes.
            </p>
          </div>
        </Reveal>

        {/* Column 2: Self-Serve Customer Experience */}
        <Reveal staggerIndex={1}>
          <div className="group bg-white rounded-2xl border border-[#E3DFE5] p-8 text-center flex flex-col items-center hover:border-[#F5A623]/60 hover:shadow-md transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-[#FFFBEB] flex items-center justify-center mb-5">
              <HandDrawnSmiley />
            </div>
            <h4 className="font-caveat font-bold text-[28px] text-[#1F1A21] leading-tight">
              Delighted Customers
            </h4>
            <p className="text-[15px] text-[#6D6572] mt-2 leading-relaxed">
              Customers manage and close their own subscriptions from the portal.
              <br />
              Zero support ticket overhead for routine tasks.
            </p>
          </div>
        </Reveal>

        {/* Column 3: Bulletproof Automated Invoicing */}
        <Reveal staggerIndex={2}>
          <div className="group bg-white rounded-2xl border border-[#E3DFE5] p-8 text-center flex flex-col items-center hover:border-[#F26B6B]/60 hover:shadow-md transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-5">
              <HandDrawnTarget />
            </div>
            <h4 className="font-caveat font-bold text-[28px] text-[#1F1A21] leading-tight">
              Flawless Accounting
            </h4>
            <p className="text-[15px] text-[#6D6572] mt-2 leading-relaxed">
              Automatic invoices never get skipped or duplicated.
              <br />
              Deterministic background worker protects revenue flow.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

