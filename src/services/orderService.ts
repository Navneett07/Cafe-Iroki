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
    paymentStatus: dbOrder.payment_status as 'pending' | 'paid',
    orderStatus: dbOrder.order_status as 'received' | 'preparing' | 'out-for-delivery' | 'delivered',
    createdAt: dbOrder.created_at,
    estimatedDeliveryTime: '30 mins',
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
   * Submits a new customer food order to Supabase.
   */
  async createOrder(input: Omit<Order, 'id' | 'createdAt' | 'estimatedDeliveryTime' | 'orderStatus' | 'paymentStatus'>): Promise<Order> {
    // 1. Get current logged-in auth user
    const { data: { session } } = await supabase.auth.getSession();
    
    // 2. Insert parent order record
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session?.user?.id || null,
        order_status: 'received',
        subtotal: input.subtotal,
        discount: input.discount,
        gst: input.gst,
        delivery_charge: input.deliveryCharge,
        total: input.total,
        delivery_address: input.deliveryAddress,
        payment_method: input.paymentMethod,
        payment_status: input.paymentMethod === 'cod' ? 'pending' : 'paid',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order record', orderError);
      throw orderError;
    }

    // 3. Insert list items
    const itemsToInsert = input.items.map((it) => ({
      order_id: orderData.id,
      menu_item_id: it.menuItemId.includes('-') && it.menuItemId.length > 20 ? it.menuItemId : null, // only validate UUIDs
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating order items', itemsError);
      // Attempt rollback order if items fail
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw itemsError;
    }

    return {
      ...input,
      id: orderData.id,
      orderStatus: 'received',
      paymentStatus: orderData.payment_status as 'pending' | 'paid',
      createdAt: orderData.created_at,
      estimatedDeliveryTime: '30 mins',
    };
  },

  /**
   * Updates an order's milestone status (Admin view) on Supabase.
   */
  async updateOrderStatus(id: string, status: Order['orderStatus']): Promise<Order | null> {
    const paymentStatus = status === 'delivered' ? 'paid' : undefined;
    const updatePayload: any = { order_status: status };
    if (paymentStatus) {
      updatePayload.payment_status = paymentStatus;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, order_items(*)')
      .single();

    if (error) {
      console.error('Error updating order status', error);
      throw error;
    }

    return data ? mapDbOrderToOrder(data) : null;
  }
};
