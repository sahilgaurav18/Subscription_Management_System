import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';

export interface PricingPlan {
  id: number;
  name: string;
  price: number; // in cents
  currency: string;
  billing_period: string;
  min_quantity: number;
}

interface PricingCardProps {
  plan: PricingPlan;
  isYearlyMode: boolean;
  isPopular?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isYearlyMode,
  isPopular = false,
}) => {
  // Compute price based on yearly toggle (20% discount on yearly commitment for monthly plans)
  const baseMonthlyDollars = plan.price / 100;
  const displayPriceDollars = isYearlyMode
    ? Math.round(baseMonthlyDollars * 0.8)
    : baseMonthlyDollars;

  // Curated feature bullets
  const getFeatures = (name: string, period: string) => {
    const common = ['Full Customer Portal Access', 'Automated PDF Invoices', 'Multi-tax & Promo Engine'];
    if (name.toLowerCase().includes('enterprise') || period === 'yearly') {
      return [
        'Unlimited Subscriptions & Users',
        'Custom Quotation Templates',
        'Dedicated Audit Trail Export',
        'Priority SLA Support',
        ...common,
      ];
    }
    if (name.toLowerCase().includes('pro') || name.toLowerCase().includes('standard')) {
      return [
        'Up to 250 Active Subscriptions',
        'Custom Quotation Templates',
        'Automatic Overdue Reminders',
        ...common,
      ];
    }
    return [
      'Up to 50 Active Subscriptions',
      'Standard Quotation Builder',
      ...common,
    ];
  };

  const features = getFeatures(plan.name, plan.billing_period);

  return (
    <div
      className={`relative bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
        isPopular
          ? 'border-2 border-[#6B4A6B] shadow-xl shadow-[#6B4A6B]/10 lg:-translate-y-2 lg:scale-[1.03] z-10'
          : 'border border-[#E3DFE5] shadow-xs hover:border-[#6B4A6B]/40 hover:shadow-md'
      }`}
    >
      {/* Most Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6B4A6B] text-white text-[12px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
          Most Popular
        </div>
      )}

      <div>
        {/* Plan Title */}
        <h3 className="font-caveat font-bold text-[32px] text-[#1F1A21] leading-tight">
          {plan.name}
        </h3>
        <p className="text-[13px] text-[#6D6572] mt-1">
          Billed {isYearlyMode ? 'annually (-20% discount)' : plan.billing_period}
        </p>

        {/* Price Display */}
        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-mono text-[42px] font-bold text-[#1F1A21] tracking-tight tabular-nums">
            ${displayPriceDollars}
          </span>
          <span className="text-[14px] text-[#6D6572] font-medium">
            /{isYearlyMode ? 'mo' : plan.billing_period === 'daily' ? 'day' : plan.billing_period === 'weekly' ? 'wk' : 'mo'}
          </span>
        </div>

        {plan.min_quantity > 1 && (
          <div className="mt-1 text-[11px] text-[#6D6572] font-medium">
            Min. commitment: {plan.min_quantity} units
          </div>
        )}

        {/* Feature List */}
        <div className="mt-6 pt-6 border-t border-[#E3DFE5]/80 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6D6572]">
            What is included:
          </div>
          {features.map((feat) => (
            <div key={feat} className="flex items-start gap-2.5 text-[13px] text-[#1F1A21]">
              <div className="w-4 h-4 rounded-full bg-[#EDFDF5] text-[#1E8E5A] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Button CTA */}
      <div className="mt-8 pt-4">
        <Link
          to="/register"
          className={`w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg font-medium text-[14px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] focus-visible:ring-offset-2 ${
            isPopular
              ? 'bg-[#6B4A6B] text-white hover:bg-[#593B59] shadow-xs'
              : 'bg-[#FAF9FA] text-[#1F1A21] border border-[#E3DFE5] hover:bg-[#F1EAF1] hover:text-[#6B4A6B] hover:border-[#6B4A6B]'
          }`}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

