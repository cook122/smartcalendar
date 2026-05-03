import * as eventRepo from '@/storage/eventRepo';
import * as EventService from '@/services/EventService';
import { CalendarEvent } from '@/types';

// Mock uuid to return predictable IDs
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

describe('EventService', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    (eventRepo.saveEvent as jest.Mock).mockImplementation(async (event: CalendarEvent) => {
      const existing = store['events'] ? JSON.parse(store['events']) : [];
      const idx = existing.findIndex((e: CalendarEvent) => e.id === event.id);
      if (idx >= 0) {
        existing[idx] = event;
      } else {
        existing.push(event);
      }
      store['events'] = JSON.stringify(existing);
    });
    (eventRepo.getAllEvents as jest.Mock).mockImplementation(async () => {
      return store['events'] ? JSON.parse(store['events']) : [];
    });
    (eventRepo.deleteEvent as jest.Mock).mockImplementation(async (id: string) => {
      const existing = store['events'] ? JSON.parse(store['events']) : [];
      store['events'] = JSON.stringify(existing.filter((e: CalendarEvent) => e.id !== id && e.originalEventId !== id));
    });
  });

  describe('createEvent', () => {
    it('creates an event with defaults', async () => {
      const event = await EventService.createEvent({});
      expect(event.id).toBe('mock-uuid-1234');
      expect(event.title).toBe('新建日程');
      expect(event.color).toBe('#e74c3c');
      expect(event.isAllDay).toBe(false);
    });

    it('creates an event with provided data', async () => {
      const event = await EventService.createEvent({
        title: 'Meeting',
        startAt: '2025-03-10T09:00:00',
        endAt: '2025-03-10T10:00:00',
        color: '#3498db',
      });
      expect(event.title).toBe('Meeting');
      expect(event.color).toBe('#3498db');
      expect(event.startAt).toBe('2025-03-10T09:00:00');
    });
  });

  describe('updateEvent', () => {
    it('updates existing event', async () => {
      const created = await EventService.createEvent({ title: 'Old' });
      const updated = await EventService.updateEvent(created.id, { title: 'New' });
      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('New');
    });

    it('returns null for non-existent event', async () => {
      const result = await EventService.updateEvent('nonexistent', { title: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteEvent', () => {
    it('deletes an event by id', async () => {
      const created = await EventService.createEvent({ title: 'To Delete' });
      await EventService.deleteEvent(created.id);
      const events = await eventRepo.getAllEvents();
      expect(events.find((e: CalendarEvent) => e.id === created.id)).toBeUndefined();
    });

    it('adds exception for scope=this on recurring event', async () => {
      const created = await EventService.createEvent({
        title: 'Recurring',
        recurrenceRule: {
          frequency: 'daily',
          interval: 1,
          endType: 'never',
        },
      });
      await EventService.deleteEvent(created.id, 'this', '2025-03-10');
      const events = await eventRepo.getAllEvents();
      const updated = events.find((e: CalendarEvent) => e.id === created.id);
      expect(updated!.recurrenceRule!.exceptions).toContain('2025-03-10');
    });
  });
});
