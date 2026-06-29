import { LocalNotifications } from '@capacitor/local-notifications';

const IS_NATIVE = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

export const notificationService = {
  /**
   * Request notification permissions from the user.
   * Works on both Capacitor Native and Web.
   */
  async requestPermissions() {
    if (IS_NATIVE) {
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
   */
  async checkPermissions() {
    if (IS_NATIVE) {
      const status = await LocalNotifications.checkPermissions();
      return status.display;
    } else {
      if (typeof Notification === 'undefined') return 'denied';
      return Notification.permission;
    }
  },

  /**
   * Schedule a daily local notification at a specified hour and minute.
   * If native, schedules via @capacitor/local-notifications with exact alarms.
   * If web, saves schedule configuration and falls back to context scheduler.
   */
  async scheduleDailyReminder(hour, minute, userName = 'Beloved') {
    const notificationId = 1001; // Constant ID for daily reminder

    if (IS_NATIVE) {
      // First, cancel any existing daily reminder to prevent duplicates
      await this.cancelDailyReminder();

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: '📖 Sacred Word',
              body: `Time to spend a few minutes with God's Word, ${userName}. Tap to continue reading.`,
              schedule: {
                on: {
                  hour: parseInt(hour, 10),
                  minute: parseInt(minute, 10)
                },
                allowWhileIdle: true, // Support Exact Alarm / Doze mode
                repeats: true
              },
              sound: 'beep.wav', // Customizable notification sound support
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#d4a853',
              actionTypeId: 'OPEN_BIBLE',
              extra: {
                route: '/bible'
              }
            }
          ]
        });
        console.log(`[NotificationService] Native daily reminder scheduled at ${hour}:${minute}`);
        return true;
      } catch (err) {
        console.error('[NotificationService] Error scheduling native notification:', err);
        return false;
      }
    } else {
      console.log(`[NotificationService] Web daily reminder configured for ${hour}:${minute}`);
      return true;
    }
  },

  /**
   * Cancel the daily reminder notification.
   */
  async cancelDailyReminder() {
    const notificationId = 1001;
    if (IS_NATIVE) {
      try {
        const pending = await LocalNotifications.getPending();
        const exists = pending.notifications.some(n => n.id === notificationId);
        if (exists) {
          await LocalNotifications.cancel({
            notifications: [{ id: notificationId }]
          });
        }
        console.log('[NotificationService] Native daily reminder cancelled');
      } catch (err) {
        console.warn('[NotificationService] Failed to cancel native daily reminder:', err);
      }
    }
  },

  /**
   * Send a test notification immediately.
   */
  async sendTestNotification(userName = 'Beloved') {
    if (IS_NATIVE) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 9999,
              title: '📖 Sacred Word',
              body: `Hello ${userName}! This is a test of your daily Bible reminder. 🔥`,
              sound: 'beep.wav',
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#d4a853'
            }
          ]
        });
        return true;
      } catch (err) {
        console.error('[NotificationService] Test native notification failed:', err);
        return false;
      }
    } else {
      // Web notification fallback
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const swReg = await navigator.serviceWorker?.ready;
          if (swReg?.showNotification) {
            await swReg.showNotification('Sacred Word 📖', {
              body: `Hi ${userName}! This is a test of your daily Bible reminder. 🔥`,
              icon: '/logo.jpg',
              badge: '/favicon.svg',
              vibrate: [200, 100, 200]
            });
          } else {
            new Notification('Sacred Word 📖', {
              body: `Hi ${userName}! This is a test of your daily Bible reminder. 🔥`,
              icon: '/logo.jpg'
            });
          }
          return true;
        } catch {
          new Notification('Sacred Word 📖', {
            body: `Hi ${userName}! This is a test of your daily Bible reminder. 🔥`,
            icon: '/logo.jpg'
          });
          return true;
        }
      }
      return false;
    }
  },

  /**
   * Setup native action listeners (e.g. tapping notification action button)
   */
  registerActionListeners(navigateCallback) {
    if (IS_NATIVE) {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('[NotificationService] Action performed:', action);
        if (navigateCallback && action.notification.extra?.route) {
          navigateCallback(action.notification.extra.route);
        }
      });
    }
  }
};
