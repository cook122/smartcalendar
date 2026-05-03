import { useUIStore } from '@/stores/uiStore';
import { format } from 'date-fns';

describe('uiStore', () => {
  it('initializes with current month', () => {
    const state = useUIStore.getState();
    expect(state.currentMonth).toBe(format(new Date(), 'yyyy-MM'));
    expect(state.selectedDate).toBeNull();
    expect(state.theme).toBe('light');
  });

  it('sets current month', () => {
    useUIStore.getState().setCurrentMonth('2025-03');
    expect(useUIStore.getState().currentMonth).toBe('2025-03');
  });

  it('sets selected date', () => {
    useUIStore.getState().setSelectedDate('2025-03-10');
    expect(useUIStore.getState().selectedDate).toBe('2025-03-10');
  });

  it('goes to today', () => {
    useUIStore.getState().setCurrentMonth('2020-01');
    useUIStore.getState().setSelectedDate(null);
    useUIStore.getState().goToToday();
    expect(useUIStore.getState().currentMonth).toBe(format(new Date(), 'yyyy-MM'));
    expect(useUIStore.getState().selectedDate).toBe(format(new Date(), 'yyyy-MM-dd'));
  });

  it('toggles theme', () => {
    expect(useUIStore.getState().theme).toBe('light');
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('dark');
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');
  });
});
