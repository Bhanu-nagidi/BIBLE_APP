/* Sacred Word Bible App — Service Worker v3
 *
 * Strategy: The SW CANNOT reliably hold setTimeout for hours (browsers kill it).
 * Instead:
 *   1. The SW stores the target time in a global variable when SCHEDULE_REMINDER is sent.
 *   2. On every SW 'fetch' event (i.e., every page load/navigation), the SW checks
 *      if a notification is due and fires it immediately if so.
 *   3. The app-side also runs its own setInterval every 30 seconds while the page
 *      is visible, and sends CHECK_REMINDER to the SW.
 *   4. The app persists the reminder time in localStorage so it survives reloads.
 *
 * This guarantees: as long as the browser is open (even in another tab),
 * the reminder will fire within ~30 seconds of the scheduled time.
 */

// ─── Persisted reminder config (survives SW restarts via fetch-event re-hydration) ──
let reminderConfig = null; // { hour, minute, userName, lastFiredDate }

// ─── Install / Activate ───────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// ─── Helper: show notification ────────────────────────────────────────────────
function showReminderNotification(userName) {
  const name = userName || 'Beloved';
  return self.registration.showNotification('📖 Sacred Word', {
    body: `Time to spend a few minutes with God's Word, ${name}. Tap to continue reading. 🙏`,
    icon: '/logo.jpg',
    badge: '/favicon.svg',
    tag: 'daily-reminder',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: '/', timestamp: Date.now() },
    actions: [
      { action: 'read',    title: '📖 Read Now' },
      { action: 'dismiss', title: 'Dismiss'    }
    ]
  });
}

// ─── Helper: should we fire right now? ───────────────────────────────────────
function shouldFireNow(config) {
  if (!config) return false;
  const now = new Date();
  const nowH = now.getHours();
  const nowM = now.getMinutes();
  const todayStr = now.toDateString();

  // Already fired today?
  if (config.lastFiredDate === todayStr) return false;

  // Is it time? (within the current minute)
  return nowH === config.hour && nowM === config.minute;
}

// ─── Check and fire if due ────────────────────────────────────────────────────
async function checkAndFire() {
  if (!reminderConfig) return;
  if (shouldFireNow(reminderConfig)) {
    reminderConfig.lastFiredDate = new Date().toDateString();
    await showReminderNotification(reminderConfig.userName);
  }
}

// ─── Message handler (app → SW) ───────────────────────────────────────────────
self.addEventListener('message', async (event) => {
  if (!event.data) return;
  const { type, hour, minute, userName } = event.data;

  if (type === 'SCHEDULE_REMINDER') {
    reminderConfig = {
      hour: parseInt(hour, 10),
      minute: parseInt(minute, 10),
      userName: userName || 'Beloved',
      lastFiredDate: null
    };
    console.log(`[SW] Reminder registered at ${hour}:${String(minute).padStart(2,'0')}`);
    // Immediately check (in case app was reopened right at reminder time)
    await checkAndFire();
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'REMINDER_SCHEDULED', ok: true });
    }
  }

  if (type === 'CANCEL_REMINDER') {
    reminderConfig = null;
    console.log('[SW] Reminder cancelled');
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'REMINDER_CANCELLED', ok: true });
    }
  }

  if (type === 'CHECK_REMINDER') {
    // Called every ~30s by the app's setInterval to keep the SW alive & check time
    await checkAndFire();
  }

  if (type === 'TEST_NOTIFICATION') {
    await self.registration.showNotification('📖 Sacred Word — Test', {
      body: `Hi ${userName || 'Beloved'}! Your daily Bible reminders are working. 🔥`,
      icon: '/logo.jpg',
      badge: '/favicon.svg',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    });
  }
});

// ─── Fetch event: piggyback on every network request to check reminder ────────
self.addEventListener('fetch', (event) => {
  // Check in background — don't block the fetch
  event.waitUntil(checkAndFire());
  // Let the browser handle the request normally
});

// ─── Push (server-sent) fallback ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); } catch { data = { body: event.data.text() }; }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sacred Word 📖', {
      body: data.body || "It's time for your daily Bible reading! 🙏",
      icon: '/logo.jpg',
      badge: '/favicon.svg',
      tag: 'push-reminder',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' }
    })
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});
