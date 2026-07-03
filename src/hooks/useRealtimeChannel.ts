import { useEffect, useRef } from 'react';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeChannelOptions {
  /** Stable, unique channel name. Duplicate names are de-duplicated automatically. */
  channel: string;
  /** Table to watch in the public schema. */
  table: string;
  /** Postgres change event(s) to listen for. Defaults to '*'. */
  event?: ChangeEvent;
  /** Optional server-side row filter, e.g. `user_id=eq.<uuid>`. */
  filter?: string;
  /** Invoked for every authorized change (RLS applies at the server). */
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  /** Invoked once the socket (re)connects, and again after the browser comes back online. */
  onResync?: () => void;
  /** When false the subscription is torn down (e.g. user logged out). Defaults to true. */
  enabled?: boolean;
}

/**
 * Production-grade wrapper around a single Supabase Realtime channel.
 *
 * Guarantees:
 *  - Exactly one active channel per (channel name) — removes any stale channel
 *    with the same name before subscribing, so React Strict Mode double-invokes
 *    and hot reloads never leak duplicate listeners.
 *  - Automatic cleanup on unmount / dependency change.
 *  - Reconnect + offline handling: a `CHANNEL_ERROR`/`TIMED_OUT` triggers a
 *    bounded backoff rejoin, and `window`'s `online` event forces a resync so
 *    data missed while offline is refetched.
 *  - RLS is always respected: the server only streams rows the authenticated
 *    session is allowed to SELECT. No Service Role key is ever involved.
 */
export function useRealtimeChannel(options: RealtimeChannelOptions): void {
  const { channel, table, event = '*', filter, enabled = true } = options;

  // Keep the latest callbacks in refs so identity changes don't resubscribe.
  const onChangeRef = useRef(options.onChange);
  const onResyncRef = useRef(options.onResync);
  onChangeRef.current = options.onChange;
  onResyncRef.current = options.onResync;

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let ch: RealtimeChannel | undefined;

    const subscribe = () => {
      if (!active) return;

      // Remove any lingering channel with the same name (prevents duplicates).
      for (const existing of supabase.getChannels()) {
        if (existing.topic === `realtime:${channel}`) {
          supabase.removeChannel(existing);
        }
      }

      const changeFilter = {
        event,
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      };

      ch = supabase
        .channel(channel)
        .on(
          'postgres_changes',
          changeFilter as never,
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            onChangeRef.current(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            retry = 0;
            onResyncRef.current?.();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Bounded exponential backoff rejoin (max ~10s).
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
      onResyncRef.current?.();
      // Force a fresh channel so we don't rely on a half-dead socket.
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
  }, [channel, table, event, filter, enabled]);
}
