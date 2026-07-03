// ─── Domain Types ───────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags: string[];
  isVegetarian: boolean;
  isPopular?: boolean;
  stock?: number;
  available?: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  avatar?: string;
  rating: number;
  relativeTime: string;
  text: string;
  tags?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  userId?: string;
}

export interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  location: 'indoor' | 'outdoor' | 'balcony';
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  tableNumber?: string;
  userId?: string;
  createdAt?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  total: number;
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    landmark?: string;
    notes?: string;
  };
  paymentMethod: 'upi' | 'card' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'received' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refunded';
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  razorpayRefundId?: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'admin' | 'customer';
  createdAt?: string;
  totalOrders?: number;
  totalSpend?: number;
}

export interface Coupon {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  maxUses?: number;
  usedCount?: number;
  expiryDate?: string;
  isActive: boolean;
  description?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  category?: string;
  caption?: string;
  storagePath?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── Admin Dashboard Types ───────────────────────────────────────────────────

export interface DashboardStats {
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  activeOrders: number;
  reservationsToday: number;
  totalCustomers: number;
  avgOrderValue: number;
  pendingReviews: number;
  lowStockCount: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  image?: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  userId?: string;
  customerName?: string;
  amount: number;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  razorpayOrderId?: string;
  refundId?: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
}
