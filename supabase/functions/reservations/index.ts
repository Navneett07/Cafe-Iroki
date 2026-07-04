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
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Optionally identify authenticated user
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

    const body = await req.json();
    const action = body.action;

    if (action === "create") {
      const { guestName, phone, date, time, guests, location, specialRequests, tableNumber } = body;

      // Validate required fields
      if (!guestName || !phone || !date || !time || !guests || !location) {
        return new Response(
          JSON.stringify({ error: "Name, phone, date, time, guests, and location are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: resData, error: insertError } = await serviceClient
        .from("reservations")
        .insert({
          user_id: userId, // null for guests
          guest_name: guestName,
          phone,
          date,
          time,
          guests,
          location,
          table_number: tableNumber || null,
          special_requests: specialRequests || null,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, reservation: resData }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "cancel") {
      const { reservationId } = body;

      // For cancellation, require auth
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Authentication required to cancel a reservation." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: resData, error: updateError } = await serviceClient
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Reservation not found or unauthorized to cancel." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, reservation: resData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action type." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
