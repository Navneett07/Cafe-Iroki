export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'hot-coffee' | 'cold-coffee' | 'matcha' | 'cold-brew' | 'tea' | 'shakes' | 'coolers' | 'small-plates' | 'bowl' | 'ufo-burgers' | 'taiyaki';
  image: string;
  tags: string[];
  isVegetarian: boolean;
  isPopular?: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  avatar?: string;
  rating: number; // 1 to 5
  relativeTime: string;
  text: string;
  tags?: string[];
}

export interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  location: 'indoor' | 'outdoor' | 'balcony';
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
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
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'received' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refunded';
  createdAt: string;
  estimatedDeliveryTime: string; // ISO or relative minutes
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  name: string;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  minOrderValue: number;
  description: string;
}
