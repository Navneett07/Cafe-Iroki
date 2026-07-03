import { useEffect, useRef } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';

export interface RealtimeInvalidateConfig {
  /** Stable, unique channel name (de-duplicated automatically). */
  channel: string;
  /** Tables to watch in the public schema. */
  tables: string[];
  /** React Query keys to invalidate (prefix match) whenever a watched table changes. */
  queryKeys: QueryKey[];
  /** Optional callback for each change (e.g. surface a toast). */
  onEvent?: (table: string) => void;
  /** When false the subscription is torn down. Defaults to true. */
  enabled?: boolean;
}

/**
 * Bridges Supabase Realtime -> React Query cache invalidation for the admin app.
 *
 * A single channel watches every requested table; any change invalidates the
 * supplied query keys so `useQuery` refetches with fresh data. RLS is honoured
 * (admins may SELECT all rows). Includes reconnect backoff, `online` resync,
 * and strict single-channel-per-name de-duplication.
 */
export function useRealtimeInvalidate(config: RealtimeInvalidateConfig): void {
  const { channel, tables, queryKeys, enabled = true } = config;
  const qc = useQueryClient();

  const onEventRef = useRef(config.onEvent);
  onEventRef.current = config.onEvent;

  // Stable primitive deps so we don't resubscribe on every render.
  const tablesKey = tables.join(',');
  const keysKey = JSON.stringify(queryKeys);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let ch: RealtimeChannel | undefined;

    const invalidateAll = () => {
      for (const key of queryKeys) {
        qc.invalidateQueries({ queryKey: key });
      }
    };

    const subscribe = () => {
      if (!active) return;

      for (const existing of supabase.getChannels()) {
        if (existing.topic === `realtime:${channel}`) {
          supabase.removeChannel(existing);
        }
      }

      let builder = supabase.channel(channel);
      for (const table of tables) {
        builder = builder.on(
          'postgres_changes',
          { event: '*', schema: 'public', table } as never,
          () => {
            invalidateAll();
            onEventRef.current?.(table);
          }
        );
      }

      ch = builder.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          retry = 0;
          invalidateAll();
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
      invalidateAll();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, tablesKey, keysKey, enabled, qc]);
}
