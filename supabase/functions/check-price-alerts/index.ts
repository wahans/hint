/**
 * Supabase Edge Function: Check Price Alerts
 * Run hourly via cron to check for triggered price alerts
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get triggered price alerts using existing RPC function
    const { data: alerts, error } = await supabaseAdmin.rpc("check_price_alerts");

    if (error) {
      console.error("Error checking price alerts:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, alerts_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let alertsSent = 0;

    // Send notification for each triggered alert
    for (const alert of alerts) {
      try {
        // Get list owner's user_id
        const { data: list } = await supabaseAdmin
          .from("lists")
          .select("user_id, name")
          .eq("id", alert.list_id)
          .single();

        if (!list) continue;

        // Call send-notification function
        const sendResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: list.user_id,
              notification_type: "price_drop",
              title: "Price Drop Alert!",
              body: `${alert.product_name || "An item"} dropped to $${alert.current_price.toFixed(2)} (your target: $${alert.target_price.toFixed(2)})`,
              data: {
                product_id: alert.product_id,
                list_id: alert.list_id,
                list_name: list.name,
                current_price: alert.current_price,
                target_price: alert.target_price,
              },
            }),
          }
        );

        if (sendResponse.ok) {
          alertsSent++;

          // Clear the target_price to prevent repeat notifications
          await supabaseAdmin
            .from("products")
            .update({ target_price: null })
            .eq("id", alert.product_id);
        }
      } catch (alertError) {
        console.error("Error processing alert:", alertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, alerts_found: alerts.length, alerts_sent: alertsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
