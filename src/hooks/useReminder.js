import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, sendReminderHeartbeat, appSideReminderCheck } from '../services/notificationService';
import { syncService } from '../services/syncService';

export function useReminder(user, isGuest, showToast) {
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [permissionStatus, setPermissionStatus] = useState('default');

  // ─── 1. Load saved state on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || isGuest) {
      setReminderOn(false);
      return;
    }

    const onKey  = `reminder_on_${user.id}`;
    const timeKey = `reminder_time_${user.id}`;

    const savedOn   = localStorage.getItem(onKey) === 'true';
    const savedTime = localStorage.getItem(timeKey) || '08:00';

    setReminderOn(savedOn);
    setReminderTime(savedTime);

    // Refresh permission status
    notificationService.checkPermissions().then(setPermissionStatus);

    // If reminder was ON, re-send the schedule to the SW (in case the SW was
    // restarted / updated since the last visit).
    if (savedOn) {
      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';
      const [h, m]   = savedTime.split(':');
      notificationService.scheduleDailyReminder(h, m, userName).catch(console.warn);
    }
  }, [user?.id, isGuest]);

  // ─── 2. 30-second heartbeat — keeps SW alive and checks time precisely ──────
  useEffect(() => {
    if (!reminderOn || isGuest || !user?.id) return;

    // Immediate check on mount/toggle
    appSideReminderCheck();
    sendReminderHeartbeat().catch(() => {});

    const interval = setInterval(() => {
      // App-side check — works even if SW is dead
      appSideReminderCheck();
      // SW heartbeat — wakes SW and triggers its own check
      sendReminderHeartbeat().catch(() => {});
    }, 30_000); // every 30 seconds

    return () => clearInterval(interval);
  }, [reminderOn, isGuest, user?.id]);

  // ─── 2. Toggle Reminder ON / OFF ────────────────────────────────────────────
  const toggleReminder = useCallback(async () => {
    if (isGuest || !user?.id) {
      showToast('Daily reminders are only available for registered accounts. Please sign in!');
      return;
    }

    const onKey = `reminder_on_${user.id}`;

    if (!reminderOn) {
      // ── Turn ON ──────────────────────────────────────────────────────────────
      const granted = await notificationService.requestPermissions();
      const updatedStatus = await notificationService.checkPermissions();
      setPermissionStatus(updatedStatus);

      if (!granted) {
        showToast('Please enable notification permissions in your browser / device settings.');
        return;
      }

      localStorage.setItem(onKey, 'true');
      setReminderOn(true);

      syncService.updateDebounced(user.id, 'reminders', { on: true, time: reminderTime });

      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';
      const [h, m]   = reminderTime.split(':');
      const scheduled = await notificationService.scheduleDailyReminder(h, m, userName);

      if (scheduled) {
        showToast('⏰ Daily reminder enabled!');
      } else {
        showToast('Could not schedule reminder. Check notification permissions.');
      }

    } else {
      // ── Turn OFF ─────────────────────────────────────────────────────────────
      localStorage.setItem(onKey, 'false');
      setReminderOn(false);

      syncService.updateDebounced(user.id, 'reminders', { on: false, time: reminderTime });

      await notificationService.cancelDailyReminder();
      showToast('Reminder turned off.');
    }
  }, [reminderOn, reminderTime, user?.id, user?.user_metadata?.name, user?.email, isGuest, showToast]);

  // ─── 3. Change Time & Reschedule ────────────────────────────────────────────
  const changeReminderTime = useCallback(async (newTimeStr) => {
    if (!user?.id) return;
    const timeKey = `reminder_time_${user.id}`;

    localStorage.setItem(timeKey, newTimeStr);
    setReminderTime(newTimeStr);

    syncService.updateDebounced(user.id, 'reminders', { on: reminderOn, time: newTimeStr });

    if (reminderOn && !isGuest) {
      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';
      const [h, m]   = newTimeStr.split(':');
      await notificationService.scheduleDailyReminder(h, m, userName);
      showToast(`⏰ Reminder rescheduled!`);
    }
  }, [reminderOn, user?.id, user?.user_metadata?.name, user?.email, isGuest, showToast]);

  // ─── 4. Manual Test ─────────────────────────────────────────────────────────
  const triggerTestNotification = useCallback(async () => {
    if (!user?.id) return;
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';
    const sent = await notificationService.sendTestNotification(userName);

    // Refresh permission status — it may have changed while we were asking
    const updatedStatus = await notificationService.checkPermissions();
    setPermissionStatus(updatedStatus);

    if (sent) {
      showToast('Test notification sent! ✅');
    } else {
      showToast('Could not send notification. Check permissions in browser/device settings.');
    }
  }, [user?.id, user?.user_metadata?.name, user?.email, showToast]);

  return {
    reminderOn,
    reminderTime,
    permissionStatus,
    toggleReminder,
    changeReminderTime,
    triggerTestNotification
  };
}