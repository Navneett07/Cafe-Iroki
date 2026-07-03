import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateOrderStatusPayload {
  action: "update_status";
  orderId: string;
  status: "received" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled" | "refunded";
}

interface RefundOrderPayload {
  action: "refund";
  orderId: string;
}

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

    // 1. Verify that user has Admin capabilities
    const { data: adminRole, error: adminErr } = await supabaseClient
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminErr || !adminRole || adminRole.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Administrator permissions required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action;

    if (action === "update_status") {
      const payload: UpdateOrderStatusPayload = body;
      
      const updatePayload: any = { order_status: payload.status };
      if (payload.status === "delivered") {
        updatePayload.payment_status = "paid";
      }

      const { data: orderData, error: updateError } = await supabaseClient
        .from("orders")
        .update(updatePayload)
        .eq("id", payload.orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true, order: orderData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "refund") {
      const payload: RefundOrderPayload = body;

      // Update payment_status to 'refunded' and order_status to 'refunded'
      const { data: orderData, error: updateError } = await supabaseClient
        .from("orders")
        .update({
          payment_status: "refunded",
          order_status: "refunded",
        })
        .eq("id", payload.orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true, order: orderData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid admin action type." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
