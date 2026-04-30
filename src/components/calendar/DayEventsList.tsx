import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarEvent } from '../../types';
import EventCard from '../event/EventCard';

interface Props {
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  selectedDate: string;
  onAddPress: () => void;
}

export default function DayEventsList({ events, onEventPress, selectedDate, onAddPress }: Props) {
  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无日程</Text>
        <TouchableOpacity onPress={onAddPress} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 创建日程</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateHeader}>
        {selectedDate.replace(/-0?/g, '-').replace(/^(\d+)-(\d+)-(\d+)$/, '$1年$2月$3日')}
      </Text>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => onEventPress(item)} />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    paddingLeft: 4,
  },
  list: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#00adf5',
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
