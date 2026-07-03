import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/ui/Form';
import { TableSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import { formatDateTime } from '@shared/utils/formatters';

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  created_at: string;
  admin_email?: string;
}

const fetchAuditLogs = async (): Promise<AuditEntry[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
};

const actionColor = (action: string) => {
  if (action.includes('delete') || action.includes('cancel') || action.includes('refund')) return 'text-red-400 bg-red-400/10';
  if (action.includes('create') || action.includes('approve') || action.includes('confirm')) return 'text-emerald-400 bg-emerald-400/10';
  if (action.includes('update') || action.includes('edit') || action.includes('upload')) return 'text-blue-400 bg-blue-400/10';
  return 'text-zinc-400 bg-zinc-400/10';
};

const AuditLogs: React.FC = () => {
  const { data: logs, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: fetchAuditLogs,
    refetchInterval: 60000,
  });

  return (
    <AdminLayout title="Audit Logs">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => refetch()} icon={<RefreshCw size={14} />}>Refresh</Button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={10} cols={5} />
          ) : isError ? (
            <ErrorState message="Audit log table may not exist yet. Run the SQL migration to create it." onRetry={() => refetch()} />
          ) : !logs?.length ? (
            <EmptyState title="No audit logs" icon={<Shield size={40} />} description="Admin actions will be logged here once the audit_logs table is created." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    {['Timestamp', 'Admin', 'Action', 'Resource', 'Resource ID'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-[--color-border]/50 last:border-0">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-[--color-text-secondary]">{formatDateTime(log.created_at)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-[--color-text-muted]">{log.admin_email ?? log.admin_id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-xs text-[--color-text-secondary] capitalize">{log.resource_type}</span></td>
                      <td className="px-4 py-3.5"><span className="text-xs font-mono text-[--color-text-muted]">{log.resource_id?.slice(0, 8) ?? '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
