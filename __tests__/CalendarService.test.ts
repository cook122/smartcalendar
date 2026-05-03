import { buildMarkedDates, getEventsForDay } from '@/services/CalendarService';
import { CalendarEvent } from '@/types';

describe('CalendarService', () => {
  const simpleEvent: CalendarEvent = {
    id: 'e1',
    title: 'Test Event',
    startAt: '2025-03-10T09:00:00',
    endAt: '2025-03-10T10:00:00',
    isAllDay: false,
    color: '#e74c3c',
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00',
  };

  const recurringEvent: CalendarEvent = {
    id: 'e2',
    title: 'Daily Standup',
    startAt: '2025-03-01T09:00:00',
    endAt: '2025-03-01T09:30:00',
    isAllDay: false,
    color: '#3498db',
    recurrenceRule: {
      frequency: 'daily',
      interval: 1,
      endType: 'never',
    },
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00',
  };

  describe('buildMarkedDates', () => {
    it('marks dates for simple events in range', () => {
      const marked = buildMarkedDates([simpleEvent], 2025, 3);
      expect(marked['2025-03-10']).toBeDefined();
      expect(marked['2025-03-10'].dots.length).toBeGreaterThan(0);
    });

    it('does not mark dates outside month range', () => {
      const marked = buildMarkedDates([simpleEvent], 2025, 2);
      expect(marked['2025-03-10']).toBeUndefined();
    });

    it('marks dates for recurring events', () => {
      const marked = buildMarkedDates([recurringEvent], 2025, 3);
      expect(marked['2025-03-01']).toBeDefined();
      expect(marked['2025-03-02']).toBeDefined();
      expect(marked['2025-03-10']).toBeDefined();
    });

    it('limits to 3 dots per date', () => {
      const events: CalendarEvent[] = Array.from({ length: 5 }, (_, i) => ({
        ...simpleEvent,
        id: `e${i}`,
        color: `#color${i}`,
      }));
      const marked = buildMarkedDates(events, 2025, 3);
      expect(marked['2025-03-10'].dots.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getEventsForDay', () => {
    it('returns simple event on matching day', () => {
      const result = getEventsForDay([simpleEvent], '2025-03-10');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('e1');
    });

    it('returns empty for non-matching day', () => {
      const result = getEventsForDay([simpleEvent], '2025-03-11');
      expect(result.length).toBe(0);
    });

    it('returns recurring event occurrences', () => {
      const result = getEventsForDay([recurringEvent], '2025-03-05');
      expect(result.length).toBe(1);
      expect(result[0].startAt).toContain('2025-03-05');
    });

    it('skips events with recurrence exceptions', () => {
      const eventWithException: CalendarEvent = {
        ...recurringEvent,
        recurrenceRule: {
          ...recurringEvent.recurrenceRule!,
          exceptions: ['2025-03-05'],
        },
      };
      const result = getEventsForDay([eventWithException], '2025-03-05');
      expect(result.length).toBe(0);
    });

    it('skips originalEventId events', () => {
      const modifiedEvent: CalendarEvent = {
        ...simpleEvent,
        id: 'e1-mod',
        originalEventId: 'e1',
      };
      const result = getEventsForDay([modifiedEvent], '2025-03-10');
      expect(result.length).toBe(0);
    });

    it('sorts results by startAt', () => {
      const laterEvent: CalendarEvent = {
        ...simpleEvent,
        id: 'e2',
        startAt: '2025-03-10T14:00:00',
        endAt: '2025-03-10T15:00:00',
      };
      const result = getEventsForDay([laterEvent, simpleEvent], '2025-03-10');
      expect(result[0].id).toBe('e1');
      expect(result[1].id).toBe('e2');
    });
  });
});
