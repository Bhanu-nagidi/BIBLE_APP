import { supabase } from '../lib/supabase';

// Converts the URL-safe base64 VAPID public key into the Uint8Array
// format the Push API's applicationServerKey expects.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// The reminder is a wall-clock time (e.g. "8:00 AM") in the user's own timezone.
// Storing the next fire time as an absolute UTC instant — rather than a bare
// hour/minute — lets the server-side cron job fire it correctly without ever
// needing to know the user's timezone.
function computeNextTriggerUTC(hour, minute) {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

export const pushSubscriptionService = {
  isSupported() {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Subscribes this browser to Web Push and upserts the subscription (plus the
   * reminder schedule) into Supabase, so the send-reminders cron job can reach
   * this device even when the app is fully closed.
   */
  async subscribe(userId, hour, minute, userName) {
    if (!supabase || !userId || !this.isSupported()) return false;

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('[PushSubscriptionService] Missing VITE_VAPID_PUBLIC_KEY — cannot subscribe to push.');
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      const json = sub.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_name: userName,
        reminder_hour: parseInt(hour, 10),
        reminder_minute: parseInt(minute, 10),
        reminder_on: true,
        next_trigger_utc: computeNextTriggerUTC(parseInt(hour, 10), parseInt(minute, 10))
      }, { onConflict: 'endpoint' });

      if (error) {
        console.warn('[PushSubscriptionService] Failed to save subscription:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[PushSubscriptionService] subscribe failed:', err);
      return false;
    }
  },

  /**
   * Turns off push delivery for this user. Disables every subscription row for
   * the account (covers the case where they enabled reminders on more than one
   * device/browser), and unsubscribes this browser's own subscription.
   */
  async unsubscribe(userId) {
    if (!supabase || !userId) return;

    try {
      await supabase.from('push_subscriptions').update({ reminder_on: false }).eq('user_id', userId);

      if (this.isSupported()) {
        const reg = await navigator.serviceWorker.getRegistration('/');
        const sub = await reg?.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
    } catch (err) {
      console.warn('[PushSubscriptionService] unsubscribe failed:', err);
    }
  }
};
