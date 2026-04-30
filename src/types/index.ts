export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  byDay?: number[];
  byMonthDay?: number;
  bySetPos?: number;
  endType: 'never' | 'count' | 'until';
  endCount?: number;
  endUntil?: string;
  exceptions?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  color: string;
  recurrenceRule?: RecurrenceRule;
  originalEventId?: string;
  reminderMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  defaultReminderMinutes: number | null;
  defaultEventColor: string;
  theme: 'light' | 'dark';
  startWeekOn: 'sunday' | 'monday';
}

export const EVENT_COLORS = [
  '#e74c3c', // 红
  '#e67e22', // 橙
  '#f1c40f', // 黄
  '#2ecc71', // 绿
  '#3498db', // 蓝
  '#9b59b6', // 紫
  '#e84393', // 粉
  '#95a5a6', // 灰
];

export const DEFAULT_SETTINGS: AppSettings = {
  defaultReminderMinutes: 15,
  defaultEventColor: '#e74c3c',
  theme: 'light',
  startWeekOn: 'sunday',
};
