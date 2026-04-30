import { create } from 'zustand';
import { format } from 'date-fns';

interface UIState {
  currentMonth: string;
  selectedDate: string | null;
  theme: 'light' | 'dark';

  setCurrentMonth: (month: string) => void;
  setSelectedDate: (date: string | null) => void;
  goToToday: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentMonth: format(new Date(), 'yyyy-MM'),
  selectedDate: null,
  theme: 'light',

  setCurrentMonth: (month) => set({ currentMonth: month }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  goToToday: () => set({
    currentMonth: format(new Date(), 'yyyy-MM'),
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
  }),
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
