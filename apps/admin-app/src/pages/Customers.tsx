import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, ShoppingBag } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Input } from '../components/ui/Form';
import { TableSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';
import type { Profile, Order } from '@shared/types/index';

interface CustomerWithStats extends Profile {
  orderCount: number;
  totalSpend: number;
  lastOrderAt?: string;
}

const fetchCustomers = async (search: string): Promise<CustomerWithStats[]> => {
  let q = supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }).limit(100);
  if (search.trim()) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;

  const profiles = data ?? [];
  const ids = profiles.map(p => p.id);

  const { data: orderData } = await supabase
    .from('orders')
    .select('user_id, total, created_at')
    .in('user_id', ids)
    .neq('payment_status', 'failed');

  const statsMap: Record<string, { count: number; total: number; lastAt: string }> = {};
  (orderData ?? []).forEach(o => {
    if (!statsMap[o.user_id]) statsMap[o.user_id] = { count: 0, total: 0, lastAt: '' };
    statsMap[o.user_id].count++;
    statsMap[o.user_id].total += Number(o.total);
    if (!statsMap[o.user_id].lastAt || o.created_at > statsMap[o.user_id].lastAt) {
      statsMap[o.user_id].lastAt = o.created_at;
    }
  });

  return profiles.map(p => ({
    id: p.id,
    email: p.email ?? '',
    fullName: p.full_name,
    phone: p.phone,
    avatarUrl: p.avatar_url,
    role: 'customer',
    createdAt: p.created_at,
    orderCount: statsMap[p.id]?.count ?? 0,
    totalSpend: statsMap[p.id]?.total ?? 0,
    lastOrderAt: statsMap[p.id]?.lastAt,
  }));
};

const fetchCustomerOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map(o => ({
    id: o.id, items: [], subtotal: Number(o.subtotal), discount: Number(o.discount),
    gst: Number(o.gst), deliveryCharge: Number(o.delivery_charge), total: Number(o.total),
    deliveryAddress: o.delivery_address ?? {}, paymentMethod: o.payment_method,
    paymentStatus: o.payment_status, orderStatus: o.order_status, createdAt: o.created_at,
  }));
};

const Customers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CustomerWithStats | null>(null);

  const { data: customers, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: () => fetchCustomers(search),
  });

  const { data: customerOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', selected?.id],
    queryFn: () => fetchCustomerOrders(selected!.id),
    enabled: !!selected,
  });

  return (
    <AdminLayout title="Customer Management">
      <div className="space-y-4">
        <div className="flex gap-3">
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} prefix={<Search size={15} />} className="max-w-sm" />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !customers?.length ? (
            <EmptyState title="No customers found" icon={<Users size={40} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    {['Customer', 'Contact', 'Orders', 'Total Spent', 'Last Order', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="border-b border-[--color-border]/50 last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                            {c.fullName?.charAt(0) ?? c.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[--color-text-primary]">{c.fullName ?? '—'}</p>
                            <p className="text-[10px] text-[--color-text-muted] font-mono">{c.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-[--color-text-secondary]">{c.email}</p>
                        <p className="text-xs text-[--color-text-muted]">{c.phone ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-sm font-bold text-[--color-text-primary]">{c.orderCount}</span></td>
                      <td className="px-4 py-3.5"><span className="text-sm font-semibold text-emerald-400">{formatCurrency(c.totalSpend)}</span></td>
                      <td className="px-4 py-3.5 text-xs text-[--color-text-secondary] whitespace-nowrap">{c.lastOrderAt ? formatDateTime(c.lastOrderAt) : '—'}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setSelected(c)} className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                          <ShoppingBag size={13} /> View Orders
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal open={!!selected} onClose={() => setSelected(null)} title={`${selected?.fullName ?? selected?.email} – Orders`} size="lg">
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-[--color-text-primary]">{selected.orderCount}</p>
                  <p className="text-xs text-[--color-text-muted]">Total Orders</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(selected.totalSpend)}</p>
                  <p className="text-xs text-[--color-text-muted]">Total Spent</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-brand-400">{selected.orderCount > 0 ? formatCurrency(selected.totalSpend / selected.orderCount) : '₹0'}</p>
                  <p className="text-xs text-[--color-text-muted]">Avg Order</p>
                </div>
              </div>
              {ordersLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
              ) : (customerOrders ?? []).map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                  <div>
                    <p className="text-xs font-mono text-brand-400">#{order.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-[--color-text-muted]">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[--color-text-primary]">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-[--color-text-muted] capitalize">{order.orderStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Customers;
