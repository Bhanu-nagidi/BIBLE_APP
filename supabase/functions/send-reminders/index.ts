// Scheduled Edge Function — invoked every minute by a pg_cron job.
// Finds every push subscription whose next_trigger_utc has passed, sends the
// Web Push notification, and rolls the trigger forward by 24 hours.
//
// Deploy with: supabase functions deploy send-reminders --no-verify-jwt
// (--no-verify-jwt because pg_cron calls this with a shared secret, not a user JWT)

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
const CRON_SECRET = Deno.env.get("CRON_SECRET");

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("reminder_on", true)
    .lte("next_trigger_utc", nowIso);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let cleaned = 0;

  await Promise.allSettled(
    (due ?? []).map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      const payload = JSON.stringify({
        title: "📖 Sacred Word",
        body: `Time to spend a few minutes with God's Word, ${row.user_name || "Beloved"}. Tap to continue reading. 🙏`,
        url: "/bible",
      });

      try {
        await webpush.sendNotification(subscription, payload);
        sent++;

        const next = new Date(row.next_trigger_utc);
        next.setUTCDate(next.getUTCDate() + 1);
        await supabase
          .from("push_subscriptions")
          .update({ next_trigger_utc: next.toISOString(), last_sent_at: nowIso })
          .eq("id", row.id);
      } catch (err) {
        // 404/410 = the browser/device revoked the subscription — stop targeting it.
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
          cleaned++;
        } else {
          console.error("push failed for subscription", row.id, err);
        }
      }
    }),
  );

  return new Response(JSON.stringify({ due: due?.length ?? 0, sent, cleaned }), {
    headers: { "Content-Type": "application/json" },
  });
});
