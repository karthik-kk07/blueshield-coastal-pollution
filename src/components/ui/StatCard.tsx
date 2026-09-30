import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'teal';
  change?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  change,
}) => {
  const iconColors = {
    default: 'text-slate-600 bg-slate-100',
    success: 'text-emerald-700 bg-emerald-50',
    warning: 'text-amber-700 bg-amber-50',
    critical: 'text-red-700 bg-red-50',
    teal: 'text-teal-700 bg-teal-50',
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 truncate">{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded ${iconColors[variant]} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </span>
        {change && (
          <span className={`text-xs font-medium ${change.isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
            {change.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-slate-400 mt-2 truncate leading-tight">
          {subtext}
        </p>
      )}
    </div>
  );
};
