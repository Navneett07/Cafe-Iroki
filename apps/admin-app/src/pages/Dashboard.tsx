import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  DollarSign, ShoppingBag, Calendar, Users,
  TrendingUp, Clock, Star, AlertTriangle
} from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { KPICard } from '../components/ui/KPICard';
import { OrderStatusBadge } from '../components/ui/StatusBadge';
import { CardSkeleton, ErrorState } from '../components/ui/States';
import { formatCurrency, formatRelativeTime } from '@shared/utils/formatters';
import type { DashboardStats, RevenueDataPoint, Order } from '@shared/types/index';

// ─── Data Fetchers ─────────────────────────────────────────────────────────────

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();

  const [ordersRes, todayRes, weekRes, monthRes, reservationsRes, customersRes, reviewsRes, menuRes] = await Promise.all([
    supabase.from('orders').select('id, total, order_status').neq('order_status', 'cancelled'),
    supabase.from('orders').select('total').gte('created_at', today + 'T00:00:00'),
    supabase.from('orders').select('total').gte('created_at', weekAgo),
    supabase.from('orders').select('total').gte('created_at', monthAgo),
    supabase.from('reservations').select('id').eq('date', today),
    supabase.from('profiles').select('id').eq('role', 'customer'),
    supabase.from('reviews').select('id').eq('status', 'pending'),
    supabase.from('menu_items').select('id, stock').lt('stock', 5),
  ]);

  const totalOrders = ordersRes.data?.length ?? 0;
  const activeOrders = ordersRes.data?.filter(o =>
    ['received', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(o.order_status)
  ).length ?? 0;
  const allTotal = ordersRes.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;

  return {
    todayRevenue: todayRes.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
    weeklyRevenue: weekRes.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
    monthlyRevenue: monthRes.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
    totalOrders,
    activeOrders,
    reservationsToday: reservationsRes.data?.length ?? 0,
    totalCustomers: customersRes.data?.length ?? 0,
    avgOrderValue: totalOrders > 0 ? allTotal / totalOrders : 0,
    pendingReviews: reviewsRes.data?.length ?? 0,
    lowStockCount: menuRes.data?.length ?? 0,
  };
};

const fetchRevenueChart = async (): Promise<RevenueDataPoint[]> => {
  const { data } = await supabase
    .from('orders')
    .select('created_at, total')
    .gte('created_at', new Date(Date.now() - 14 * 864e5).toISOString())
    .neq('payment_status', 'failed')
    .order('created_at');

  const grouped: Record<string, { revenue: number; orders: number }> = {};
  (data ?? []).forEach(o => {
    const day = o.created_at.split('T')[0];
    if (!grouped[day]) grouped[day] = { revenue: 0, orders: 0 };
    grouped[day].revenue += Number(o.total);
    grouped[day].orders += 1;
  });

  return Object.entries(grouped).map(([date, v]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: v.revenue,
    orders: v.orders,
  }));
};

const fetchRecentOrders = async (): Promise<Order[]> => {
  const { data } = await supabase
    .from('orders')
    .select('id, total, order_status, payment_status, payment_method, created_at, delivery_address')
    .order('created_at', { ascending: false })
    .limit(8);

  return (data ?? []).map((o): Order => ({
    id: o.id,
    items: [],
    subtotal: 0,
    discount: 0,
    gst: 0,
    deliveryCharge: 0,
    total: Number(o.total),
    deliveryAddress: o.delivery_address ?? {},
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    orderStatus: o.order_status,
    createdAt: o.created_at,
  }));
};

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const ChartTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[--color-surface-700] border border-[--color-border] rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-[--color-text-muted] mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-[--color-text-primary] font-medium">
          {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const statsQ = useQuery({ queryKey: ['dashboard-stats'], queryFn: fetchDashboardStats, refetchInterval: 30000 });
  const revenueQ = useQuery({ queryKey: ['revenue-chart'], queryFn: fetchRevenueChart, refetchInterval: 60000 });
  const ordersQ = useQuery({ queryKey: ['recent-orders-dashboard'], queryFn: fetchRecentOrders, refetchInterval: 15000 });

  const stats = statsQ.data;
  const chartData = revenueQ.data ?? [];

  const pieData = useMemo(() => [
    { name: 'UPI', value: 45 },
    { name: 'Card', value: 30 },
    { name: 'COD', value: 25 },
  ], []);
  const PIE_COLORS = ['#ec6617', '#f08338', '#f6ae70'];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* KPI Cards */}
        {statsQ.isLoading ? (
          <CardSkeleton count={8} />
        ) : statsQ.isError ? (
          <ErrorState message="Failed to load dashboard stats" onRetry={() => statsQ.refetch()} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <KPICard title="Today's Revenue" value={stats?.todayRevenue ?? 0} icon={DollarSign} isCurrency iconColor="text-emerald-400" />
            <KPICard title="Weekly Revenue" value={stats?.weeklyRevenue ?? 0} icon={TrendingUp} isCurrency iconColor="text-blue-400" />
            <KPICard title="Monthly Revenue" value={stats?.monthlyRevenue ?? 0} icon={DollarSign} isCurrency iconColor="text-purple-400" />
            <KPICard title="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingBag} iconColor="text-orange-400" />
            <KPICard title="Active Orders" value={stats?.activeOrders ?? 0} icon={Clock} iconColor="text-yellow-400" subtitle="In kitchen or delivery" />
            <KPICard title="Reservations Today" value={stats?.reservationsToday ?? 0} icon={Calendar} iconColor="text-cyan-400" />
            <KPICard title="Total Customers" value={stats?.totalCustomers ?? 0} icon={Users} iconColor="text-pink-400" />
            <KPICard title="Avg Order Value" value={stats?.avgOrderValue ?? 0} icon={TrendingUp} isCurrency iconColor="text-indigo-400" />
          </div>
        )}

        {/* Alerts */}
        {stats && (stats.pendingReviews > 0 || stats.lowStockCount > 0) && (
          <div className="flex flex-wrap gap-3">
            {stats.pendingReviews > 0 && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
                <Star size={15} />
                <span>{stats.pendingReviews} reviews pending approval</span>
              </div>
            )}
            {stats.lowStockCount > 0 && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                <AlertTriangle size={15} />
                <span>{stats.lowStockCount} items have low stock</span>
              </div>
            )}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-[--color-text-primary] text-sm">Revenue Overview</h3>
                <p className="text-xs text-[--color-text-muted]">Last 14 days</p>
              </div>
            </div>
            {revenueQ.isLoading ? (
              <div className="h-48 skeleton rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec6617" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec6617" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#5c5c72', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5c5c72', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#ec6617" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Method Pie */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-[--color-text-primary] text-sm mb-1">Payment Methods</h3>
            <p className="text-xs text-[--color-text-muted] mb-5">Distribution</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} innerRadius={40} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-[--color-text-secondary]">{d.name}</span>
                  </div>
                  <span className="font-medium text-[--color-text-primary]">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Bar Chart + Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Orders */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-[--color-text-primary] text-sm mb-1">Daily Orders</h3>
            <p className="text-xs text-[--color-text-muted] mb-5">Last 14 days volume</p>
            {revenueQ.isLoading ? (
              <div className="h-40 skeleton rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#5c5c72', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5c5c72', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="orders" fill="#ec6617" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent Orders Live Feed */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[--color-text-primary] text-sm">Live Order Feed</h3>
                <p className="text-xs text-[--color-text-muted]">Auto-refreshes every 15s</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </div>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[220px]">
              {ordersQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 py-2">
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-3 flex-1" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                ))
              ) : (ordersQ.data ?? []).map(order => (
                <div key={order.id} className="flex items-center gap-3 py-2 border-b border-[--color-border]/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[--color-text-muted] truncate">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-[--color-text-secondary]">{formatRelativeTime(order.createdAt)}</p>
                  </div>
                  <OrderStatusBadge status={order.orderStatus} />
                  <p className="text-xs font-semibold text-[--color-text-primary] whitespace-nowrap">{formatCurrency(order.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
