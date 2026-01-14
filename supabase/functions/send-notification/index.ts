/**
 * Supabase Edge Function: Send Push Notification
 * Sends notifications via OneSignal API
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

interface NotificationPayload {
  user_id: string;
  notification_type: "item_claimed" | "price_drop" | "back_in_stock" | "due_date_reminder" | "friend_request";
  title: string;
  body: string;
  data?: Record<string, any>;
  // For item_claimed, respects notification_level setting
  list_notification_level?: "none" | "who_only" | "what_only" | "both";
  claimer_name?: string;
  product_name?: string;
}

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
    const payload: NotificationPayload = await req.json();

    // Get Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if notification should be suppressed based on list privacy settings
    if (payload.notification_type === "item_claimed" && payload.list_notification_level) {
      const level = payload.list_notification_level;

      if (level === "none") {
        return new Response(
          JSON.stringify({ success: true, skipped: "notifications disabled for this list" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Modify notification content based on privacy level
      if (level === "who_only") {
        payload.body = `${payload.claimer_name} claimed an item from your wishlist`;
      } else if (level === "what_only") {
        payload.body = `Someone claimed "${payload.product_name}" from your wishlist`;
      }
      // "both" shows full message as-is
    }

    // Get user's active push tokens
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from("user_push_tokens")
      .select("onesignal_player_id")
      .eq("user_id", payload.user_id)
      .eq("is_active", true);

    if (tokenError) {
      console.error("Token lookup error:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to lookup tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens?.length) {
      // No tokens - still save to history but don't send push
      await supabaseAdmin.from("notification_history").insert({
        user_id: payload.user_id,
        notification_type: payload.notification_type,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      });

      return new Response(
        JSON.stringify({ success: true, push_sent: false, reason: "No active push tokens" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const playerIds = tokens.map((t) => t.onesignal_player_id);

    // Send via OneSignal API
    const onesignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: payload.title },
        contents: { en: payload.body },
        data: {
          type: payload.notification_type,
          ...payload.data,
        },
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
      }),
    });

    const onesignalResult = await onesignalResponse.json();

    // Store in notification history
    await supabaseAdmin.from("notification_history").insert({
      user_id: payload.user_id,
      notification_type: payload.notification_type,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    });

    return new Response(
      JSON.stringify({ success: true, push_sent: true, onesignal: onesignalResult }),
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
