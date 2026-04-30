import { CalendarEvent, RecurrenceRule } from '../types';
import { getOccurrences } from './RecurrenceEngine';
import { toISODate, getMonthEndDate } from '../utils/dateUtils';

export function buildMarkedDates(
  events: CalendarEvent[],
  year: number,
  month: number
): Record<string, any> {
  const marked: Record<string, any> = {};
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = getMonthEndDate(year, month);

  events.forEach(event => {
    if (event.recurrenceRule) {
      const occurrences = getOccurrences(
        event.recurrenceRule,
        event.startAt,
        monthStart,
        monthEnd
      );
      occurrences.forEach(occ => {
        if (!occ.isException) {
          addDot(marked, occ.date, event.id, event.color);
        }
      });
    } else {
      const date = event.startAt.slice(0, 10);
      if (date >= monthStart && date <= monthEnd) {
        addDot(marked, date, event.id, event.color);
      }
    }
  });

  return marked;
}

function addDot(
  marked: Record<string, any>,
  date: string,
  eventId: string,
  color: string
): void {
  if (!marked[date]) {
    marked[date] = { dots: [], marked: true };
  }
  if (marked[date].dots.length < 3) {
    marked[date].dots.push({ key: eventId, color });
  }
}

export function getEventsForDay(
  events: CalendarEvent[],
  date: string
): CalendarEvent[] {
  const result: CalendarEvent[] = [];
  const dayStart = date + 'T00:00:00';
  const dayEnd = date + 'T23:59:59';

  events.forEach(event => {
    if (event.originalEventId) return;

    if (event.recurrenceRule) {
      const occurrences = getOccurrences(
        event.recurrenceRule,
        event.startAt,
        date,
        date
      );
      if (occurrences.length > 0 && !occurrences[0].isException) {
        result.push({
          ...event,
          startAt: date + event.startAt.slice(10),
          endAt: date + event.endAt.slice(10),
        });
      }
    } else {
      if (event.startAt.slice(0, 10) === date) {
        result.push(event);
      }
    }
  });

  return result.sort((a, b) => a.startAt.localeCompare(b.startAt));
}
