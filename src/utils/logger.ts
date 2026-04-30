import { useLogStore } from '../stores/logStore';

export const logger = {
  info: (tag: string, message: string) => {
    const formatted = `[SmartCalendar][${tag}] ${message}`;
    console.log(formatted);
    try {
      useLogStore.getState().addLog('info', tag, message);
    } catch (_) {}
  },
  warn: (tag: string, message: string) => {
    const formatted = `[SmartCalendar][${tag}] ${message}`;
    console.warn(formatted);
    try {
      useLogStore.getState().addLog('warn', tag, message);
    } catch (_) {}
  },
  error: (tag: string, message: string, err?: unknown) => {
    const detail = err instanceof Error ? `${message}: ${err.message}` : message;
    const formatted = `[SmartCalendar][${tag}] ${detail}`;
    console.error(formatted);
    try {
      useLogStore.getState().addLog('error', tag, detail);
    } catch (_) {}
  },
};
