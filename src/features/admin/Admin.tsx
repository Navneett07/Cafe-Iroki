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
import { storageService } from '../../services/storageService';
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
  LogOut,
  UploadCloud,
  Image as ImageIcon,
  Copy
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid admin email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormInput = z.infer<typeof loginSchema>;

export const Admin: React.FC = () => {
  const { login, logout, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'reservations' | 'menu' | 'media'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Media Manager States
  const [mediaSubTab, setMediaSubTab] = useState<'gallery' | 'menu-images' | 'banners'>('gallery');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  // Gallery upload fields
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryDesc, setGalleryDesc] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'food' | 'coffee' | 'interior' | 'events'>('food');

  // Banner status state
  const [bannerDesktopUrl, setBannerDesktopUrl] = useState<string | null>(null);
  const [bannerMobileUrl, setBannerMobileUrl] = useState<string | null>(null);

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

        // Load banner settings
        const { data: bannerSettings } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'banners')
          .maybeSingle();

        if (bannerSettings?.value) {
          setBannerDesktopUrl(bannerSettings.value.desktop_url || null);
          setBannerMobileUrl(bannerSettings.value.mobile_url || null);
        }
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
        showToast(`Order status updated to: ${status}`, 'success');
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

  // Menu Image Upload Handler
  const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(20);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `dishes/${Date.now()}.${ext}`;
      
      const url = await storageService.uploadMedia('menu-images', path, file);
      setUploadProgress(100);
      setUploadedUrl(url);
      showToast('Menu image uploaded. Copy the URL to use in menu items.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Gallery Upload Submit
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !galleryTitle.trim() || !galleryDesc.trim()) {
      showToast('Please specify title and description first.', 'info');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${galleryCategory}/${Date.now()}.${ext}`;
      
      const url = await storageService.uploadMedia('gallery', path, file);
      setUploadProgress(70);

      // Insert gallery record
      const { error } = await supabase
        .from('gallery_images')
        .insert({
          category: galleryCategory,
          title: galleryTitle,
          description: galleryDesc,
          image_url: url,
          span_config: 'md:col-span-1 md:row-span-1',
        });

      if (error) throw error;

      setUploadProgress(100);
      showToast('Gallery image seeded successfully.', 'success');
      setGalleryTitle('');
      setGalleryDesc('');
    } catch (err: any) {
      showToast(err.message || 'Gallery upload failed.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Banner Upload Submit
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(20);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `hero_${type}_${Date.now()}.${ext}`;
      
      const url = await storageService.uploadMedia('banners', path, file);
      setUploadProgress(70);

      // Fetch existing banner settings
      const { data: currentSettings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'banners')
        .maybeSingle();

      const newValue = currentSettings?.value || { desktop_url: '', mobile_url: '' };
      if (type === 'desktop') {
        newValue.desktop_url = url;
        setBannerDesktopUrl(url);
      } else {
        newValue.mobile_url = url;
        setBannerMobileUrl(url);
      }

      // Upsert settings in database
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'banners',
          value: newValue,
        });

      if (error) throw error;

      setUploadProgress(100);
      showToast(`${type === 'desktop' ? 'Desktop' : 'Mobile'} banner updated successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Banner upload failed.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
                {new Set([...orders.map(o => o.deliveryAddress?.phone), ...reservations.map(r => r.phone)]).size} Clients
              </p>
            </div>
          </Card>
        </div>

        {/* Tab Controls Selector */}
        <div className="flex border-b border-border-subtle overflow-x-auto select-none gap-2">
          {(['overview', 'orders', 'reservations', 'menu', 'media'] as const).map((tab) => (
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

        {/* Dynamic tabs loader content */}
        {dataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Active orders queue list */}
                <Card variant="premium" className="p-6 space-y-4">
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-text-primary border-b border-border-subtle/30 pb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent-warm animate-ping" />
                    <span>Active Orders Queue</span>
                  </h3>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {orders.filter((o) => o.orderStatus !== 'delivered').length === 0 ? (
                      <p className="text-xs text-text-secondary italic">No active order items in queue.</p>
                    ) : (
                      orders
                        .filter((o) => o.orderStatus !== 'delivered')
                        .map((o) => (
                          <div key={o.id} className="border border-border-subtle/30 rounded p-3.5 bg-bg-secondary/20 flex justify-between items-center gap-4">
                            <div>
                              <p className="text-xs font-bold">Client: {o.deliveryAddress.fullName}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">Payment: {o.paymentMethod.toUpperCase()} | ₹{o.total}</p>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                                Status: {o.orderStatus}
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                              disabled={actionLoadingId === o.id}
                            >
                              Deliver
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </Card>

                {/* Pending bookings queue list */}
                <Card variant="premium" className="p-6 space-y-4">
                  <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-text-primary border-b border-border-subtle/30 pb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent-gold animate-ping" />
                    <span>Pending Reservations</span>
                  </h3>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {reservations.filter((r) => r.status === 'pending').length === 0 ? (
                      <p className="text-xs text-text-secondary italic">No pending table bookings.</p>
                    ) : (
                      reservations
                        .filter((r) => r.status === 'pending')
                        .map((r) => (
                          <div key={r.id} className="border border-border-subtle/30 rounded p-3.5 bg-bg-secondary/20 flex justify-between items-center gap-4">
                            <div>
                              <p className="text-xs font-bold">{r.guestName} ({r.guests} Pax)</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">Schedule: {r.date} at {r.time} ({r.location})</p>
                            </div>
                            <div className="inline-flex gap-1">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white border-none py-1 px-2.5 text-[10px]"
                                onClick={() => handleUpdateResStatus(r.id, 'confirmed')}
                                disabled={actionLoadingId === r.id}
                              >
                                Approve
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </Card>

              </div>
            )}

            {/* TAB: ORDERS LIST */}
            {activeTab === 'orders' && (
              <Card variant="premium" className="p-6 overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle/80 uppercase font-bold text-text-secondary tracking-wider text-[10px]">
                      <th className="pb-3.5 pl-2">Customer & Details</th>
                      <th className="pb-3.5">Address</th>
                      <th className="pb-3.5">Total Bill</th>
                      <th className="pb-3.5">Order Status</th>
                      <th className="pb-3.5 pr-2 text-right">Update Order Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-text-secondary font-serif">
                          No order logs found.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="border-b border-border-subtle/30 hover:bg-bg-secondary/40 transition-colors">
                          <td className="py-4 pl-2">
                            <strong>{o.deliveryAddress?.fullName}</strong><br />
                            <span className="text-[10px] text-text-secondary">{o.deliveryAddress?.phone}</span>
                          </td>
                          <td className="py-4 truncate max-w-[180px]">{o.deliveryAddress?.street}</td>
                          <td className="py-4 font-bold text-brand-primary">₹{o.total}</td>
                          <td className="py-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              o.orderStatus === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : o.orderStatus === 'cancelled' || o.orderStatus === 'refunded'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            {o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded' && (
                              <select
                                className="bg-bg-secondary border border-border-subtle text-text-primary rounded text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                value={o.orderStatus}
                                disabled={actionLoadingId === o.id}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                              >
                                <option value="received">Received</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="out-for-delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            )}

            {/* TAB: RESERVATIONS LIST */}
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

            {/* TAB: MEDIA MANAGER */}
            {activeTab === 'media' && (
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-text-primary border-b border-border-subtle/50 pb-2">
                    Operational Media & Assets Manager
                  </h3>
                </div>

                {/* Subnav tab bar */}
                <div className="flex border-b border-border-subtle/50 gap-4 select-none">
                  {(['gallery', 'menu-images', 'banners'] as const).map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setMediaSubTab(sub);
                        setUploadedUrl(null);
                      }}
                      className={`text-xs font-bold py-2 border-b-2 cursor-pointer transition-colors ${
                        mediaSubTab === sub
                          ? 'border-brand-primary text-brand-primary'
                          : 'border-transparent text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {sub === 'gallery' ? 'Gallery Seed' : sub === 'menu-images' ? 'Menu Dishes Upload' : 'Banners & Hero'}
                    </button>
                  ))}
                </div>

                {/* SUBTAB: GALLERY SEED */}
                {mediaSubTab === 'gallery' && (
                  <div className="space-y-4 max-w-lg">
                    <Input
                      label="Image Title"
                      placeholder="Kyoto Drip preparation"
                      value={galleryTitle}
                      onChange={(e) => setGalleryTitle(e.target.value)}
                    />
                    <Input
                      label="Description"
                      placeholder="Pour-over brewing methods"
                      value={galleryDesc}
                      onChange={(e) => setGalleryDesc(e.target.value)}
                    />
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                        Vibe Category
                      </label>
                      <select
                        className="w-full px-4 py-2.5 bg-bg-secondary text-text-primary rounded-md border border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-smooth text-sm font-sans"
                        value={galleryCategory}
                        onChange={(e) => setGalleryCategory(e.target.value as any)}
                      >
                        <option value="food">Food</option>
                        <option value="coffee">Coffee & Matcha</option>
                        <option value="interior">Interior</option>
                        <option value="events">Events & Culture</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <div className="border-2 border-dashed border-border-subtle/60 hover:border-brand-primary/60 rounded-lg p-8 text-center cursor-pointer relative group transition-colors">
                        <input
                          type="file"
                          onChange={handleGalleryUpload}
                          disabled={isUploading}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                        />
                        <div className="flex flex-col items-center gap-3">
                          <UploadCloud size={32} className="text-text-secondary group-hover:text-brand-primary transition-colors" />
                          <div>
                            <p className="text-xs font-bold">Drag & drop or click to upload</p>
                            <p className="text-[10px] text-text-secondary mt-1">Supports JPEG, PNG, WEBP, AVIF (Max. 5MB)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isUploading && (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-bg-secondary rounded overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-text-secondary text-right">Uploading... {uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB: MENU DISHES UPLOAD */}
                {mediaSubTab === 'menu-images' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="border-2 border-dashed border-border-subtle/60 hover:border-brand-primary/60 rounded-lg p-8 text-center cursor-pointer relative group transition-colors">
                      <input
                        type="file"
                        onChange={handleMenuImageUpload}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <UploadCloud size={32} className="text-text-secondary group-hover:text-brand-primary transition-colors" />
                        <div>
                          <p className="text-xs font-bold">Select Dish Image to Compress & Upload</p>
                          <p className="text-[10px] text-text-secondary mt-1">Uploaded directly to menu-images public bucket</p>
                        </div>
                      </div>
                    </div>

                    {isUploading && (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-bg-secondary rounded overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-text-secondary text-right">Uploading... {uploadProgress}%</p>
                      </div>
                    )}

                    {uploadedUrl && (
                      <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded flex items-center justify-between gap-4">
                        <div className="space-y-1 truncate">
                          <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                            <CheckCircle size={14} />
                            <span>Upload Successful</span>
                          </p>
                          <p className="text-[10px] text-text-secondary truncate">{uploadedUrl}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(uploadedUrl);
                            showToast('Copied URL link to clipboard.', 'success');
                          }}
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB: BANNERS */}
                {mediaSubTab === 'banners' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Desktop banner */}
                    <Card variant="premium" className="p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">Homepage Desktop Banner</h4>
                      <div className="aspect-video w-full rounded bg-bg-secondary border border-border-subtle/50 relative overflow-hidden flex items-center justify-center">
                        {bannerDesktopUrl ? (
                          <img src={bannerDesktopUrl} alt="Desktop Hero Banner" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={32} className="text-text-secondary" />
                        )}
                      </div>
                      
                      <div className="relative">
                        <input
                          type="file"
                          onChange={(e) => handleBannerUpload(e, 'desktop')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Button variant="outline" className="w-full gap-2">
                          <UploadCloud size={14} />
                          <span>Upload Desktop Banner</span>
                        </Button>
                      </div>
                    </Card>

                    {/* Mobile banner */}
                    <Card variant="premium" className="p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">Homepage Mobile Banner</h4>
                      <div className="aspect-[9/16] w-full max-w-[200px] mx-auto rounded bg-bg-secondary border border-border-subtle/50 relative overflow-hidden flex items-center justify-center">
                        {bannerMobileUrl ? (
                          <img src={bannerMobileUrl} alt="Mobile Hero Banner" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={32} className="text-text-secondary" />
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="file"
                          onChange={(e) => handleBannerUpload(e, 'mobile')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Button variant="outline" className="w-full gap-2">
                          <UploadCloud size={14} />
                          <span>Upload Mobile Banner</span>
                        </Button>
                      </div>
                    </Card>

                  </div>
                )}
              </Card>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
export default Admin;
