import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabaseClient';
import { orderService } from '../../services/orderService';
import { reservationService } from '../../services/reservationService';
import { menuService } from '../../services/menuService';
import type { Order, Reservation, MenuItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/Animation/Reveal';
import { 
  Lock, 
  BarChart3, 
  ShoppingBag, 
  Calendar, 
  CheckCircle, 
  LogOut
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid admin email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormInput = z.infer<typeof loginSchema>;

export const Admin: React.FC = () => {
  const { login, logout, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'reservations' | 'menu'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load backend stores data
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const loadDashboardData = async () => {
      setDataLoading(true);
      try {
        const [ordList, resList, mList] = await Promise.all([
          orderService.getOrders(),
          reservationService.getReservations(),
          menuService.getMenuItems(),
        ]);
        setOrders(ordList);
        setReservations(resList);
        setMenuItems(mList);
      } catch (err) {
        console.error(err);
        showToast('Failed to load dashboard statistics.', 'error');
      } finally {
        setDataLoading(false);
      }
    };

    loadDashboardData();

    // Subscribe to Postgres mutations in realtime
    const ordersSubscription = supabase
      .channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        try {
          const ordList = await orderService.getOrders();
          setOrders(ordList);
        } catch (err) {
          console.error('Realtime orders sync error', err);
        }
      })
      .subscribe();

    const reservationsSubscription = supabase
      .channel('admin-reservations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, async () => {
        try {
          const resList = await reservationService.getReservations();
          setReservations(resList);
        } catch (err) {
          console.error('Realtime reservations sync error', err);
        }
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      reservationsSubscription.unsubscribe();
    };
  }, [isAuthenticated, isAdmin, showToast]);

  // Login Form
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
  });

  const onLoginSubmit = async (data: LoginFormInput) => {
    try {
      const loggedUser = await login(data.email, data.password);
      if (loggedUser.role !== 'admin') {
        await logout();
        showToast('Access Denied: Administrator privileges required.', 'error');
      } else {
        showToast('Logged in as administrator.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed.', 'error');
    }
  };

  // Order status action updater
  const handleUpdateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    setActionLoadingId(orderId);
    try {
      const res = await orderService.updateOrderStatus(orderId, status);
      if (res) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res : o)));
        showToast(`Order ${orderId} updated to: ${status}`, 'success');
      }
    } catch (err) {
      showToast('Failed to update status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reservation approval handler
  const handleUpdateResStatus = async (resId: string, status: Reservation['status']) => {
    setActionLoadingId(resId);
    try {
      const res = await reservationService.updateReservationStatus(resId, status);
      if (res) {
        setReservations((prev) => prev.map((r) => (r.id === resId ? res : r)));
        showToast(`Reservation status updated to: ${status}`, 'success');
      }
    } catch (err) {
      showToast('Failed to update reservation.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="pt-28 pb-24 bg-bg-primary min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render Login Card if not authenticated as Admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen flex items-center justify-center p-6">
        <Reveal direction="up" className="max-w-md w-full">
          <Card variant="premium" className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-3 bg-brand-primary/10 rounded-full text-brand-primary">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-serif font-bold">Admin Portal</h2>
              <p className="text-xs text-text-secondary">
                Please enter credentials to manage Cafe Iroki Nagpur store operations.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
              <Input
                label="Administrator Email"
                type="email"
                placeholder="admin@cafeiroki.com"
                error={loginErrors.email?.message}
                {...loginRegister('email')}
              />
              <Input
                label="Security Password"
                type="password"
                placeholder="••••••••"
                error={loginErrors.password?.message}
                {...loginRegister('password')}
              />
              <Button type="submit" variant="secondary" className="w-full bg-brand-primary">
                Unlock Dashboard
              </Button>
            </form>
          </Card>
        </Reveal>
      </div>
    );
  }

  // Dashboard Stats Calculations
  const totalRevenue = orders.reduce((acc, o) => acc + (o.orderStatus === 'delivered' ? o.total : 0), 0);
  const activeOrdersCount = orders.filter((o) => o.orderStatus !== 'delivered').length;
  const pendingReservationsCount = reservations.filter((r) => r.status === 'pending').length;

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-8">
        
        {/* Header Dashboard Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
              Operational Management
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight flex items-center gap-2">
              <span>Iroki Admin Dashboard</span>
              <span className="text-xs font-sans bg-green-500/10 text-green-600 border border-green-600/20 px-2 py-0.5 rounded font-bold">
                Live Store Link
              </span>
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white"
            onClick={async () => {
              await logout();
              showToast('Logged out of admin session.', 'info');
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Dynamic statistics row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card variant="premium" className="p-5 flex items-center gap-4">
            <div className="p-3 bg-brand-primary/10 rounded-full text-brand-primary">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Delivered Sales</p>
              <p className="text-lg font-serif font-black text-brand-primary">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </Card>

          <Card variant="premium" className="p-5 flex items-center gap-4">
            <div className="p-3 bg-accent-warm/10 rounded-full text-accent-warm">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Active Orders</p>
              <p className="text-lg font-serif font-black text-brand-primary">{activeOrdersCount} Queue</p>
            </div>
          </Card>

          <Card variant="premium" className="p-5 flex items-center gap-4">
            <div className="p-3 bg-accent-gold/10 rounded-full text-accent-gold">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Pending Tables</p>
              <p className="text-lg font-serif font-black text-brand-primary">{pendingReservationsCount} Bookings</p>
            </div>
          </Card>

          <Card variant="premium" className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-600/10 rounded-full text-green-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Total Customers</p>
              <p className="text-lg font-serif font-black text-brand-primary">
                {new Set([...orders.map(o => o.deliveryAddress.phone), ...reservations.map(r => r.phone)]).size} Clients
              </p>
            </div>
          </Card>
        </div>

        {/* Tab Controls Selector */}
        <div className="flex border-b border-border-subtle overflow-x-auto select-none gap-2">
          {(['overview', 'orders', 'reservations', 'menu'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs uppercase font-bold tracking-widest py-3 px-5 border-b-2 cursor-pointer transition-colors ${
                activeTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Pages content renderer */}
        {dataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* SVG Revenue trends chart */}
                <Card variant="premium" className="p-6 lg:col-span-8 space-y-4">
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-text-secondary">
                    Weekly Sales Analytics
                  </h3>
                  
                  {/* Lightweight SVG Line Chart */}
                  <div className="h-64 w-full pt-4 relative group">
                    <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8C6239" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#8C6239" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Horizontal Guidelines */}
                      <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(28,15,11,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(28,15,11,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(28,15,11,0.05)" strokeDasharray="4" />
                      
                      {/* Chart Area Fill */}
                      <path
                        d="M 0 180 L 80 140 L 160 160 L 240 100 L 320 80 L 400 120 L 500 40 L 500 180 Z"
                        fill="url(#chart-grad)"
                      />
                      
                      {/* Trend Line */}
                      <path
                        d="M 0 180 L 80 140 L 160 160 L 240 100 L 320 80 L 400 120 L 500 40"
                        fill="none"
                        stroke="#8C6239"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data dots */}
                      <circle cx="80" cy="140" r="5" fill="#8C6239" />
                      <circle cx="160" cy="160" r="5" fill="#8C6239" />
                      <circle cx="240" cy="100" r="5" fill="#8C6239" />
                      <circle cx="320" cy="80" r="5" fill="#8C6239" />
                      <circle cx="400" cy="120" r="5" fill="#8C6239" />
                      <circle cx="500" cy="40" r="6" fill="#E07A5F" />
                    </svg>

                    {/* Chart Tooltips labels overlay */}
                    <div className="absolute top-2 right-4 flex items-center gap-1.5 text-[9px] font-sans font-bold bg-white dark:bg-slate-900 border border-border-subtle p-1.5 rounded shadow-premium-sm text-text-primary">
                      <span>Live Sales Peak on Friday (UPI dominated)</span>
                    </div>
                  </div>
                </Card>

                {/* Categories ranking */}
                <Card variant="premium" className="p-6 lg:col-span-4 space-y-4">
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-text-secondary">
                    Best-Selling Categories
                  </h3>
                  <div className="space-y-4 text-xs font-semibold pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>1. UFO Burgers</span>
                        <span>42% orders</span>
                      </div>
                      <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary w-[42%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>2. Matcha Drinks</span>
                        <span>28% orders</span>
                      </div>
                      <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary w-[28%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>3. Japanese Taiyaki</span>
                        <span>20% orders</span>
                      </div>
                      <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary w-[20%]" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB: ORDERS QUEUE */}
            {activeTab === 'orders' && (
              <Card variant="premium" className="p-6 overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle/80 uppercase font-bold text-text-secondary tracking-wider text-[10px]">
                      <th className="pb-3.5 pl-2">Order ID</th>
                      <th className="pb-3.5">Client</th>
                      <th className="pb-3.5">Items Summary</th>
                      <th className="pb-3.5">Grand Total</th>
                      <th className="pb-3.5">Order Status</th>
                      <th className="pb-3.5 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-text-secondary font-serif">
                          No order receipts logged.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="border-b border-border-subtle/30 hover:bg-bg-secondary/40 transition-colors">
                          <td className="py-4 font-mono font-bold text-brand-primary pl-2">{ord.id}</td>
                          <td className="py-4">
                            <strong>{ord.deliveryAddress.fullName}</strong><br />
                            <span className="text-[10px] text-text-secondary">{ord.deliveryAddress.phone}</span>
                          </td>
                          <td className="py-4 font-semibold max-w-[200px] truncate">
                            {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                          </td>
                          <td className="py-4 font-bold text-text-primary">₹{ord.total.toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              ord.orderStatus === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : ord.orderStatus === 'out-for-delivery'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-brand-primary/10 text-brand-primary'
                            }`}>
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            {ord.orderStatus !== 'delivered' && (
                              <div className="inline-flex gap-1.5">
                                {ord.orderStatus === 'received' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="py-1 px-2.5 text-[10px] bg-brand-primary/10 border-brand-primary/30"
                                    disabled={actionLoadingId === ord.id}
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                                  >
                                    Prepare
                                  </Button>
                                )}
                                {ord.orderStatus === 'preparing' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="py-1 px-2.5 text-[10px] bg-amber-500/10 border-amber-500/30"
                                    disabled={actionLoadingId === ord.id}
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'out-for-delivery')}
                                  >
                                    Ship
                                  </Button>
                                )}
                                {ord.orderStatus === 'out-for-delivery' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="py-1 px-2.5 text-[10px] bg-green-600/10 border-green-600/30"
                                    disabled={actionLoadingId === ord.id}
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                                  >
                                    Deliver
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            )}

            {/* TAB: RESERVATIONS */}
            {activeTab === 'reservations' && (
              <Card variant="premium" className="p-6 overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle/80 uppercase font-bold text-text-secondary tracking-wider text-[10px]">
                      <th className="pb-3.5 pl-2">Client Details</th>
                      <th className="pb-3.5">Schedule</th>
                      <th className="pb-3.5">Guests Count</th>
                      <th className="pb-3.5">Seating Location</th>
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5 pr-2 text-right">Approve / Cancel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-text-secondary font-serif">
                          No reservations logged.
                        </td>
                      </tr>
                    ) : (
                      reservations.map((res) => (
                        <tr key={res.id} className="border-b border-border-subtle/30 hover:bg-bg-secondary/40 transition-colors">
                          <td className="py-4 pl-2">
                            <strong>{res.guestName}</strong><br />
                            <span className="text-[10px] text-text-secondary">{res.phone}</span>
                          </td>
                          <td className="py-4 font-semibold">{res.date} at {res.time}</td>
                          <td className="py-4 font-bold">{res.guests} Pax</td>
                          <td className="py-4 uppercase font-bold text-[10px] text-text-secondary">{res.location}</td>
                          <td className="py-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              res.status === 'confirmed'
                                ? 'bg-green-100 text-green-700'
                                : res.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            {res.status === 'pending' && (
                              <div className="inline-flex gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="py-1 px-2.5 text-[10px] border-green-600/30 text-green-600 bg-green-600/5"
                                  disabled={actionLoadingId === res.id}
                                  onClick={() => handleUpdateResStatus(res.id, 'confirmed')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="py-1 px-2.5 text-[10px] border-rose-500/30 text-rose-500 bg-rose-500/5"
                                  disabled={actionLoadingId === res.id}
                                  onClick={() => handleUpdateResStatus(res.id, 'cancelled')}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            )}

            {/* TAB: MENU MANAGER */}
            {activeTab === 'menu' && (
              <Card variant="premium" className="p-6 overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle/80 uppercase font-bold text-text-secondary tracking-wider text-[10px]">
                      <th className="pb-3.5 pl-2">Dish Image & Title</th>
                      <th className="pb-3.5">Category</th>
                      <th className="pb-3.5">Item Price</th>
                      <th className="pb-3.5">Availability Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item.id} className="border-b border-border-subtle/30 hover:bg-bg-secondary/40 transition-colors">
                        <td className="py-4 pl-2 flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="h-10 w-10 object-cover rounded" />
                          <div>
                            <strong className="text-text-primary text-sm">{item.name}</strong><br />
                            <span className="text-[10px] text-text-secondary truncate max-w-[240px] block">{item.description}</span>
                          </div>
                        </td>
                        <td className="py-4 uppercase font-bold text-[10px] text-text-secondary">{item.category}</td>
                        <td className="py-4 font-bold text-brand-primary">₹{item.price}</td>
                        <td className="py-4">
                          {/* Simple toggle indicator mock */}
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded border border-green-600/20">
                            <span className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                            <span>In Stock</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
export default Admin;
