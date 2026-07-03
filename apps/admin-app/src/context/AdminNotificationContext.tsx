import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import { useAdminAuth } from './AdminAuthContext';
import { useToast } from './ToastContext';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  audience: string;
  created_at: string;
}

interface AdminNotificationContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextValue | null>(null);

const MAX_FEED = 50;

export const AdminNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAdminAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // RLS returns staff ('admin') + public ('all') notifications for admins.
  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setNotifications([]);
      return;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .in('audience', ['admin', 'all'])
      .order('created_at', { ascending: false })
      .limit(MAX_FEED);
    if (!error && data) setNotifications(data as AdminNotification[]);
  }, [isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime INSERT stream (RLS-filtered) with reconnect + online resync.
  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let ch: RealtimeChannel | undefined;
    const topic = 'admin-notifications-feed';

    const handleInsert = (row: AdminNotification) => {
      if (row.audience !== 'admin' && row.audience !== 'all') return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === row.id)) return prev;
        return [row, ...prev].slice(0, MAX_FEED);
      });
      showToastRef.current(`${row.title}: ${row.message}`, 'info');
    };

    const subscribe = () => {
      if (!active) return;
      for (const existing of supabase.getChannels()) {
        if (existing.topic === `realtime:${topic}`) supabase.removeChannel(existing);
      }
      ch = supabase
        .channel(topic)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' } as never,
          (payload: { new: AdminNotification }) => handleInsert(payload.new)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            retry = 0;
            refresh();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (!active) return;
            const delay = Math.min(1000 * 2 ** retry, 10_000);
            retry += 1;
            clearTimeout(retryTimer);
            retryTimer = setTimeout(() => {
              if (ch) supabase.removeChannel(ch);
              subscribe();
            }, delay);
          }
        });
    };

    const handleOnline = () => {
      refresh();
      if (ch) supabase.removeChannel(ch);
      subscribe();
    };

    subscribe();
    window.addEventListener('online', handleOnline);

    return () => {
      active = false;
      clearTimeout(retryTimer);
      window.removeEventListener('online', handleOnline);
      if (ch) supabase.removeChannel(ch);
    };
  }, [isAdmin, refresh]);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (unreadIds.length) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AdminNotificationContext.Provider value={{ notifications, unreadCount, markAllRead, refresh }}>
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const ctx = useContext(AdminNotificationContext);
  if (!ctx) throw new Error('useAdminNotifications must be used inside AdminNotificationProvider');
  return ctx;
};
