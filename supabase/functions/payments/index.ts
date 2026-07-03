import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Clean dependency-free Web Crypto HMAC SHA256 helper
 */
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rzpKeyId = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_placeholder";
  const rzpKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "rzp_test_secret_placeholder";

  try {
    const authHeader = req.headers.get("Authorization");
    
    // Check if this is a webhook request (authenticated via signature header instead of JWT)
    const rzpSignatureHeader = req.headers.get("X-Razorpay-Signature");
    
    if (rzpSignatureHeader) {
      // ----------------------------------------------------
      // RAZORPAY WEBHOOK PROCESSING
      // ----------------------------------------------------
      const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "webhook_secret_placeholder";
      const rawBody = await req.text();
      
      const expectedSignature = await hmacSha256(rawBody, webhookSecret);
      
      if (expectedSignature !== rzpSignatureHeader) {
        return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const eventData = JSON.parse(rawBody);
      const paymentEntity = eventData.payload?.payment?.entity;
      
      if (eventData.event === "payment.captured" && paymentEntity) {
        const orderId = paymentEntity.notes?.orderId || paymentEntity.receipt;
        
        if (orderId) {
          const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          // Update payment state
          await supabaseClient
            .from("orders")
            .update({
              payment_status: "paid",
              payment_id: paymentEntity.id,
              razorpay_order_id: paymentEntity.order_id,
            })
            .eq("id", orderId);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Standard client requests require JWT token validation
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

    const body = await req.json();
    const { action } = body;

    // A. Action: Create Razorpay Order
    if (action === "create_payment_order") {
      const { orderId } = body;
      
      const { data: order, error: orderErr } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderErr || !order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create order via Razorpay API
      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${rzpKeyId}:${rzpKeySecret}`),
        },
        body: JSON.stringify({
          amount: Math.round(Number(order.total) * 100), // in paise
          currency: "INR",
          receipt: orderId,
          notes: {
            orderId: orderId,
            userId: user.id,
          },
        }),
      });

      if (!rzpResponse.ok) {
        const errText = await rzpResponse.text();
        throw new Error(`Razorpay Order creation failed: ${errText}`);
      }

      const rzpOrder = await rzpResponse.json();

      // Update database orders row
      await supabaseClient
        .from("orders")
        .update({ razorpay_order_id: rzpOrder.id })
        .eq("id", orderId);

      return new Response(JSON.stringify({ success: true, razorpayOrderId: rzpOrder.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // B. Action: Verify Signature
    if (action === "verify_signature") {
      const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

      const generatedSignature = await hmacSha256(
        razorpayOrderId + "|" + razorpayPaymentId,
        rzpKeySecret
      );

      if (generatedSignature !== razorpaySignature) {
        return new Response(JSON.stringify({ error: "Payment signature mismatch." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update DB
      const { data: order, error: updateErr } = await supabaseClient
        .from("orders")
        .update({
          payment_status: "paid",
          payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          razorpay_order_id: razorpayOrderId,
        })
        .eq("id", orderId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true, order }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // C. Action: Refund (Admin Only)
    if (action === "refund") {
      const { orderId, amount } = body;

      // Verify admin role
      const { data: adminRole } = await supabaseClient
        .from("admin_users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!adminRole || adminRole.role !== "admin") {
        return new Response(JSON.stringify({ error: "Access Denied: Admins only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: order } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!order || !order.payment_id) {
        return new Response(JSON.stringify({ error: "Order payment ID missing." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Call Razorpay Refund API
      const refundBody: any = {};
      if (amount) {
        refundBody.amount = Math.round(amount * 100); // partial refund amount
      }

      const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${order.payment_id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${rzpKeyId}:${rzpKeySecret}`),
        },
        body: JSON.stringify(refundBody),
      });

      if (!refundResponse.ok) {
        const errText = await refundResponse.text();
        throw new Error(`Refund initiation failed: ${errText}`);
      }

      const refundData = await refundResponse.json();

      // Update DB orders row
      await supabaseClient
        .from("orders")
        .update({
          payment_status: "refunded",
          order_status: "refunded",
          razorpay_refund_id: refundData.id,
        })
        .eq("id", orderId);

      return new Response(JSON.stringify({ success: true, refundId: refundData.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid payment action." }), {
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
