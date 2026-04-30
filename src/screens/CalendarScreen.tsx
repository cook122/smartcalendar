import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { useUIStore } from '../../stores/uiStore';
import { useEventStore } from '../../stores/eventStore';
import { RootStackParamList } from '../../types/navigation';
import MonthView from '../components/calendar/MonthView';
import DayEventsList from '../components/calendar/DayEventsList';
import { getEventsForDay } from '../../services/CalendarService';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/FontAwesome';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Calendar'>;

export default function CalendarScreen() {
  const navigation = useNavigation<NavigationProp>();
  const currentMonth = useUIStore(s => s.currentMonth);
  const selectedDate = useUIStore(s => s.selectedDate);
  const setSelectedDate = useUIStore(s => s.setSelectedDate);
  const goToToday = useUIStore(s => s.goToToday);
  const events = useEventStore(s => s.events);

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDay(events, selectedDate);
  }, [events, selectedDate]);

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  const handleAddPress = useCallback(() => {
    navigation.navigate('EventEdit', {
      selectedDate: selectedDate || format(new Date(), 'yyyy-MM-dd'),
    });
  }, [navigation, selectedDate]);

  const handleEventPress = useCallback((event: any) => {
    navigation.navigate('Event', { eventId: event.id });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Settings')}>
          <Icon name="gear" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.centerArea}>
          <MonthView onDayPress={handleDayPress} />
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleAddPress}>
          <Icon name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <DayEventsList
        events={dayEvents}
        onEventPress={handleEventPress}
        selectedDate={selectedDate || ''}
        onAddPress={handleAddPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  centerArea: {
    flex: 1,
  },
  iconBtn: {
    padding: 12,
    marginTop: 4,
  },
});
