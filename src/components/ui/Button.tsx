import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Base design classes
  const baseStyle = 'inline-flex items-center justify-center font-sans font-medium tracking-wide transition-smooth focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';
  
  // Sizing definitions
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-sm gap-1.5',
    md: 'text-sm px-6 py-2.5 rounded-md gap-2',
    lg: 'text-base px-8 py-3.5 rounded-lg gap-2.5',
  };

  // Color variants
  const variantStyles = {
    primary: 'bg-text-primary text-bg-primary hover:bg-brand-primary hover:text-white dark:hover:bg-accent-warm shadow-premium-sm',
    secondary: 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-premium-sm',
    outline: 'border border-border-subtle bg-transparent text-text-primary hover:bg-text-primary hover:text-bg-primary',
    gold: 'bg-accent-gold text-bg-primary hover:bg-accent-gold/90 font-serif font-bold shadow-glow-gold hover:shadow-premium-md',
    ghost: 'bg-transparent text-text-primary hover:bg-border-subtle',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
