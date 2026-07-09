import { LocalNotifications } from '@capacitor/local-notifications';

// ─── Native vs Web detection ──────────────────────────────────────────────────
// Do NOT cache as a top-level const — the Capacitor bridge may attach to `window`
// after this module is evaluated, causing a stale `false` forever.
function isNative() {
  return typeof window !== 'undefined' && !!window.Capacitor && window.Capacitor.isNativePlatform();
}

// ─── Service Worker helpers (web only) ───────────────────────────────────────
let _swReg = null;

async function getSwRegistration() {
  if (_swReg) return _swReg;
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Register our service worker if not already done
    _swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Wait for it to become active
    if (_swReg.installing || _swReg.waiting) {
      await new Promise((resolve) => {
        const sw = _swReg.installing || _swReg.waiting;
        sw.addEventListener('statechange', function onState() {
          if (sw.state === 'activated') { sw.removeEventListener('statechange', onState); resolve(); }
        });
        // Fallback timeout in case statechange never fires
        setTimeout(resolve, 3000);
      });
    }
    return _swReg;
  } catch (err) {
    console.warn('[NotificationService] SW registration failed:', err);
    return null;
  }
}

/** Send a message to the active service worker. */
async function sendToSw(message) {
  const reg = await getSwRegistration();
  const sw = reg?.active || reg?.installing || reg?.waiting;
  if (!sw) {
    console.warn('[NotificationService] No active SW to send message to.');
    return false;
  }
  sw.postMessage(message);
  return true;
}

/** Send a CHECK_REMINDER heartbeat — called every ~30s by the app to keep SW alive. */
export async function sendReminderHeartbeat() {
  return sendToSw({ type: 'CHECK_REMINDER' });
}

/**
 * App-side time check — reads reminder config from localStorage and fires
 * a direct Notification if the SW is unavailable and it's time.
 * Called by the setInterval in useReminder.
 */
export function appSideReminderCheck() {
  try {
    const raw = localStorage.getItem('sw_reminder_config');
    if (!raw) return;
    const config = JSON.parse(raw);
    if (!config || !config.on) return;
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const todayStr = now.toDateString();
    if (config.lastFiredDate === todayStr) return;
    if (h === config.hour && m === config.minute) {
      // Mark fired so we don't double-fire
      config.lastFiredDate = todayStr;
      localStorage.setItem('sw_reminder_config', JSON.stringify(config));
      // Try SW first, fallback to direct Notification API
      sendToSw({ type: 'CHECK_REMINDER' }).catch(() => {});
      // Direct fallback
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('📖 Sacred Word', {
            body: `Time to spend a few minutes with God's Word, ${config.userName || 'Beloved'}. Tap to continue reading. 🙏`,
            icon: '/logo.jpg',
            tag: 'daily-reminder'
          });
        } catch (e) { /* ignore */ }
      }
    }
  } catch (e) { /* ignore parse errors */ }
}

// ─── Notification Service ─────────────────────────────────────────────────────
export const notificationService = {

  /**
   * Request notification permissions.
   * Works on both Capacitor Native and Web (including Service Worker push).
   */
  async requestPermissions() {
    if (isNative()) {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return true;
      const reqStatus = await LocalNotifications.requestPermissions();
      return reqStatus.display === 'granted';
    } else {
      if (typeof Notification === 'undefined') return false;
      if (Notification.permission === 'granted') return true;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  },

  /**
   * Check current notification permission status.
   * Returns: 'granted' | 'denied' | 'default'
   */
  async checkPermissions() {
    if (isNative()) {
      const status = await LocalNotifications.checkPermissions();
      return status.display;
    } else {
      if (typeof Notification === 'undefined') return 'denied';
      return Notification.permission;
    }
  },

  /**
   * Schedule a daily local notification at hour:minute.
   * - Native: uses @capacitor/local-notifications
   * - Web: sends a SCHEDULE_REMINDER message to the Service Worker, which
   *   sets a setTimeout internally so it fires even when the app tab is closed.
   */
  async scheduleDailyReminder(hour, minute, userName = 'Beloved') {
    const notificationId = 1001;

    if (isNative()) {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') {
          console.warn('[NotificationService] Cannot schedule: permission not granted');
          return false;
        }
      }

      // Cancel any existing reminder first to prevent duplicates
      await this.cancelDailyReminder();

      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: notificationId,
            title: '📖 Sacred Word',
            body: `Time to spend a few minutes with God's Word, ${userName}. Tap to continue reading.`,
            schedule: {
              on: { hour: parseInt(hour, 10), minute: parseInt(minute, 10) },
              every: 'day',
              allowWhileIdle: true
            },
            sound: 'beep.wav',
            iconColor: '#4ebfa9',
            extra: { route: '/bible' }
          }]
        });
        console.log(`[NotificationService] Native reminder scheduled at ${hour}:${minute}`);
        return true;
      } catch (err) {
        console.error('[NotificationService] Error scheduling native notification:', err);
        return false;
      }

    } else {
      // Web path — delegate to Service Worker
      const perm = await this.checkPermissions();
      if (perm !== 'granted') {
        console.warn('[NotificationService] Web: permission not granted, cannot schedule');
        return false;
      }

      const ok = await sendToSw({
        type: 'SCHEDULE_REMINDER',
        hour: parseInt(hour, 10),
        minute: parseInt(minute, 10),
        userName
      });

      // Also persist config in localStorage so app-side check loop works
      // even if the SW was killed and hasn't re-hydrated yet.
      try {
        const existing = JSON.parse(localStorage.getItem('sw_reminder_config') || '{}')
        localStorage.setItem('sw_reminder_config', JSON.stringify({
          on: true,
          hour: parseInt(hour, 10),
          minute: parseInt(minute, 10),
          userName,
          lastFiredDate: existing.lastFiredDate || null
        }));
      } catch(e) {}

      if (ok) {
        console.log(`[NotificationService] Web reminder scheduled at ${hour}:${String(minute).padStart(2, '0')} via SW`);
      }
      return ok;
    }
  },

  /**
   * Cancel the daily reminder notification.
   */
  async cancelDailyReminder() {
    const notificationId = 1001;
    if (isNative()) {
      try {
        const pending = await LocalNotifications.getPending();
        const exists = pending.notifications.some(n => n.id === notificationId);
        if (exists) {
          await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
        }
        console.log('[NotificationService] Native reminder cancelled');
      } catch (err) {
        console.warn('[NotificationService] Failed to cancel native reminder:', err);
      }
    } else {
      await sendToSw({ type: 'CANCEL_REMINDER' });
      // Clear app-side config too
      try {
        const raw = localStorage.getItem('sw_reminder_config');
        if (raw) {
          const cfg = JSON.parse(raw);
          cfg.on = false;
          localStorage.setItem('sw_reminder_config', JSON.stringify(cfg));
        }
      } catch(e) {}
    }
  },

  /**
   * Send an immediate test notification.
   * Returns true only if the notification was actually sent successfully.
   */
  async sendTestNotification(userName = 'Beloved') {
    if (isNative()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== 'granted') {
            console.warn('[NotificationService] Test notification blocked: permission not granted');
            return false;
          }
        }
        await LocalNotifications.schedule({
          notifications: [{
            id: 9999,
            title: '📖 Sacred Word',
            body: `Hello ${userName}! This is a test of your daily Bible reminder. 🔥`,
            sound: 'beep.wav',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#d4a853'
          }]
        });
        return true;
      } catch (err) {
        console.error('[NotificationService] Test native notification failed:', err);
        return false;
      }

    } else {
      // Web path
      const perm = await this.checkPermissions();
      if (perm !== 'granted') return false;

      // Try via the SW first (preferred — works in more browsers)
      const swOk = await sendToSw({ type: 'TEST_NOTIFICATION', userName });
      if (swOk) return true;

      // Fallback: direct Notification API
      try {
        new Notification('📖 Sacred Word — Test', {
          body: `Hi ${userName}! Your daily Bible reminders are working. 🔥`,
          icon: '/logo.jpg'
        });
        return true;
      } catch {
        return false;
      }
    }
  },

  /**
   * Register listeners for notification action button taps (native only).
   */
  registerActionListeners(navigateCallback) {
    if (isNative()) {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('[NotificationService] Action performed:', action);
        if (navigateCallback && action.notification.extra?.route) {
          navigateCallback(action.notification.extra.route);
        }
      });
    }
  }
};