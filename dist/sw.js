/* Sacred Word Bible App - Service Worker v2
 * Handles local scheduled daily Bible reminder notifications entirely inside the SW.
 * This means the notification fires even if the app tab is closed, as long as the
 * browser itself is running.
 *
 * Message API (from the app → SW):
 *   { type: 'SCHEDULE_REMINDER', hour: 8, minute: 30, userName: 'John' }
 *   { type: 'CANCEL_REMINDER' }
 *   { type: 'TEST_NOTIFICATION', userName: 'John' }
 */

// ─── State ───────────────────────────────────────────────────────────────────
let reminderTimer = null;
let reminderConfig = null; // { hour, minute, userName }

// ─── Install / Activate ───────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// ─── Helper: show a notification ─────────────────────────────────────────────
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
      { action: 'read', title: '📖 Read Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
}

// ─── Helper: ms until a given HH:MM today (or tomorrow) ─────────────────────
function getMsUntil(hour, minute) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1); // already passed → schedule for tomorrow
  }
  return target.getTime() - now.getTime();
}

// ─── Schedule the daily loop ──────────────────────────────────────────────────
function scheduleDailyTimer() {
  if (!reminderConfig) return;

  // Clear any existing timer
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }

  const { hour, minute, userName } = reminderConfig;
  const ms = getMsUntil(hour, minute);

  console.log(`[SW] Reminder scheduled in ${Math.round(ms / 60000)} min for ${hour}:${String(minute).padStart(2,'0')}`);

  reminderTimer = setTimeout(async () => {
    // Fire the notification
    await showReminderNotification(userName);
    // Re-schedule for the next day (24 h from now)
    reminderTimer = setTimeout(() => scheduleDailyTimer(), 24 * 60 * 60 * 1000 - 5000);
  }, ms);
}

// ─── Cancel the daily loop ────────────────────────────────────────────────────
function cancelDailyTimer() {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
  reminderConfig = null;
  console.log('[SW] Reminder cancelled');
}

// ─── Message handler (app → SW) ───────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, hour, minute, userName } = event.data;

  if (type === 'SCHEDULE_REMINDER') {
    reminderConfig = { hour, minute, userName };
    scheduleDailyTimer();
    // Reply so the caller knows the SW is alive and received the request
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'REMINDER_SCHEDULED', ok: true });
    }
  }

  if (type === 'CANCEL_REMINDER') {
    cancelDailyTimer();
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: 'REMINDER_CANCELLED', ok: true });
    }
  }

  if (type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('📖 Sacred Word — Test', {
      body: `Hi ${userName || 'Beloved'}! Your daily Bible reminders are working. 🔥`,
      icon: '/logo.jpg',
      badge: '/favicon.svg',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    });
  }
});

// ─── Push (server-sent) fallback ──────────────────────────────────────────────
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
