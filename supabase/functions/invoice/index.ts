import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user token session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order details
    const { data: order, error: orderErr } = await supabaseClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership: must be the user's order or user must be an admin
    if (order.user_id !== user.id) {
      const { data: adminRole } = await supabaseClient
        .from("admin_users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!adminRole || adminRole.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden: Unauthorized access to invoice." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate plain-text invoice layout
    const invoiceText = `
=========================================
          CAFE IROKI NAGPUR
=========================================
Order ID:   ${order.id}
Date:       ${new Date(order.created_at).toLocaleString()}
Customer:   ${order.delivery_address?.fullName || "Guest"}
Phone:      ${order.delivery_address?.phone || ""}
Address:    ${order.delivery_address?.street || ""}
-----------------------------------------
Dishes Ordered:
${order.order_items.map((it: any) => `${it.quantity}x ${it.name.padEnd(25)} ₹${(it.price * it.quantity).toFixed(2)}`).join("\n")}
-----------------------------------------
Subtotal:          ₹${Number(order.subtotal).toFixed(2)}
Discount:          -₹${Number(order.discount).toFixed(2)}
GST (5%):          ₹${Number(order.gst).toFixed(2)}
Delivery Charge:   ₹${Number(order.delivery_charge).toFixed(2)}
=========================================
Grand Total:       ₹${Number(order.total).toFixed(2)}
=========================================
Payment Method:    ${order.payment_method.toUpperCase()} (${order.payment_status})
Thank you for dining at Cafe Iroki!
`;

    return new Response(JSON.stringify({ success: true, invoice: invoiceText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
