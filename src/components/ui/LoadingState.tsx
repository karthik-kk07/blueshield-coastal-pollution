import React from 'react';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  variant?: 'spinner' | 'skeleton';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading coastal data...',
  subMessage,
  variant = 'spinner',
}) => {
  if (variant === 'skeleton') {
    return (
      <div className="w-full space-y-4 animate-pulse p-4">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="h-28 bg-slate-200 rounded-lg" />
          <div className="h-28 bg-slate-200 rounded-lg" />
          <div className="h-28 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0B2545] rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-700">{message}</p>
      {subMessage && <p className="text-xs text-slate-400 mt-1">{subMessage}</p>}
    </div>
  );
};
