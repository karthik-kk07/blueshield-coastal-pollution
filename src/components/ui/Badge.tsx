import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'critical' | 'teal' | 'outline' | 'unboxed';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  dot = false,
}) => {
  if (variant === 'unboxed') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 ${className}`}>
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />}
        {children}
      </span>
    );
  }

  const variantStyles: Record<Exclude<BadgeVariant, 'unboxed'>, { container: string; dotColor: string }> = {
    default: {
      container: 'bg-slate-100 text-slate-700 border border-slate-200',
      dotColor: 'bg-slate-500',
    },
    success: {
      container: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      dotColor: 'bg-emerald-600',
    },
    warning: {
      container: 'bg-amber-50 text-amber-900 border border-amber-200',
      dotColor: 'bg-amber-600',
    },
    critical: {
      container: 'bg-red-50 text-red-900 border border-red-200',
      dotColor: 'bg-red-600',
    },
    teal: {
      container: 'bg-teal-50 text-teal-800 border border-teal-200',
      dotColor: 'bg-teal-600',
    },
    outline: {
      container: 'bg-transparent text-slate-600 border border-slate-300',
      dotColor: 'bg-slate-400',
    },
  };

  const current = variantStyles[variant as Exclude<BadgeVariant, 'unboxed'>] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border ${current.container} whitespace-nowrap shrink-0 ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor} shrink-0`} />}
      {children}
    </span>
  );
};
