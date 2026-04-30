import { create } from 'zustand';
import { CalendarEvent } from '../types';
import * as eventRepo from '../storage/eventRepo';
import { generateId } from '../utils/idUtils';
import { toISODate } from '../utils/dateUtils';

interface EventState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;

  loadEvents: () => Promise<void>;
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string, scope?: 'this' | 'future' | 'all', instanceDate?: string) => Promise<void>;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  loadEvents: async () => {
    set({ loading: true, error: null });
    try {
      const events = await eventRepo.getAllEvents();
      set({ events, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addEvent: async (event) => {
    await eventRepo.saveEvent(event);
    const updated = await eventRepo.getAllEvents();
    set({ events: updated });
  },

  updateEvent: async (event) => {
    await eventRepo.saveEvent(event);
    const updated = await eventRepo.getAllEvents();
    set({ events: updated });
  },

  deleteEvent: async (id, scope, instanceDate) => {
    const { events } = get();
    if (scope === 'this' && instanceDate) {
      const event = events.find(e => e.id === id);
      if (event?.recurrenceRule) {
        const updated = {
          ...event,
          recurrenceRule: {
            ...event.recurrenceRule,
            exceptions: [...(event.recurrenceRule.exceptions || []), instanceDate],
          },
          updatedAt: new Date().toISOString(),
        };
        await eventRepo.saveEvent(updated);
        const allEvents = await eventRepo.getAllEvents();
        set({ events: allEvents });
      }
    } else if (scope === 'future' && instanceDate) {
      const event = events.find(e => e.id === id);
      if (event?.recurrenceRule) {
        const prevEnd = new Date(instanceDate + 'T00:00:00');
        prevEnd.setDate(prevEnd.getDate() - 1);
        const truncatedRule = { ...event.recurrenceRule, endType: 'until' as const, endUntil: toISODate(prevEnd) };
        await eventRepo.saveEvent({
          ...event,
          recurrenceRule: truncatedRule,
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
        const allEvents = await eventRepo.getAllEvents();
        set({ events: allEvents });
      }
    } else {
      await eventRepo.deleteEvent(id);
      const allEvents = await eventRepo.getAllEvents();
      set({ events: allEvents });
    }
  },

  getEventById: (id) => get().events.find(e => e.id === id),

  getEventsForMonth: (year, month) => {
    const { events } = get();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthStart = `${monthStr}-01`;
    const monthEnd = `${monthStr}-${new Date(year, month, 0).getDate()}`;

    return events.filter(e => {
      if (e.originalEventId) return false;
      if (!e.recurrenceRule) {
        return e.startAt.slice(0, 7) === monthStr;
      }
      // recurring events: always include (CalendarService.expand will filter)
      return true;
    });
  },
}));
