import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabaseClient';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { storageService } from '../../services/storageService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Reveal } from '../../components/Animation/Reveal';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Calendar, 
  UploadCloud, 
  Trash2
} from 'lucide-react';

interface Address {
  id: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'reservations' | 'addresses'>('profile');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Avatar upload/preview management states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [signedAvatar, setSignedAvatar] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data fetch state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Address CRUD fields state
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Fetch complete profile dashboard elements
  useEffect(() => {
    if (!user) return;
    
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch profiles matching auth context user
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', user.id)
          .single();

        if (profErr) throw profErr;

        if (prof) {
          setFullName(prof.full_name || '');
          setPhone(prof.phone || '');
          setAvatarUrl(prof.avatar_url || null);
          
          // Generate signed asset preview URL if using avatars bucket path keys
          if (prof.avatar_url) {
            try {
              const url = await storageService.getSignedUrl('avatars', prof.avatar_url);
              setSignedAvatar(url);
            } catch (err) {
              console.warn('Failed loading private avatar signed preview link', err);
            }
          }
        }

        // Fetch addresses
        const { data: addrList } = await supabase
          .from('addresses')
          .select('*')
          .eq('profile_id', user.id);
        setAddresses(addrList || []);

        // Fetch orders
        const { data: ordList } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setOrders(ordList || []);

        // Fetch reservations
        const { data: resList } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        setReservations(resList || []);

      } catch (err) {
        console.error('Failed fetching customer profile metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Realtime refetchers scoped to this user (RLS enforces ownership)
  const refetchOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }, [user]);

  const refetchReservations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setReservations(data || []);
  }, [user]);

  useRealtimeChannel({
    channel: user ? `profile-orders-${user.id}` : 'profile-orders',
    table: 'orders',
    event: '*',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onChange: refetchOrders,
    onResync: refetchOrders,
  });

  useRealtimeChannel({
    channel: user ? `profile-reservations-${user.id}` : 'profile-reservations',
    table: 'reservations',
    event: '*',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onChange: refetchReservations,
    onResync: refetchReservations,
  });

  // Handle avatar upload triggers
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `${user.id}/${Date.now()}.${ext}`;
      
      // Upload using storage service
      const avatarPath = await storageService.uploadMedia('avatars', storagePath, file);
      setUploadProgress(70);

      // Save database link update
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarPath })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(avatarPath);
      setUploadProgress(100);
      showToast('Avatar picture updated successfully.', 'success');

      // Refresh signed asset preview URL
      const signedUrl = await storageService.getSignedUrl('avatars', avatarPath);
      setSignedAvatar(signedUrl);

    } catch (err: any) {
      showToast(err.message || 'Avatar upload failed.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete Avatar
  const handleDeleteAvatar = async () => {
    if (!user || !avatarUrl) return;

    try {
      // 1. Delete from bucket
      await storageService.deleteMedia('avatars', avatarUrl);

      // 2. Clear from profile table
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(null);
      setSignedAvatar(null);
      showToast('Avatar picture deleted.', 'info');
    } catch (err) {
      showToast('Failed to delete avatar.', 'error');
    }
  };

  // Save changes to profile text fields
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
        })
        .eq('id', user.id);

      if (error) throw error;
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    }
  };

  // Address create/update submit
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !street.trim() || !pincode.trim()) return;

    try {
      if (isEditingAddress && editingAddressId) {
        const { error } = await supabase
          .from('addresses')
          .update({
            street,
            landmark: landmark || null,
            pincode,
          })
          .eq('id', editingAddressId);

        if (error) throw error;
        showToast('Address updated.', 'success');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert({
            profile_id: user.id,
            street,
            landmark: landmark || null,
            pincode,
          });

        if (error) throw error;
        showToast('New address added.', 'success');
      }

      // Reload addresses
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.id);
      setAddresses(data || []);
      
      // Reset form
      setStreet('');
      setLandmark('');
      setPincode('');
      setIsEditingAddress(false);
      setEditingAddressId(null);

    } catch (err) {
      showToast('Address update failed.', 'error');
    }
  };

  // Address delete handler
  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address deleted.', 'info');
    } catch (err) {
      showToast('Failed to delete address.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <Card variant="premium" className="p-5 flex flex-col items-center text-center gap-4">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-bg-secondary border-2 border-brand-primary/50 relative flex items-center justify-center">
                {signedAvatar ? (
                  <img src={signedAvatar} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <User size={36} className="text-text-secondary" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                    {uploadProgress}%
                  </div>
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-primary text-white border border-bg-primary hover:scale-105 transition-all cursor-pointer"
                title="Change Avatar"
              >
                <UploadCloud size={12} />
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/avif"
            />

            <div>
              <h2 className="font-serif font-bold text-base truncate max-w-[180px]">{fullName || 'Valued Guest'}</h2>
              <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold font-sans">
                {user?.email}
              </span>
            </div>

            {avatarUrl && (
              <button
                onClick={handleDeleteAvatar}
                className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
                Delete Image
              </button>
            )}
          </Card>

          {/* Nav Tabs */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                activeTab === 'profile'
                  ? 'bg-brand-primary border-brand-primary text-white shadow-premium-sm'
                  : 'bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <User size={14} />
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                activeTab === 'orders'
                  ? 'bg-brand-primary border-brand-primary text-white shadow-premium-sm'
                  : 'bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <ShoppingBag size={14} />
              Order History
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                activeTab === 'reservations'
                  ? 'bg-brand-primary border-brand-primary text-white shadow-premium-sm'
                  : 'bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <Calendar size={14} />
              Reservations
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                activeTab === 'addresses'
                  ? 'bg-brand-primary border-brand-primary text-white shadow-premium-sm'
                  : 'bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <MapPin size={14} />
              Saved Addresses
            </button>
          </div>
        </div>

        {/* Tab Body views */}
        <div className="lg:col-span-3">
          
          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <Reveal direction="up">
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-text-primary border-b border-border-subtle/50 pb-2">
                    Profile Details
                  </h3>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <Input
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <Button type="submit" size="md" className="w-full sm:w-auto">
                    Save Changes
                  </Button>
                </form>
              </Card>
            </Reveal>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <Reveal direction="up" className="space-y-4">
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-text-primary border-b border-border-subtle/50 pb-2">
                    Previous Orders
                  </h3>
                </div>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-xs text-text-secondary italic text-center py-6">
                      No order transactions found.
                    </p>
                  ) : (
                    orders.map((ord) => (
                      <div key={ord.id} className="border border-border-subtle/30 rounded p-4 bg-bg-secondary/20 flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-text-primary">Order ID: #{ord.id.slice(0, 8)}</span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              ord.order_status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-brand-primary/10 text-brand-primary'
                            }`}>
                              {ord.order_status}
                            </span>
                          </div>
                          
                          <div className="text-xs text-text-secondary space-y-1">
                            <p><strong>Total Paid:</strong> ₹{ord.total}</p>
                            <p><strong>Date:</strong> {new Date(ord.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="text-xs space-y-1 md:text-right">
                          <p className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Dishes ordered:</p>
                          <div className="space-y-0.5">
                            {ord.order_items?.map((item: any) => (
                              <p key={item.id}>{item.name} x{item.quantity}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </Reveal>
          )}

          {/* TAB: RESERVATIONS */}
          {activeTab === 'reservations' && (
            <Reveal direction="up" className="space-y-4">
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-text-primary border-b border-border-subtle/50 pb-2">
                    Reservations Log
                  </h3>
                </div>

                <div className="space-y-4">
                  {reservations.length === 0 ? (
                    <p className="text-xs text-text-secondary italic text-center py-6">
                      No table bookings scheduled.
                    </p>
                  ) : (
                    reservations.map((res) => (
                      <div key={res.id} className="border border-border-subtle/30 rounded p-4 bg-bg-secondary/20 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-text-primary">{res.guests} Pax • {res.location} Zone</p>
                          <p className="text-[11px] text-text-secondary">
                            Date: {res.date} at {res.time}
                          </p>
                          {res.table_id && (
                            <span className="text-[9px] uppercase font-bold text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded border border-accent-gold/10">
                              Table: {res.table_id}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${
                            res.status === 'confirmed' ? 'bg-green-100 text-green-700' : res.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {res.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </Reveal>
          )}

          {/* TAB: ADDRESSES */}
          {activeTab === 'addresses' && (
            <Reveal direction="up" className="space-y-4">
              <Card variant="premium" className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-text-primary border-b border-border-subtle/50 pb-2">
                    Manage Addresses
                  </h3>
                </div>

                {/* Address Input Form */}
                <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border-subtle/30 pb-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address"
                      placeholder="Flat/House No, building, street name"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    label="Landmark (Optional)"
                    placeholder="Near metro station, landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                  <Input
                    label="Pincode"
                    placeholder="440015"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                  <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                    {isEditingAddress && (
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => {
                          setIsEditingAddress(false);
                          setStreet('');
                          setLandmark('');
                          setPincode('');
                          setEditingAddressId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" size="md">
                      {isEditingAddress ? 'Update Address' : 'Add Address'}
                    </Button>
                  </div>
                </form>

                {/* Saved addresses lists */}
                <div className="space-y-4 pt-2">
                  {addresses.length === 0 ? (
                    <p className="text-xs text-text-secondary italic text-center">
                      No delivery addresses configured.
                    </p>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className="border border-border-subtle/30 rounded p-4 bg-bg-secondary/20 flex justify-between items-center gap-4">
                        <div className="text-xs leading-relaxed">
                          <p className="font-bold text-text-primary">{addr.street}</p>
                          {addr.landmark && <p className="text-text-secondary">Landmark: {addr.landmark}</p>}
                          <p className="text-text-secondary">{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditingAddress(true);
                              setEditingAddressId(addr.id);
                              setStreet(addr.street);
                              setLandmark(addr.landmark || '');
                              setPincode(addr.pincode);
                            }}
                            className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </Reveal>
          )}

        </div>

      </div>
    </div>
  );
};

export default Profile;
