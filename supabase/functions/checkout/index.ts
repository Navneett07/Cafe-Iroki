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

interface CheckoutPayload {
  items: OrderItemInput[];
  couponCode?: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    landmark?: string;
    notes?: string;
  };
  paymentMethod: "upi" | "card" | "cod";
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Initialise Supabase Client with Auth header Context (forces RLS checks if desired)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // 2. Retrieve user profile
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user token session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CheckoutPayload = await req.json();
    const { items, couponCode, deliveryAddress, paymentMethod } = body;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Shopping cart is empty." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch menu items matching payload ids to validate stock and prices
    const itemIds = items.map((it) => it.menuItemId);
    const { data: menuDbItems, error: menuErr } = await supabaseClient
      .from("menu_items")
      .select("id, name, price, stock")
      .in("id", itemIds);

    if (menuErr || !menuDbItems || menuDbItems.length !== items.length) {
      return new Response(JSON.stringify({ error: "One or more items in the cart are invalid." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Validate stock availability & rebuild order items with true database pricing
    const verifiedItems = [];
    let subtotal = 0;
    
    for (const inputItem of items) {
      const dbItem = menuDbItems.find((d: any) => d.id === inputItem.menuItemId);
      if (!dbItem) {
        throw new Error(`Item ${inputItem.menuItemId} not found.`);
      }

      if (dbItem.stock < inputItem.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for: ${dbItem.name}. Only ${dbItem.stock} items remaining.` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
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

    // 5. Verify coupon code
    let discount = 0;
    if (couponCode) {
      const { data: couponData } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .gte("expiry_date", new Date().toISOString().split("T")[0])
        .maybeSingle();

      if (couponData && subtotal >= Number(couponData.min_order_value)) {
        const val = Number(couponData.value);
        if (couponData.discount_type === "percentage") {
          discount = (subtotal * val) / 100;
        } else {
          discount = val;
        }
      }
    }

    // 6. GST and Delivery Calculations
    const taxableAmount = Math.max(0, subtotal - discount);
    const gst = taxableAmount * 0.05; // 5% GST rate
    const deliveryCharge = subtotal === 0 || taxableAmount >= 500 ? 0 : 50; // Free delivery over 500
    const total = taxableAmount + gst + deliveryCharge;

    // 7. Insert Parent Order transaction
    const { data: orderData, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        order_status: "received",
        subtotal,
        discount,
        gst,
        delivery_charge: deliveryCharge,
        total,
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cod" ? "pending" : "paid",
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // 8. Insert Order items and decrement stock values
    const itemsToInsert = verifiedItems.map((it) => ({
      order_id: orderData.id,
      menu_item_id: it.menuItemId,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    }));

    const { error: itemsError } = await supabaseClient
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // rollback order insert
      await supabaseClient.from("orders").delete().eq("id", orderData.id);
      throw itemsError;
    }

    // 9. Decrement stock on menu items
    for (const it of verifiedItems) {
      const dbItem = menuDbItems.find((d: any) => d.id === it.menuItemId);
      await supabaseClient
        .from("menu_items")
        .update({ stock: dbItem.stock - it.quantity })
        .eq("id", it.menuItemId);
    }

    // Clear user's cart in database
    await supabaseClient
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

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
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
