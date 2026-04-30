import { create } from 'zustand';
import { CalendarEvent } from '../types';
import * as eventRepo from '../storage/eventRepo';

interface EventState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;

  loadEvents: () => Promise<void>;
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string, scope?: 'this' | 'future' | 'all', instanceDate?: string) => Promise<void>;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsForMonth: (year: number, month: number) => Promise<CalendarEvent[]>;
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
    set(state => ({ events: [...state.events, event] }));
  },

  updateEvent: async (event) => {
    await eventRepo.saveEvent(event);
    set(state => ({
      events: state.events.map(e => e.id === event.id ? event : e),
    }));
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
        set(state => ({
          events: state.events.map(e => e.id === id ? updated : e),
        }));
      }
    } else if (scope === 'future' && instanceDate) {
      const event = events.find(e => e.id === id);
      if (event?.recurrenceRule) {
        const baseDate = new Date(instanceDate + 'T00:00:00');
        const prevEnd = new Date(baseDate);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const newRule = { ...event.recurrenceRule, endUntil: toISODate(prevEnd) };
        const updated = { ...event, recurrenceRule: newRule, updatedAt: new Date().toISOString() };
        await eventRepo.saveEvent(updated);

        const newEvent: CalendarEvent = {
          ...event,
          id: generateId(),
          recurrenceRule: { ...event.recurrenceRule, endType: 'never', endUntil: undefined, exceptions: [] },
          startAt: instanceDate + event.startAt.slice(10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await eventRepo.saveEvent(newEvent);
        set(state => ({ events: [...state.events, newEvent] }));
      }
    } else {
      await eventRepo.deleteEvent(id);
      set(state => ({
        events: state.events.filter(e => e.id !== id && e.originalEventId !== id),
      }));
    }
  },

  getEventById: (id) => get().events.find(e => e.id === id),

  getEventsForMonth: async (year, month) => {
    const { events } = get();
    return events.filter(e => {
      if (e.originalEventId) return false;
      if (!e.recurrenceRule) {
        const d = e.startAt.slice(0, 7);
        return d === `${year}-${String(month).padStart(2, '0')}`;
      }
      return true;
    });
  },
}));

import { generateId } from '../utils/idUtils';
import { toISODate } from '../utils/dateUtils';
