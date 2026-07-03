import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
interface SkeletonProps { className?: string; }
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div className="w-full overflow-hidden">
    <div className="flex gap-4 px-4 py-3 border-b border-[--color-border]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === 0 ? 'w-32' : 'flex-1'}`} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} className="flex gap-4 px-4 py-4 border-b border-[--color-border]/50">
        {Array.from({ length: cols }).map((_, ci) => (
          <Skeleton key={ci} className={`h-4 ${ci === 0 ? 'w-24' : ci === cols - 1 ? 'w-16' : 'flex-1'}`} />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass rounded-[--radius-card] p-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    {icon && <div className="mb-4 text-[--color-text-muted] opacity-60">{icon}</div>}
    <h3 className="text-base font-semibold text-[--color-text-primary] mb-2">{title}</h3>
    {description && <p className="text-sm text-[--color-text-secondary] max-w-xs mb-4">{description}</p>}
    {action}
  </motion.div>
);

// ─── Error State ──────────────────────────────────────────────────────────────
interface ErrorStateProps { message?: string; onRetry?: () => void; }
export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Something went wrong', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div className="p-4 rounded-full bg-red-500/10">
      <AlertTriangle size={24} className="text-red-400" />
    </div>
    <p className="text-sm text-[--color-text-secondary] max-w-xs">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10 text-[--color-text-primary] transition-colors"
      >
        <RefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);
