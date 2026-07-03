import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatters';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  change?: number; // percentage change from prior period
  isCurrency?: boolean;
  subtitle?: string;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-brand-400',
  change,
  isCurrency = false,
  subtitle,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="glass rounded-[--radius-card] p-5 space-y-3">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-8 w-36" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const displayValue = isCurrency && typeof value === 'number'
    ? formatCurrency(value)
    : String(value);

  const trend = change === undefined ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  const trendColors = { up: 'text-emerald-400', down: 'text-red-400', flat: 'text-zinc-500' };
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-[--radius-card] p-5 flex flex-col gap-3 group hover:border-white/10 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-[--color-text-secondary]">{title}</span>
        <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/8 transition-colors ${iconColor}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-[--color-text-primary] tracking-tight">{displayValue}</p>
        {subtitle && <p className="text-xs text-[--color-text-muted] mt-0.5">{subtitle}</p>}
      </div>
      {trend !== null && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${trendColors[trend]}`}>
          <TrendIcon size={13} />
          <span>{Math.abs(change ?? 0).toFixed(1)}% vs last period</span>
        </div>
      )}
    </motion.div>
  );
};
