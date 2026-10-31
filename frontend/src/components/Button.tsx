import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isBusy = isLoading || loading;
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4A6B] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  // Ensuring at least 36px height
  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-[36px] px-4 py-2 text-sm gap-2',
    lg: 'min-h-[44px] px-6 py-2.5 text-base gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-[#6B4A6B] text-white hover:bg-[#593B59] active:bg-[#4E334E] border border-transparent shadow-xs',
    secondary: 'bg-white text-[#1F1A21] hover:bg-[#F1EAF1] hover:border-[#6B4A6B] border border-[#E3DFE5] shadow-2xs',
    danger: 'bg-white text-[#C0392B] hover:bg-[#FDF2F2] hover:border-[#C0392B] border border-[#E3DFE5] shadow-2xs',
    ghost: 'bg-transparent text-[#6D6572] hover:bg-[#F1EAF1] hover:text-[#1F1A21] border border-transparent',
    link: 'bg-transparent text-[#6B4A6B] hover:underline p-0 min-h-0 border-none',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isBusy}
      {...props}
    >
      {isBusy ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
