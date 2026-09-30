import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Synchronization Error',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-lg bg-red-50/50 border border-red-200 text-center ${className}`}>
      <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-red-950 mb-1">{title}</h4>
      <p className="text-xs text-red-800 max-w-md mx-auto mb-4">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};
