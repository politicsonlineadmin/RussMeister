'use client';

import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#e58300] text-white hover:bg-[#cc7400] font-semibold shadow-[0_2px_8px_rgba(229,131,0,0.25)] hover:shadow-[0_4px_16px_rgba(229,131,0,0.3)] rounded-full',
  secondary:
    'bg-white text-[#3d6b6b] hover:bg-[#e7f5f5] font-medium border border-gray-200 hover:border-gray-300 rounded-full',
  success:
    'bg-[#4CAF50] text-white hover:bg-[#43a047] font-semibold shadow-[0_2px_8px_rgba(76,175,80,0.25)] rounded-full',
  danger:
    'bg-[#ef4444] text-white hover:bg-[#dc2626] font-semibold shadow-[0_2px_8px_rgba(239,68,68,0.25)] rounded-full',
  ghost:
    'bg-transparent text-[#e58300] hover:underline font-medium',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
};

function Spinner({ size }: { size: ButtonSize }) {
  const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };
  return (
    <svg
      className={`animate-spin ${sizeMap[size]}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          relative inline-flex items-center justify-center
          transition-all duration-200 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.97]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner size={size} />}
        <span className={isLoading ? 'opacity-80' : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
