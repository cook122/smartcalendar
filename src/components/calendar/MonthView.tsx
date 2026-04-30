import React, { useMemo } from 'react';
import { Calendar } from 'react-native-calendars';
import { useUIStore } from '../../stores/uiStore';
import { buildMarkedDates } from '../../services/CalendarService';
import { useEventStore } from '../../stores/eventStore';
import { StyleSheet } from 'react-native';

interface Props {
  onDayPress: (date: string) => void;
}

export default function MonthView({ onDayPress }: Props) {
  const currentMonth = useUIStore(s => s.currentMonth);
  const selectedDate = useUIStore(s => s.selectedDate);
  const events = useEventStore(s => s.events);

  const [year, month] = currentMonth.split('-').map(Number);
  const markedDates = useMemo(
    () => buildMarkedDates(events, year, month),
    [events, year, month]
  );

  const monthStart = `${currentMonth}-01`;
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return (
    <Calendar
      current={monthStart}
      onMonthChange={(monthObj: any) => {
        const m = `${monthObj.year}-${String(monthObj.month).padStart(2, '0')}`;
        useUIStore.getState().setCurrentMonth(m);
      }}
      onDayPress={(day: any) => {
        const date = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
        onDayPress(date);
      }}
      markedDates={{
        ...markedDates,
        ...(selectedDate ? { [selectedDate]: { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: '#00adf5' } } : {}),
        [today]: { ...(markedDates[today] || {}), selected: true, selectedColor: '#00adf5' },
      }}
      theme={{
        selectedDayBackgroundColor: '#00adf5',
        todayTextColor: '#00adf5',
        arrowColor: '#00adf5',
        monthTextColor: '#fff',
        textDayFontWeight: '300',
        textMonthFontWeight: 'bold',
        textDayHeaderFontWeight: '500',
      }}
      style={styles.calendar}
    />
  );
}

const styles = StyleSheet.create({
  calendar: {
    borderRadius: 8,
  },
});
