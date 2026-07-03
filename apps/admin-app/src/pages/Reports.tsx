import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Download } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/ui/Form';
import { CardSkeleton, ErrorState } from '../components/ui/States';
import { formatCurrency } from '@shared/utils/formatters';

const fetchSalesData = async (days: number) => {
  const from = new Date(Date.now() - days * 864e5).toISOString();
  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total, order_items(name, quantity, price)')
    .gte('created_at', from)
    .neq('payment_status', 'failed')
    .order('created_at');
  if (error) throw error;

  const grouped: Record<string, { revenue: number; orders: number }> = {};
  (data ?? []).forEach(o => {
    const day = o.created_at.split('T')[0];
    if (!grouped[day]) grouped[day] = { revenue: 0, orders: 0 };
    grouped[day].revenue += Number(o.total);
    grouped[day].orders += 1;
  });

  const totalRevenue = Object.values(grouped).reduce((s, v) => s + v.revenue, 0);
  const totalOrders = Object.values(grouped).reduce((s, v) => s + v.orders, 0);

  // Top items
  const itemMap: Record<string, { qty: number; revenue: number }> = {};
  (data ?? []).forEach(o => {
    (o.order_items as Array<{ name: string; quantity: number; price: number }>).forEach(it => {
      if (!itemMap[it.name]) itemMap[it.name] = { qty: 0, revenue: 0 };
      itemMap[it.name].qty += it.quantity;
      itemMap[it.name].revenue += Number(it.price) * it.quantity;
    });
  });
  const topItems = Object.entries(itemMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 10)
    .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }));

  const chartData = Object.entries(grouped).map(([date, v]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: v.revenue, orders: v.orders,
  }));

  return { totalRevenue, totalOrders, avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0, chartData, topItems };
};

const exportCSV = (data: Array<Record<string, unknown>>, filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const Reports: React.FC = () => {
  const [days, setDays] = React.useState(30);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', days],
    queryFn: () => fetchSalesData(days),
  });

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${days === d ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-[--color-text-secondary] hover:bg-white/5'}`}
            >
              {d}d
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => data && exportCSV(data.chartData, `revenue-${days}d`)}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <CardSkeleton count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Revenue', value: formatCurrency(data?.totalRevenue ?? 0), color: 'text-emerald-400' },
                { label: 'Total Orders', value: String(data?.totalOrders ?? 0), color: 'text-blue-400' },
                { label: 'Avg Order Value', value: formatCurrency(data?.avgOrder ?? 0), color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="glass rounded-2xl p-5">
                  <p className="text-xs text-[--color-text-muted] mb-1">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-[--color-text-muted] mt-1">Last {days} days</p>
                </div>
              ))}
            </div>

            {/* Revenue Chart */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-[--color-text-primary] text-sm mb-5">Revenue Trend – Last {days} Days</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data?.chartData ?? []}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec6617" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec6617" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#5c5c72', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5c5c72', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#ec6617" strokeWidth={2} fill="url(#grad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[--color-text-primary] text-sm">Top Selling Products</h3>
                <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={() => data && exportCSV(data.topItems, 'top-products')}>Export</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[--color-border]">
                      <th className="text-left py-2 text-xs font-semibold text-[--color-text-muted] uppercase">#</th>
                      <th className="text-left py-2 text-xs font-semibold text-[--color-text-muted] uppercase">Product</th>
                      <th className="text-right py-2 text-xs font-semibold text-[--color-text-muted] uppercase">Qty Sold</th>
                      <th className="text-right py-2 text-xs font-semibold text-[--color-text-muted] uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topItems ?? []).map((item, i) => (
                      <tr key={item.name} className="border-b border-[--color-border]/40 last:border-0">
                        <td className="py-3 text-xs text-[--color-text-muted] w-8">{i + 1}</td>
                        <td className="py-3 text-sm font-medium text-[--color-text-primary]">{item.name}</td>
                        <td className="py-3 text-right text-sm text-blue-400 font-bold">{item.qty}</td>
                        <td className="py-3 text-right text-sm text-emerald-400 font-semibold">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
