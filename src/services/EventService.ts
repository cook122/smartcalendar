import { CalendarEvent, RecurrenceRule } from '../types';
import { generateId } from '../utils/idUtils';
import { toISODateTime, toISODate } from '../utils/dateUtils';
import * as eventRepo from '../storage/eventRepo';

export async function createEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const now = new Date().toISOString();
  const event: CalendarEvent = {
    id: generateId(),
    title: data.title || '新建日程',
    description: data.description,
    location: data.location,
    startAt: data.startAt || toISODateTime(new Date()),
    endAt: data.endAt || toISODateTime(new Date(Date.now() + 3600000)),
    isAllDay: data.isAllDay || false,
    color: data.color || '#e74c3c',
    recurrenceRule: data.recurrenceRule,
    reminderMinutes: data.reminderMinutes,
    createdAt: now,
    updatedAt: now,
  };
  await eventRepo.saveEvent(event);
  return event;
}

export async function updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
  const events = await eventRepo.getAllEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx < 0) return null;
  events[idx] = { ...events[idx], ...data, updatedAt: new Date().toISOString() };
  await eventRepo.saveEvent(events[idx]);
  return events[idx];
}

export async function deleteEvent(
  id: string,
  scope?: 'this' | 'future' | 'all',
  instanceDate?: string
): Promise<void> {
  const events = await eventRepo.getAllEvents();
  const event = events.find(e => e.id === id);
  if (!event) return;

  if (scope === 'this' && instanceDate && event.recurrenceRule) {
    const exceptions = [...(event.recurrenceRule.exceptions || []), instanceDate];
    await eventRepo.saveEvent({
      ...event,
      recurrenceRule: { ...event.recurrenceRule, exceptions },
      updatedAt: new Date().toISOString(),
    });
  } else if (scope === 'future' && instanceDate && event.recurrenceRule) {
    const baseDate = new Date(instanceDate + 'T00:00:00');
    const prevEnd = new Date(baseDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    await eventRepo.saveEvent({
      ...event,
      recurrenceRule: { ...event.recurrenceRule, endType: 'until' as const, endUntil: toISODate(prevEnd) },
      updatedAt: new Date().toISOString(),
    });
    const newEvent: CalendarEvent = {
      ...event,
      id: generateId(),
      recurrenceRule: { ...event.recurrenceRule, endType: 'never' as const, endUntil: undefined, exceptions: [] },
      startAt: instanceDate + event.startAt.slice(10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await eventRepo.saveEvent(newEvent);
  } else {
    await eventRepo.deleteEvent(id);
  }
}
