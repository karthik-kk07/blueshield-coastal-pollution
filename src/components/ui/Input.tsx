import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-xs">
        {Icon && iconPosition === 'left' && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-md border text-sm transition-colors
            ${Icon && iconPosition === 'left' ? 'pl-9' : 'pl-3'}
            ${Icon && iconPosition === 'right' ? 'pr-9' : 'pr-3'}
            py-2
            ${
              error
                ? 'border-red-400 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]'
            }
            focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200
            ${className}`}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
