import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, AppSettings, DEFAULT_SETTINGS } from '../types';

const EVENTS_KEY = 'events';
const SETTINGS_KEY = 'settings';

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const raw = await AsyncStorage.getItem(EVENTS_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    console.error('[EventRepo] Failed to parse events JSON, backing up and resetting.');
    await AsyncStorage.setItem(`${EVENTS_KEY}_backup_${Date.now()}`, raw || '');
    return [];
  }
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  const events = await getAllEvents();
  const idx = events.findIndex(e => e.id === event.id);
  if (idx >= 0) {
    events[idx] = { ...event, updatedAt: new Date().toISOString() };
  } else {
    events.push({ ...event, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export async function deleteEvent(id: string): Promise<void> {
  const events = await getAllEvents();
  await AsyncStorage.setItem(
    EVENTS_KEY,
    JSON.stringify(events.filter(e => e.id !== id && e.originalEventId !== id))
  );
}

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
