import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateReservationPayload {
  action: "create";
  guestName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  location: "indoor" | "outdoor" | "balcony";
  specialRequests?: string;
}

interface CancelReservationPayload {
  action: "cancel";
  reservationId: string;
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

    const body = await req.json();
    const action = body.action;

    if (action === "create") {
      const payload: CreateReservationPayload = body;
      
      // Insert reservation
      const { data: resData, error: insertError } = await supabaseClient
        .from("reservations")
        .insert({
          user_id: user.id,
          guest_name: payload.guestName,
          email: payload.email,
          phone: payload.phone,
          date: payload.date,
          time: payload.time,
          guests: payload.guests,
          location: payload.location,
          special_requests: payload.specialRequests || null,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, reservation: resData }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "cancel") {
      const payload: CancelReservationPayload = body;

      // Update reservation status to cancelled (enforced RLS check makes sure users can only alter their own)
      const { data: resData, error: updateError } = await supabaseClient
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", payload.reservationId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: "Reservation not found or unauthorized to cancel." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, reservation: resData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action type." }), {
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
