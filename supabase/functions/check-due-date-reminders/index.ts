/**
 * Supabase Edge Function: Check Due Date Reminders
 * Run daily at 9 AM to check for upcoming key dates
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REMINDER_DAYS = [60, 30, 15];

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

    const today = new Date();
    let remindersSent = 0;

    for (const days of REMINDER_DAYS) {
      // Calculate target date
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      // Find lists with key_date matching target
      const { data: lists, error } = await supabaseAdmin
        .from("lists")
        .select("id, user_id, name, key_date")
        .eq("key_date", targetDateStr);

      if (error) {
        console.error(`Error fetching lists for ${days} days:`, error);
        continue;
      }

      for (const list of lists || []) {
        try {
          // Check if we already sent this reminder
          const { data: existing } = await supabaseAdmin
            .from("notification_history")
            .select("id")
            .eq("user_id", list.user_id)
            .eq("notification_type", "due_date_reminder")
            .contains("data", { list_id: list.id, days_before: days })
            .single();

          if (existing) {
            // Already sent this reminder
            continue;
          }

          // Format the key date for display
          const keyDate = new Date(list.key_date);
          const formattedDate = keyDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

          // Send reminder
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
                notification_type: "due_date_reminder",
                title: `${days} Days Until ${list.name}!`,
                body: `Your wishlist "${list.name}" has a key date on ${formattedDate}. Share it with friends and family!`,
                data: {
                  list_id: list.id,
                  list_name: list.name,
                  days_before: days,
                  key_date: list.key_date,
                },
              }),
            }
          );

          if (sendResponse.ok) {
            remindersSent++;
          }
        } catch (listError) {
          console.error("Error processing list reminder:", listError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: remindersSent }),
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
