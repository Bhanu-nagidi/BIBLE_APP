/* Sacred Word Bible App - Service Worker
 * Handles background push notifications for daily Bible reminders.
 */

const CACHE_NAME = 'sacred-word-sw-v1'

// Install event - activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push notification event - fired when a push message is received
self.addEventListener('push', (event) => {
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'Sacred Word 📖', body: event.data.text() }
    }
  }

  const title = data.title || 'Sacred Word 📖'
  const options = {
    body: data.body || "It's time for your daily Bible reading. Keep your streak alive! 🔥",
    icon: '/logo.jpg',
    badge: '/favicon.svg',
    tag: 'daily-reminder',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'read', title: '📖 Read Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  // Open or focus the app
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})

// Background sync for scheduling (future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'reminder-check') {
    event.waitUntil(checkAndFireReminder())
  }
})

async function checkAndFireReminder() {
  // This fires when the browser regains connectivity or on sync
  // For now just a placeholder - actual scheduling is done via setTimeout in the app
}

// Message handler - receives messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    const { time, userName } = event.data
    // Store reminder config for use in push events
    // (Actual scheduling is handled in-app via setTimeout)
    console.log('[SW] Reminder config received:', time, userName)
  }
})
