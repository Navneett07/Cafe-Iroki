import React from 'react';
import { motion } from 'framer-motion';
import { getOrderStatusColor, getPaymentStatusColor, capitalize } from '@shared/utils/formatters';

interface BadgeProps { status: string; }

export const OrderStatusBadge: React.FC<BadgeProps> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(status)}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {capitalize(status.replace(/-/g, ' '))}
  </span>
);

export const PaymentStatusBadge: React.FC<BadgeProps> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(status)}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {capitalize(status)}
  </span>
);

interface StatusBadgeProps {
  label: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'zinc';
}

const colorMap: Record<string, string> = {
  green: 'text-emerald-400 bg-emerald-400/10',
  yellow: 'text-yellow-400 bg-yellow-400/10',
  red: 'text-red-400 bg-red-400/10',
  blue: 'text-blue-400 bg-blue-400/10',
  purple: 'text-purple-400 bg-purple-400/10',
  zinc: 'text-zinc-400 bg-zinc-400/10',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, color = 'zinc' }) => (
  <motion.span
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colorMap[color]}`}
  >
    {label}
  </motion.span>
);
