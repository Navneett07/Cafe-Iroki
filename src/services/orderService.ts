import { supabase } from '../config/supabaseClient';
import type { Order } from '../types';

const mapDbOrderToOrder = (dbOrder: any): Order => {
  const dbItems = dbOrder.order_items || [];
  return {
    id: dbOrder.id,
    subtotal: Number(dbOrder.subtotal),
    discount: Number(dbOrder.discount),
    gst: Number(dbOrder.gst),
    deliveryCharge: Number(dbOrder.delivery_charge),
    total: Number(dbOrder.total),
    deliveryAddress: {
      fullName: dbOrder.delivery_address?.fullName || '',
      phone: dbOrder.delivery_address?.phone || '',
      street: dbOrder.delivery_address?.street || '',
      landmark: dbOrder.delivery_address?.landmark || '',
      notes: dbOrder.delivery_address?.notes || '',
    },
    paymentMethod: dbOrder.payment_method as 'upi' | 'card' | 'cod',
    paymentStatus: dbOrder.payment_status as 'pending' | 'paid' | 'failed' | 'refunded',
    orderStatus: dbOrder.order_status as 'received' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refunded',
    createdAt: dbOrder.created_at,
    estimatedDeliveryTime: '30 mins',
    paymentId: dbOrder.payment_id || undefined,
    razorpayOrderId: dbOrder.razorpay_order_id || undefined,
    razorpaySignature: dbOrder.razorpay_signature || undefined,
    razorpayRefundId: dbOrder.razorpay_refund_id || undefined,
    items: dbItems.map((it: any) => ({
      menuItemId: it.menu_item_id,
      name: it.name,
      price: Number(it.price),
      quantity: it.quantity,
    })),
  };
};

export const orderService = {
  /**
   * Fetches all orders (Admin view) from Supabase.
   */
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders', error);
      throw error;
    }

    return (data || []).map(mapDbOrderToOrder);
  },

  /**
   * Fetches an order by ID (Tracking view) from Supabase.
   */
  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching order by ID', error);
      throw error;
    }

    return data ? mapDbOrderToOrder(data) : null;
  },

  /**
   * Submits a new customer food order invoking checkout Supabase Edge Function.
   */
  async createOrder(
    input: Omit<Order, 'id' | 'createdAt' | 'estimatedDeliveryTime' | 'orderStatus' | 'paymentStatus'>,
    couponCode?: string
  ): Promise<Order> {
    const payload = {
      items: input.items.map((it) => ({
        menuItemId: it.menuItemId,
        quantity: it.quantity,
      })),
      couponCode,
      deliveryAddress: input.deliveryAddress,
      paymentMethod: input.paymentMethod,
    };

    const { data, error } = await supabase.functions.invoke('checkout', {
      body: payload,
    });

    if (error || !data || data.error) {
      throw new Error(error?.message || data?.error || 'Failed to place order via checkout function.');
    }

    return {
      ...input,
      subtotal: data.subtotal,
      discount: data.discount,
      gst: data.gst,
      deliveryCharge: data.deliveryCharge,
      total: data.total,
      id: data.orderId,
      orderStatus: 'received',
      paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'paid',
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: '30 mins',
    };
  },

  /**
   * Updates an order's milestone status (Admin view) invoking admin-orders Supabase Edge Function.
   */
  async updateOrderStatus(id: string, status: Order['orderStatus']): Promise<Order | null> {
    const action = status === 'refunded' ? 'refund' : 'update_status';
    
    const { data, error } = await supabase.functions.invoke('admin-orders', {
      body: {
        action,
        orderId: id,
        status,
      },
    });

    if (error || !data || data.error) {
      throw new Error(error?.message || data?.error || 'Failed to update order status.');
    }

    return this.getOrderById(id);
  },

  /**
   * Generates a plain-text billing receipt invoking invoice Supabase Edge Function.
   */
  async getInvoiceText(orderId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke(`invoice?orderId=${orderId}`, {
      method: 'GET',
    });

    if (error || !data || data.error) {
      throw new Error(error?.message || data?.error || 'Failed to generate invoice receipt.');
    }

    return data.invoice;
  }
};
