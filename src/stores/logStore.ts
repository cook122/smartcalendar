import { create } from 'zustand';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  tag: string;
  message: string;
}

interface LogState {
  logs: LogEntry[];
  maxEntries: number;

  addLog: (level: LogEntry['level'], tag: string, message: string) => void;
  clearLogs: () => void;
  getLogsByTag: (tag: string) => LogEntry[];
  getErrors: () => LogEntry[];
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  maxEntries: 500,

  addLog: (level, tag, message) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      level,
      tag,
      message,
    };
    set(state => ({
      logs: [...state.logs.slice(-(state.maxEntries - 1)), entry],
    }));
  },

  clearLogs: () => set({ logs: [] }),

  getLogsByTag: (tag) => get().logs.filter(l => l.tag === tag),

  getErrors: () => get().logs.filter(l => l.level === 'error'),
}));
