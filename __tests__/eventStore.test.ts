import { useEventStore } from '@/stores/eventStore';
import * as eventRepo from '@/storage/eventRepo';
import { CalendarEvent } from '@/types';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-store',
}));

describe('eventStore', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    jest.clearAllMocks();

    (eventRepo.getAllEvents as jest.Mock).mockImplementation(async () => {
      return store['events'] ? JSON.parse(store['events']) : [];
    });
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
    (eventRepo.deleteEvent as jest.Mock).mockImplementation(async (id: string) => {
      const existing = store['events'] ? JSON.parse(store['events']) : [];
      store['events'] = JSON.stringify(existing.filter((e: CalendarEvent) => e.id !== id));
    });
  });

  it('initializes with empty events', () => {
    const state = useEventStore.getState();
    expect(state.events).toEqual([]);
  });

  it('loads events from storage', async () => {
    store['events'] = JSON.stringify([
      { id: '1', title: 'Test', startAt: '2025-03-01T09:00:00', endAt: '2025-03-01T10:00:00', isAllDay: false, color: '#e74c3c', createdAt: '', updatedAt: '' },
    ]);
    await useEventStore.getState().loadEvents();
    expect(useEventStore.getState().events.length).toBe(1);
  });

  it('adds an event', async () => {
    const event: CalendarEvent = {
      id: 'new-1',
      title: 'New Event',
      startAt: '2025-03-01T09:00:00',
      endAt: '2025-03-01T10:00:00',
      isAllDay: false,
      color: '#e74c3c',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await useEventStore.getState().addEvent(event);
    expect(useEventStore.getState().events.length).toBe(1);
    expect(useEventStore.getState().events[0].title).toBe('New Event');
  });

  it('deletes an event', async () => {
    const event: CalendarEvent = {
      id: 'del-1',
      title: 'To Delete',
      startAt: '2025-03-01T09:00:00',
      endAt: '2025-03-01T10:00:00',
      isAllDay: false,
      color: '#e74c3c',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await useEventStore.getState().addEvent(event);
    await useEventStore.getState().deleteEvent('del-1');
    expect(useEventStore.getState().events.length).toBe(0);
  });

  it('gets event by id', async () => {
    const event: CalendarEvent = {
      id: 'find-1',
      title: 'Find Me',
      startAt: '2025-03-01T09:00:00',
      endAt: '2025-03-01T10:00:00',
      isAllDay: false,
      color: '#e74c3c',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await useEventStore.getState().addEvent(event);
    const found = useEventStore.getState().getEventById('find-1');
    expect(found).toBeDefined();
    expect(found!.title).toBe('Find Me');
  });

  it('filters events for month', async () => {
    const e1: CalendarEvent = {
      id: 'm1',
      title: 'March Event',
      startAt: '2025-03-15T09:00:00',
      endAt: '2025-03-15T10:00:00',
      isAllDay: false,
      color: '#e74c3c',
      createdAt: '',
      updatedAt: '',
    };
    const e2: CalendarEvent = {
      id: 'm2',
      title: 'April Event',
      startAt: '2025-04-15T09:00:00',
      endAt: '2025-04-15T10:00:00',
      isAllDay: false,
      color: '#e74c3c',
      createdAt: '',
      updatedAt: '',
    };
    await useEventStore.getState().addEvent(e1);
    await useEventStore.getState().addEvent(e2);
    const marchEvents = useEventStore.getState().getEventsForMonth(2025, 3);
    expect(marchEvents.length).toBe(1);
    expect(marchEvents[0].id).toBe('m1');
  });
});
