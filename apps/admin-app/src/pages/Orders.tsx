import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, Eye, Printer } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/ui/StatusBadge';
import { Button, Input, Select } from '../components/ui/Form';
import { TableSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';
import { useToast } from '../context/ToastContext';
import type { Order } from '@shared/types/index';

type OrderStatus = Order['orderStatus'];
const ALL_STATUSES: OrderStatus[] = ['received','confirmed','preparing','ready','out-for-delivery','delivered','cancelled','refunded'];

const fetchOrders = async (status: string, search: string): Promise<Order[]> => {
  let q = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') q = q.eq('order_status', status);
  if (search.trim()) q = q.ilike('id', `%${search}%`);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((o): Order => ({
    id: o.id,
    items: (o.order_items ?? []).map((it: { menu_item_id: string; name: string; price: number; quantity: number }) => ({
      menuItemId: it.menu_item_id,
      name: it.name,
      price: Number(it.price),
      quantity: it.quantity,
    })),
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    gst: Number(o.gst),
    deliveryCharge: Number(o.delivery_charge),
    total: Number(o.total),
    deliveryAddress: o.delivery_address ?? {},
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    orderStatus: o.order_status,
    paymentId: o.payment_id,
    razorpayOrderId: o.razorpay_order_id,
    razorpayRefundId: o.razorpay_refund_id,
    createdAt: o.created_at,
  }));
};

const updateStatus = async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
  const { error } = await supabase.functions.invoke('admin-orders', {
    body: { action: status === 'refunded' ? 'refund' : 'update_status', orderId, status },
  });
  if (error) throw error;
};

const Orders: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter, search],
    queryFn: () => fetchOrders(statusFilter, search),
    refetchInterval: 20000,
  });

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      showToast('Order status updated', 'success');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const printInvoice = async (order: Order) => {
    try {
      const { data } = await supabase.functions.invoke(`invoice?orderId=${order.id}`, { method: 'GET' });
      if (data?.invoice) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<pre style="font-family:monospace;padding:2rem;white-space:pre-wrap">${data.invoice}</pre>`);
          win.print();
          win.close();
        }
      }
    } catch {
      showToast('Failed to fetch invoice', 'error');
    }
  };

  return (
    <AdminLayout title="Order Management">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Search size={15} />}
            className="max-w-xs"
          />
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="max-w-[180px]"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={() => refetch()} icon={<RefreshCw size={14} />}>Refresh</Button>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !orders?.length ? (
            <EmptyState title="No orders found" description="Orders will appear here as customers place them." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    {['Order ID', 'Customer', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-[--color-border]/50 last:border-0">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-brand-400">#{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[--color-text-primary] font-medium text-xs">{order.deliveryAddress?.fullName ?? '—'}</p>
                        <p className="text-[--color-text-muted] text-xs">{order.deliveryAddress?.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[--color-text-primary]">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3.5"><PaymentStatusBadge status={order.paymentStatus} /></td>
                      <td className="px-4 py-3.5"><OrderStatusBadge status={order.orderStatus} /></td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-secondary] whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} icon={<Eye size={13} />}>View</Button>
                          <Button variant="ghost" size="sm" onClick={() => printInvoice(order)} icon={<Printer size={13} />}>Invoice</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.id.slice(0, 8)}`} size="lg">
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[--color-text-muted] mb-1">Customer</p>
                  <p className="text-sm font-medium text-[--color-text-primary]">{selectedOrder.deliveryAddress?.fullName}</p>
                  <p className="text-xs text-[--color-text-secondary]">{selectedOrder.deliveryAddress?.phone}</p>
                  <p className="text-xs text-[--color-text-secondary] mt-0.5">{selectedOrder.deliveryAddress?.street}</p>
                </div>
                <div>
                  <p className="text-xs text-[--color-text-muted] mb-1">Payment</p>
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                  {selectedOrder.paymentId && <p className="text-xs text-[--color-text-muted] mt-1 font-mono">{selectedOrder.paymentId}</p>}
                </div>
              </div>

              <div className="border-t border-[--color-border] pt-4">
                <p className="text-xs text-[--color-text-muted] mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map(it => (
                    <div key={it.menuItemId} className="flex justify-between text-sm">
                      <span className="text-[--color-text-secondary]">{it.quantity}× {it.name}</span>
                      <span className="font-medium text-[--color-text-primary]">{formatCurrency(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[--color-border] mt-3 pt-3 space-y-1 text-xs text-[--color-text-secondary]">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>
                  <div className="flex justify-between"><span>GST (5%)</span><span>{formatCurrency(selectedOrder.gst)}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>{formatCurrency(selectedOrder.deliveryCharge)}</span></div>
                  <div className="flex justify-between font-bold text-sm text-[--color-text-primary] pt-1 border-t border-[--color-border]">
                    <span>Total</span><span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[--color-border] pt-4">
                <p className="text-xs text-[--color-text-muted] mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.filter(s => s !== selectedOrder.orderStatus).map(s => (
                    <Button
                      key={s}
                      variant={s === 'refunded' || s === 'cancelled' ? 'danger' : 'secondary'}
                      size="sm"
                      loading={isPending}
                      onClick={() => changeStatus({ orderId: selectedOrder.id, status: s })}
                    >
                      → {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Orders;
