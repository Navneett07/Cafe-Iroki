import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

interface GuestInfo {
  guestName: string;
  guestPhone: string;
  tableNumber: string;
  notes?: string;
}

interface CheckoutPayload {
  items: OrderItemInput[];
  couponCode?: string;
  guest: GuestInfo;
  paymentMethod: "upi" | "card" | "counter";
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Create service-role client for DB writes
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Optionally identify an authenticated user (not required)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer undefined") {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await anonClient.auth.getUser();
      if (user) userId = user.id;
    }

    const body: CheckoutPayload = await req.json();
    const { items, couponCode, guest, paymentMethod } = body;

    // 3. Validate required guest fields
    if (!guest?.guestName || !guest?.guestPhone || !guest?.tableNumber) {
      return new Response(
        JSON.stringify({ error: "Name, phone, and table number are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Shopping cart is empty." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch and validate menu items with true DB pricing
    const itemIds = items.map((it) => it.menuItemId);
    const { data: menuDbItems, error: menuErr } = await serviceClient
      .from("menu_items")
      .select("id, name, price, stock")
      .in("id", itemIds);

    if (menuErr || !menuDbItems || menuDbItems.length !== items.length) {
      return new Response(
        JSON.stringify({ error: "One or more items in the cart are invalid." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Validate stock and compute subtotal from DB prices (never trust frontend)
    const verifiedItems = [];
    let subtotal = 0;

    for (const inputItem of items) {
      const dbItem = menuDbItems.find((d: any) => d.id === inputItem.menuItemId);
      if (!dbItem) throw new Error(`Item ${inputItem.menuItemId} not found.`);

      if (dbItem.stock < inputItem.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for: ${dbItem.name}. Only ${dbItem.stock} remaining.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const itemPrice = Number(dbItem.price);
      subtotal += itemPrice * inputItem.quantity;
      verifiedItems.push({
        menuItemId: dbItem.id,
        name: dbItem.name,
        price: itemPrice,
        quantity: inputItem.quantity,
      });
    }

    // 6. Verify coupon code (optional)
    let discount = 0;
    if (couponCode) {
      const { data: couponData } = await serviceClient
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .gte("expiry_date", new Date().toISOString().split("T")[0])
        .maybeSingle();

      if (couponData && subtotal >= Number(couponData.min_order_value)) {
        const val = Number(couponData.value);
        discount = couponData.discount_type === "percentage"
          ? (subtotal * val) / 100
          : val;
      }
    }

    // 7. GST and total calculations (server-side, never trusted from frontend)
    const taxableAmount = Math.max(0, subtotal - discount);
    const gst = taxableAmount * 0.05; // 5% GST
    const deliveryCharge = 0; // Dine-in: no delivery charge
    const total = taxableAmount + gst + deliveryCharge;

    // 8. Insert parent order
    const { data: orderData, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        user_id: userId, // null for guests
        guest_name: guest.guestName,
        guest_phone: guest.guestPhone,
        table_number: guest.tableNumber,
        order_status: "received",
        subtotal,
        discount,
        gst,
        delivery_charge: deliveryCharge,
        total,
        delivery_address: { notes: guest.notes || "" },
        payment_method: paymentMethod,
        payment_status: paymentMethod === "counter" ? "pending" : "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 9. Insert order items
    const itemsToInsert = verifiedItems.map((it) => ({
      order_id: orderData.id,
      menu_item_id: it.menuItemId,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    }));

    const { error: itemsError } = await serviceClient
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      await serviceClient.from("orders").delete().eq("id", orderData.id);
      throw itemsError;
    }

    // 10. Decrement stock
    for (const it of verifiedItems) {
      const dbItem = menuDbItems.find((d: any) => d.id === it.menuItemId);
      await serviceClient
        .from("menu_items")
        .update({ stock: dbItem.stock - it.quantity })
        .eq("id", it.menuItemId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderData.id,
        subtotal,
        discount,
        gst,
        deliveryCharge,
        total,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
