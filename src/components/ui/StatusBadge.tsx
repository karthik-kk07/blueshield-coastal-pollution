import React from 'react';
import { TaskState } from '../../types/firestore';

export type StandardStatus =
  | 'REPORTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'CLEANED'
  | 'VERIFIED_CLOSED'
  | string;

export type StandardSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;

interface StatusBadgeProps {
  status: StandardStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const normalized = (status || 'REPORTED').toUpperCase().replace(/\s+/g, '_');

  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    REPORTED: {
      label: 'REPORTED',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      dot: 'bg-slate-500',
    },
    PENDING_VERIFICATION: {
      label: 'REPORTED',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      dot: 'bg-slate-500',
    },
    VERIFIED: {
      label: 'VERIFIED',
      bg: 'bg-teal-50',
      text: 'text-teal-900',
      border: 'border-teal-300',
      dot: 'bg-teal-600',
    },
    FIELD_VERIFIED: {
      label: 'VERIFIED',
      bg: 'bg-teal-50',
      text: 'text-teal-900',
      border: 'border-teal-300',
      dot: 'bg-teal-600',
    },
    ASSIGNED: {
      label: 'ASSIGNED',
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-300',
      dot: 'bg-indigo-600',
    },
    DISPATCHED: {
      label: 'ASSIGNED',
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-300',
      dot: 'bg-indigo-600',
    },
    ACCEPTED: {
      label: 'ACCEPTED',
      bg: 'bg-sky-50',
      text: 'text-sky-900',
      border: 'border-sky-300',
      dot: 'bg-sky-600',
    },
    IN_PROGRESS: {
      label: 'IN PROGRESS',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      dot: 'bg-amber-600 animate-pulse',
    },
    CLEANED: {
      label: 'CLEANED',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    REMEDIATED: {
      label: 'CLEANED',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    RESOLVED: {
      label: 'CLEANED',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    VERIFIED_CLOSED: {
      label: 'VERIFIED CLOSED',
      bg: 'bg-teal-950 text-teal-100',
      text: 'text-teal-100',
      border: 'border-teal-800',
      dot: 'bg-teal-400',
    },
    REJECTED: {
      label: 'REJECTED',
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      border: 'border-rose-300',
      dot: 'bg-rose-600',
    },
    DUPLICATE: {
      label: 'DUPLICATE',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const current = configs[normalized] || {
    label: normalized.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  };

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded border shrink-0 transition-colors ${current.bg} ${current.text} ${current.border} ${sizeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};

interface SeverityBadgeProps {
  severity: StandardSeverity;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const normalized = (severity || 'MODERATE').toUpperCase();

  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    CRITICAL: {
      label: 'CRITICAL',
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      border: 'border-rose-300',
      dot: 'bg-rose-600',
    },
    HIGH: {
      label: 'HIGH',
      bg: 'bg-orange-50',
      text: 'text-orange-950',
      border: 'border-orange-300',
      dot: 'bg-orange-600',
    },
    MODERATE: {
      label: 'MODERATE',
      bg: 'bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
    },
    MEDIUM: {
      label: 'MODERATE',
      bg: 'bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
    },
    LOW: {
      label: 'LOW',
      bg: 'bg-emerald-50',
      text: 'text-emerald-950',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
  };

  const current = configs[normalized] || configs.MODERATE;

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded border shrink-0 transition-colors ${current.bg} ${current.text} ${current.border} ${sizeClass} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />
      {showLabel && <span>{current.label}</span>}
    </span>
  );
};
