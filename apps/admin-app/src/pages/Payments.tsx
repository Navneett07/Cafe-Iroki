import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button, Select } from '../components/ui/Form';
import { TableSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import { PaymentStatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';
import { useToast } from '../context/ToastContext';
import type { PaymentTransaction } from '@shared/types/index';

const fetchTransactions = async (status: string): Promise<PaymentTransaction[]> => {
  let q = supabase
    .from('orders')
    .select('id, user_id, total, payment_method, payment_status, payment_id, razorpay_order_id, razorpay_refund_id, order_status, created_at, delivery_address')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status !== 'all') q = q.eq('payment_status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(o => ({
    id: o.id, orderId: o.id, userId: o.user_id,
    customerName: o.delivery_address?.fullName,
    amount: Number(o.total), method: o.payment_method,
    status: o.payment_status, paymentId: o.payment_id,
    razorpayOrderId: o.razorpay_order_id, refundId: o.razorpay_refund_id,
    createdAt: o.created_at,
  }));
};

const initiateRefund = async ({ orderId, amount }: { orderId: string; amount?: number }) => {
  const { data, error } = await supabase.functions.invoke('payments', {
    body: { action: 'refund', orderId, amount },
  });
  if (error || data?.error) throw new Error(error?.message || data?.error || 'Refund failed');
  return data;
};

const Payments: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: transactions, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions', statusFilter],
    queryFn: () => fetchTransactions(statusFilter),
    refetchInterval: 30000,
  });

  const { mutate: refund, isPending: refunding } = useMutation({
    mutationFn: initiateRefund,
    onSuccess: () => {
      showToast('Refund initiated successfully', 'success');
      qc.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedTx(null);
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const totalRevenue = transactions?.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0) ?? 0;
  const totalRefunded = transactions?.filter(t => t.status === 'refunded').reduce((s, t) => s + t.amount, 0) ?? 0;
  const pendingCount = transactions?.filter(t => t.status === 'pending').length ?? 0;

  return (
    <AdminLayout title="Payment Management">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-emerald-400' },
            { label: 'Total Refunded', value: formatCurrency(totalRefunded), color: 'text-orange-400' },
            { label: 'Pending Payments', value: String(pendingCount), color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <p className="text-xs text-[--color-text-muted] mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex gap-3">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="max-w-[160px]">
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </Select>
          <Button variant="secondary" size="sm" onClick={() => refetch()} icon={<RefreshCw size={14} />}>Refresh</Button>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !transactions?.length ? (
            <EmptyState title="No transactions found" icon={<CreditCard size={40} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    {['Order ID', 'Customer', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-[--color-border]/50 last:border-0">
                      <td className="px-4 py-3.5"><span className="font-mono text-xs text-brand-400">#{tx.id.slice(0, 8)}</span></td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-secondary]">{tx.customerName ?? '—'}</td>
                      <td className="px-4 py-3.5 font-semibold text-[--color-text-primary]">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3.5"><span className="uppercase text-xs text-[--color-text-secondary] font-medium">{tx.method}</span></td>
                      <td className="px-4 py-3.5"><PaymentStatusBadge status={tx.status} /></td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-secondary] whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        {tx.status === 'paid' && (
                          <Button variant="danger" size="sm" onClick={() => { setSelectedTx(tx); setRefundAmount(''); }}>Refund</Button>
                        )}
                        {tx.refundId && <span className="text-[10px] font-mono text-orange-400">Refund ID: {tx.refundId.slice(0, 8)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refund Modal */}
        <Modal open={!!selectedTx} onClose={() => setSelectedTx(null)} title="Initiate Refund" size="sm">
          {selectedTx && (
            <div className="space-y-4">
              <div className="bg-white/3 rounded-xl p-3">
                <p className="text-xs text-[--color-text-muted]">Order</p>
                <p className="text-sm font-mono text-brand-400">#{selectedTx.id.slice(0, 8)}</p>
                <p className="text-xs text-[--color-text-secondary] mt-1">Max refundable: {formatCurrency(selectedTx.amount)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                  Refund Amount (leave blank for full refund)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder={String(selectedTx.amount)}
                  max={selectedTx.amount}
                  className="w-full bg-[--color-surface-700] border border-[--color-border] rounded-[--radius-btn] px-3 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-brand-500/60 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  loading={refunding}
                  className="flex-1"
                  onClick={() => refund({ orderId: selectedTx.id, amount: refundAmount ? Number(refundAmount) : undefined })}
                >
                  Confirm Refund
                </Button>
                <Button variant="secondary" onClick={() => setSelectedTx(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Payments;
