import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/25',
  secondary: 'bg-white/8 hover:bg-white/12 text-[--color-text-primary] border border-[--color-border]',
  ghost: 'hover:bg-white/5 text-[--color-text-secondary] hover:text-[--color-text-primary]',
  danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20',
};
const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-medium rounded-[--radius-btn] transition-all duration-150 active:scale-95 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {loading ? (
      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : icon}
    {children}
  </button>
);

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, prefix, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">{label}</label>}
    <div className="relative">
      {prefix && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">{prefix}</div>}
      <input
        className={`w-full bg-[--color-surface-700] border border-[--color-border] rounded-[--radius-btn] px-3 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20 transition-all ${prefix ? 'pl-9' : ''} ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, children, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">{label}</label>}
    <select
      className={`w-full bg-[--color-surface-700] border border-[--color-border] rounded-[--radius-btn] px-3 py-2.5 text-sm text-[--color-text-primary] focus:outline-none focus:border-brand-500/60 transition-all appearance-none ${error ? 'border-red-500/50' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }> = ({
  label, error, className = '', ...props
}) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">{label}</label>}
    <textarea
      className={`w-full bg-[--color-surface-700] border border-[--color-border] rounded-[--radius-btn] px-3 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20 resize-none transition-all ${error ? 'border-red-500/50' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);
