import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { getMsUntilTime } from '../utils/reminderScheduler';

export function useReminder(user, isGuest, showToast) {
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [permissionStatus, setPermissionStatus] = useState('default');
  const webTimerRef = useRef(null);



  // 1. Initial State Sync
  useEffect(() => {
    if (!user?.id || isGuest) {
      setReminderOn(false);
      return;
    }

    const onKey = `reminder_on_${user.id}`;
    const timeKey = `reminder_time_${user.id}`;

    const savedOn = localStorage.getItem(onKey) === 'true';
    setReminderOn(savedOn);

    const savedTime = localStorage.getItem(timeKey) || '08:00';
    setReminderTime(savedTime);

    // Check permission status
    notificationService.checkPermissions().then(status => {
      setPermissionStatus(status);
    });
  }, [user?.id, isGuest]);

  // 2. Web Fallback Scheduler (handles background notification trigger if running in browser)
  const scheduleWebFallback = useCallback((timeStr) => {
    if (webTimerRef.current) clearTimeout(webTimerRef.current);
    if (!user?.id || isGuest || !reminderOn) return;

    const ms = getMsUntilTime(timeStr);
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';

    webTimerRef.current = setTimeout(async () => {
      // Trigger browser notification
      const perm = await notificationService.checkPermissions();
      if (perm === 'granted') {
        await notificationService.sendTestNotification(userName);
      }
      // Re-schedule for next day
      scheduleWebFallback(timeStr);
    }, ms);
  }, [user?.id, user?.user_metadata?.name, user?.email, isGuest, reminderOn]);

  // 3. Clear Web timer on unmount or when config changes
  useEffect(() => {
    if (reminderOn && !isGuest && user?.id) {
      scheduleWebFallback(reminderTime);
    } else {
      if (webTimerRef.current) {
        clearTimeout(webTimerRef.current);
        webTimerRef.current = null;
      }
    }
    return () => {
      if (webTimerRef.current) clearTimeout(webTimerRef.current);
    };
  }, [reminderOn, reminderTime, user?.id, isGuest, scheduleWebFallback]);

  // 4. Toggle Reminder ON/OFF
  const toggleReminder = useCallback(async () => {
    if (isGuest || !user?.id) {
      showToast('Daily reminders are only available for registered accounts. Please sign in!');
      return;
    }

    const onKey = `reminder_on_${user.id}`;

    if (!reminderOn) {
      // Request permission
      const granted = await notificationService.requestPermissions();
      const updatedStatus = await notificationService.checkPermissions();
      setPermissionStatus(updatedStatus);

      if (!granted) {
        showToast('Please enable notification permissions in your browser/device settings.');
        return;
      }

      // Save setting & schedule
      localStorage.setItem(onKey, 'true');
      setReminderOn(true);

      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';
      const [h, m] = reminderTime.split(':');
      await notificationService.scheduleDailyReminder(h, m, userName);

      showToast('⏰ Daily reminder enabled!');
    } else {
      // Cancel & Turn Off
      localStorage.setItem(onKey, 'false');
      setReminderOn(false);
      await notificationService.cancelDailyReminder();
      showToast('Reminder turned off.');
    }
  }, [reminderOn, reminderTime, user?.id, user?.user_metadata?.name, user?.email, isGuest, showToast]);

  // 5. Change Time & Reschedule
  const changeReminderTime = useCallback(async (newTimeStr) => {
    if (!user?.id) return;
    const timeKey = `reminder_time_${user.id}`;

    localStorage.setItem(timeKey, newTimeStr);
    setReminderTime(newTimeStr);

    if (reminderOn && !isGuest) {
      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';
      const [h, m] = newTimeStr.split(':');
      await notificationService.scheduleDailyReminder(h, m, userName);
    }
  }, [reminderOn, user?.id, user?.user_metadata?.name, user?.email, isGuest]);

  // 6. Manual Test Action
  const triggerTestNotification = useCallback(async () => {
    if (!user?.id) return;
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Beloved';
    const sent = await notificationService.sendTestNotification(userName);
    if (sent) {
      showToast('Test notification sent! ✅');
    } else {
      showToast('Could not send notification. Check permissions.');
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
