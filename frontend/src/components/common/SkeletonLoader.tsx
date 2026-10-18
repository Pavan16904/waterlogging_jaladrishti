import React from 'react';

export const SkeletonLoader: React.FC<{
  rows?: number;
  heightClass?: string;
  height?: string;
  width?: string;
}> = ({ rows = 3, heightClass = 'h-6', height, width }) => {
  const style: React.CSSProperties = {};
  if (height) style.height = height;
  if (width) style.width = width;

  return (
    <div className="w-full space-y-3 animate-pulse" data-testid="skeleton-loader" style={style}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-slate-200 dark:bg-slate-800 rounded ${heightClass}`}
          style={{ width: width ? '100%' : `${100 - (idx % 3) * 15}%` }}
        />
      ))}
    </div>
  );
};
