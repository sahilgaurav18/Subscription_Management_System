import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'neutralDark'
  | 'primary';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    // Soft backgrounds + darker text tokens from prompt
    success: 'bg-[#EAF6EE] text-[#1E8E5A] border-[#C6E8D2]',
    warning: 'bg-[#FEF6E7] text-[#B7791F] border-[#FADDA8]',
    danger: 'bg-[#FDF2F2] text-[#C0392B] border-[#F8D2D0]',
    info: 'bg-[#EBF3FB] text-[#2B6CB0] border-[#C2DCF2]',
    neutral: 'bg-[#F1EFF2] text-[#6D6572] border-[#E3DFE5]',
    neutralDark: 'bg-[#E3DFE5] text-[#1F1A21] border-[#D0CCD3]',
    primary: 'bg-[#F1EAF1] text-[#6B4A6B] border-[#E1D4E1]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-[12px] px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status: string;
  type?: 'subscription' | 'invoice' | 'general';
  isOverdue?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'general',
  isOverdue = false,
  className = '',
}) => {
  const normalized = (status || '').toLowerCase().trim();

  if (isOverdue || normalized === 'overdue') {
    return (
      <Badge variant="danger" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] shrink-0" />
        <span>Overdue</span>
      </Badge>
    );
  }

  // Exact prompt status badges:
  // subscription: draft = neutral, quotation = info, confirmed = warning, active = success, closed = neutral dark
  // invoice: draft = neutral, confirmed = info, paid = success, overdue = danger
  let variant: BadgeVariant = 'neutral';
  let label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  if (type === 'invoice') {
    if (normalized === 'draft') variant = 'neutral';
    else if (normalized === 'confirmed') variant = 'info';
    else if (normalized === 'paid') variant = 'success';
    else if (normalized === 'cancelled') variant = 'danger';
    else variant = 'neutral';
  } else if (type === 'subscription') {
    if (normalized === 'draft') variant = 'neutral';
    else if (normalized === 'quotation') variant = 'info';
    else if (normalized === 'confirmed') variant = 'warning';
    else if (normalized === 'active') variant = 'success';
    else if (normalized === 'paused') variant = 'warning';
    else if (normalized === 'closed') variant = 'neutralDark';
    else if (normalized === 'renewed') variant = 'primary';
    else variant = 'neutral';
  } else {
    // General fallback
    if (normalized === 'active' || normalized === 'paid' || normalized === 'success') variant = 'success';
    else if (normalized === 'confirmed' || normalized === 'warning' || normalized === 'paused') variant = 'warning';
    else if (normalized === 'quotation' || normalized === 'info') variant = 'info';
    else if (normalized === 'closed' || normalized === 'dark') variant = 'neutralDark';
    else if (normalized === 'danger' || normalized === 'cancelled') variant = 'danger';
    else variant = 'neutral';
  }

  return (
    <Badge variant={variant} className={className}>
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          variant === 'success'
            ? 'bg-[#1E8E5A]'
            : variant === 'warning'
            ? 'bg-[#B7791F]'
            : variant === 'danger'
            ? 'bg-[#C0392B]'
            : variant === 'info'
            ? 'bg-[#2B6CB0]'
            : variant === 'neutralDark'
            ? 'bg-[#1F1A21]'
            : variant === 'primary'
            ? 'bg-[#6B4A6B]'
            : 'bg-[#6D6572]'
        }`}
      />
      <span>{label || 'Draft'}</span>
    </Badge>
  );
};

