import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  helperText,
  required = false,
  className = '',
  children,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-[12px] font-medium leading-[1.5] text-[#1F1A21] flex items-center gap-1 select-none"
      >
        <span>{label}</span>
        {required && <span className="text-[#C0392B] font-bold">*</span>}
      </label>
      <div className="relative">{children}</div>
      {error ? (
        <span className="text-[12px] font-normal leading-[1.5] text-[#C0392B] animate-in fade-in duration-150">
          {error}
        </span>
      ) : helperText ? (
        <span className="text-[12px] font-normal leading-[1.5] text-[#6D6572]">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

