import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Send } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { useRealtimeInvalidate } from '../hooks/useRealtimeInvalidate';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button, Input, Textarea } from '../components/ui/Form';
import { EmptyState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '@shared/utils/formatters';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'offer' | 'alert';
  created_at: string;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return []; // graceful if table doesn't exist
  return data ?? [];
};

const NotificationTypeColor: Record<string, string> = {
  announcement: 'text-blue-400 bg-blue-400/10',
  offer: 'text-emerald-400 bg-emerald-400/10',
  alert: 'text-red-400 bg-red-400/10',
};

const Notifications: React.FC = () => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'announcement' | 'offer' | 'alert'>('announcement');
  const [sending, setSending] = useState(false);

  const { data: notifications, refetch } = useQuery({ queryKey: ['notifications-admin'], queryFn: fetchNotifications });

  // Live sent-history feed.
  useRealtimeInvalidate({
    channel: 'admin-notifications-page-live',
    tables: ['notifications'],
    queryKeys: [['notifications-admin']],
  });

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      showToast('Title and message are required', 'warning');
      return;
    }
    setSending(true);
    try {
      // audience 'all' => delivered to every customer's realtime notification feed
      const { error } = await supabase.from('notifications').insert({ title, message, type, audience: 'all' });
      if (error) throw error;
      showToast('Notification sent', 'success');
      setTitle(''); setMessage('');
      refetch();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout title="Notifications">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-[--color-text-primary] flex items-center gap-2"><Bell size={16} /> Broadcast Notification</h3>
          <div className="flex gap-2">
            {(['announcement', 'offer', 'alert'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${type === t ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-[--color-text-secondary] hover:bg-white/5'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="🎉 New offer available!" />
          <Textarea label="Message" value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Your message here..." />
          <Button onClick={sendNotification} loading={sending} icon={<Send size={14} />} className="w-full">Send Notification</Button>
        </div>

        {/* History */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-[--color-text-primary] mb-4">Sent History</h3>
          {!notifications?.length ? (
            <EmptyState title="No notifications sent yet" icon={<Bell size={32} />} />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="p-3 bg-white/3 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${NotificationTypeColor[n.type] ?? 'text-zinc-400 bg-zinc-400/10'}`}>{n.type}</span>
                    <span className="text-[10px] text-[--color-text-muted]">{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="text-xs font-semibold text-[--color-text-primary]">{n.title}</p>
                  <p className="text-xs text-[--color-text-secondary] mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Notifications;
