import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useRealtimeChannel } from '../hooks/useRealtimeChannel';
import type { AppNotification } from '../types';

interface NotificationContextProps {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const mapRow = (row: Record<string, unknown>): AppNotification => ({
  id: String(row.id),
  title: String(row.title ?? ''),
  message: String(row.message ?? ''),
  type: String(row.type ?? 'info'),
  isRead: Boolean(row.is_read),
  audience: (row.audience as AppNotification['audience']) ?? 'user',
  createdAt: String(row.created_at ?? ''),
});

const MAX_FEED = 50;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // RLS restricts this to the user's own notifications + public ('all') promos.
  const load = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_FEED);
    if (!error && data) {
      setNotifications(data.map(mapRow));
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: server only streams rows this session may SELECT (RLS enforced).
  useRealtimeChannel({
    channel: user ? `notifications-user-${user.id}` : 'notifications-anon',
    table: 'notifications',
    event: 'INSERT',
    enabled: !!user,
    onResync: load,
    onChange: (payload) => {
      const incoming = mapRow(payload.new as Record<string, unknown>);
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev; // de-dupe
        return [incoming, ...prev].slice(0, MAX_FEED);
      });
      showToast(`${incoming.title}: ${incoming.message}`, 'info', 6000);
    },
  });

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    // Only user-owned rows are writable under RLS; ignore failures on public promos.
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadOwned = notifications.filter((n) => !n.isRead && n.audience === 'user').map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (unreadOwned.length && user) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadOwned);
    }
  }, [notifications, user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, markRead, refresh: load }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
