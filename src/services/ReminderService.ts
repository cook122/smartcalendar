import { CalendarEvent } from '../types';
import { logger } from '../utils/logger';

const timers: ReturnType<typeof setTimeout>[] = [];

export function scheduleAllReminders(events: CalendarEvent[]): void {
  clearAllReminders();
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  events.forEach(event => {
    if (event.reminderMinutes === null || event.reminderMinutes === undefined) return;

    const eventTime = new Date(event.startAt);
    const reminderTime = new Date(eventTime.getTime() - event.reminderMinutes * 60000);

    if (reminderTime > now && reminderTime <= nextHour) {
      const delay = reminderTime.getTime() - now.getTime();
      if (delay > 0 && delay < 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          triggerNotification(event);
        }, delay);
        timers.push(timer);
        logger.info('ReminderService', `Scheduled reminder for "${event.title}" at ${reminderTime.toLocaleString()}`);
      }
    }
  });

  logger.info('ReminderService', `Scheduled ${timers.length} reminders`);
}

export function clearAllReminders(): void {
  timers.forEach(t => clearTimeout(t));
  timers.length = 0;
}

function triggerNotification(event: CalendarEvent): void {
  try {
    const PushNotification = require('react-native-push-notification').default || require('react-native-push-notification');
    const eventTime = new Date(event.startAt);
    PushNotification.localNotification({
      channelId: 'smartcalendar-reminders',
      title: event.title,
      message: `开始于 ${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`,
      playSound: true,
      soundName: 'default',
    });
    logger.info('ReminderService', `Triggered reminder for "${event.title}"`);
  } catch (e) {
    logger.error('ReminderService', 'Failed to trigger notification', e);
  }
}

export function setupNotificationChannel(): void {
  try {
    const PushNotification = require('react-native-push-notification').default || require('react-native-push-notification');
    PushNotification.createChannel(
      {
        channelId: 'smartcalendar-reminders',
        channelName: '日程提醒',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      () => logger.info('ReminderService', 'Notification channel created'),
      () => logger.error('ReminderService', 'Failed to create notification channel'),
    );
  } catch (e) {
    logger.error('ReminderService', 'Failed to setup notification channel', e);
  }
}
