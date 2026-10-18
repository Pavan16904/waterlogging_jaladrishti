import React from 'react';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  reason: string;
  sourceName?: string;
  onOpenStatus?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Data Source Not Connected',
  reason,
  sourceName,
  onOpenStatus,
  className = '',
}) => {
  return (
    <div
      className={`p-6 border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 rounded-md text-left ${className}`}
      data-testid="empty-state"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {title} {sourceName ? `(${sourceName})` : ''}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 uppercase font-bold">
              not connected
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            {reason}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={onOpenStatus}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-900 dark:text-amber-300 underline underline-offset-2 hover:opacity-80"
            >
              <span>View Data Pipeline Status</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
