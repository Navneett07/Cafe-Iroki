import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-border-subtle/40 dark:bg-border-subtle/20 ${className}`}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${
            i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonCircle: React.FC<{ size?: string; className?: string }> = ({
  size = 'h-12 w-12',
  className = '',
}) => {
  return <Skeleton className={`rounded-full ${size} ${className}`} />;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`border border-border-subtle rounded-md p-5 bg-bg-secondary flex flex-col gap-4 ${className}`}>
      {/* Media slot */}
      <Skeleton className="h-44 w-full rounded-sm" />
      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      {/* Description lines */}
      <SkeletonText lines={2} />
      {/* Action footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle/40">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-9 w-1/3 rounded-md" />
      </div>
    </div>
  );
};
