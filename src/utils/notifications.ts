import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { LanguageCode, ReminderItem } from '../types/planner';
import { buildPlayfulReminderCopy } from './reminderCopy';

export { buildPlayfulReminderCopy };

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Safe fallback if handler cannot bind in a headless runtime.
  }
}

/** Requests local notification permissions strictly for on-device reminders (never push tokens). */
export async function ensureLocalNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Schedules a local device notification on Android/iOS and returns its notification ID. */
export async function scheduleDeviceReminder(
  reminder: ReminderItem,
  lang: LanguageCode
): Promise<string | undefined> {
  if (!reminder.enabled || Platform.OS === 'web') return undefined;
  const granted = await ensureLocalNotificationPermission();
  if (!granted) return undefined;

  const { title, body } = buildPlayfulReminderCopy(reminder, lang);

  try {
    if (reminder.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId).catch(() => {});
    }

    if (reminder.repeat === 'daily') {
      return await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.hour,
          minute: reminder.minute,
        },
      });
    }

    const [y, m, d] = reminder.dateKey.split('-').map(Number);
    const targetDate = new Date(y, (m || 1) - 1, d || 1, reminder.hour, reminder.minute, 0);
    if (reminder.repeat === 'weekly') {
      return await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: targetDate.getDay() + 1, // 1=Sun..7=Sat
          hour: reminder.hour,
          minute: reminder.minute,
        },
      });
    }

    if (targetDate.getTime() <= Date.now() + 2000) {
      return undefined;
    }

    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
  } catch {
    return undefined;
  }
}

export async function cancelDeviceReminder(notificationId?: string): Promise<void> {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore already canceled IDs.
  }
}
