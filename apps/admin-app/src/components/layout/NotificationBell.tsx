import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAdminNotifications } from '@/context/AdminNotificationContext';

const typeColor: Record<string, string> = {
  order: 'text-blue-400',
  reservation: 'text-violet-400',
  review: 'text-amber-400',
  stock: 'text-red-400',
  coupon: 'text-emerald-400',
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllRead } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-white/5 text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-[--color-border] bg-[--color-surface-800] shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-border]">
              <span className="text-xs font-semibold text-[--color-text-primary]">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-semibold text-brand-400 hover:underline flex items-center gap-1"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-[--color-text-muted]">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-[--color-border]/50 last:border-b-0 ${
                      n.is_read ? 'opacity-60' : 'bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${typeColor[n.type] ?? 'text-[--color-text-primary]'}`}>
                        {n.title}
                      </p>
                      <span className="text-[9px] text-[--color-text-muted] flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-[--color-text-secondary] mt-0.5 leading-snug">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
