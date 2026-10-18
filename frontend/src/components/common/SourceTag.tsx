import React from 'react';

export type SourceLabel = 'model' | 'satellite estimate' | 'static' | 'not connected';

export interface SourceTagProps {
  source: string;
  fetched_at?: string | Date | null;
  label: SourceLabel;
  className?: string;
}

export const SourceTag: React.FC<SourceTagProps> = ({
  source,
  fetched_at,
  label,
  className = '',
}) => {
  const getLabelBadge = () => {
    switch (label) {
      case 'model':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      case 'satellite estimate':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300 dark:border-purple-700';
      case 'static':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
      case 'not connected':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
    }
  };

  const formattedTime = fetched_at
    ? new Date(fetched_at).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${getLabelBadge()} ${className}`}
      title={`${source}${fetched_at ? ` · As of ${new Date(fetched_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` : ''}`}
      data-testid="source-tag"
    >
      <span className="font-semibold uppercase tracking-wider">{label}</span>
      <span className="opacity-40">•</span>
      <span className="truncate max-w-[120px]">{source}</span>
      {formattedTime && (
        <>
          <span className="opacity-40">•</span>
          <span className="opacity-80">{formattedTime} IST</span>
        </>
      )}
    </span>
  );
};
