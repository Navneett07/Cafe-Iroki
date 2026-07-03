import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  options?: { value: string; label: string }[]; // For select types
}

export const Input = forwardRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement, InputProps>(
  ({ label, error, helperText, multiline = false, rows = 3, options, className = '', type = 'text', ...props }, ref) => {
    
    const inputBaseStyle = 'w-full px-4 py-2.5 bg-bg-secondary text-text-primary rounded-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-smooth font-sans text-sm placeholder-text-secondary/50 disabled:opacity-50';
    const errorStyle = error ? 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500' : '';

    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {/* Label */}
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            {label}
          </label>
        )}

        {/* Form Inputs (Select vs Textarea vs Input) */}
        {options ? (
          <select
            ref={ref}
            className={`${inputBaseStyle} ${errorStyle} appearance-none cursor-pointer`}
            {...props as React.SelectHTMLAttributes<HTMLSelectElement>}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            ref={ref}
            rows={rows}
            className={`${inputBaseStyle} ${errorStyle} resize-none`}
            {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            className={`${inputBaseStyle} ${errorStyle}`}
            {...props as React.InputHTMLAttributes<HTMLInputElement>}
          />
        )}

        {/* Validation helpers */}
        {error ? (
          <span className="text-xs text-rose-500 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-text-secondary/70">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
