import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`block w-full rounded-md border text-sm transition-colors px-3 py-2
          ${
            error
              ? 'border-red-400 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]'
          }
          focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200
          ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
