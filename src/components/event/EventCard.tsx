import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarEvent } from '../../types';
import { format, parseISO } from 'date-fns';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Props {
  event: CalendarEvent;
  onPress: () => void;
}

export default function EventCard({ event, onPress }: Props) {
  const startTime = parseISO(event.startAt);
  const endTime = parseISO(event.endAt);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={[styles.colorBar, { backgroundColor: event.color }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          {event.recurrenceRule && (
            <Icon name="repeat" size={12} color="#999" style={styles.repeatIcon} />
          )}
        </View>
        {!event.isAllDay && (
          <Text style={styles.time}>
            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
          </Text>
        )}
        {event.isAllDay && <Text style={styles.time}>全天</Text>}
        {event.location && (
          <Text style={styles.location} numberOfLines={1}>
            <Icon name="map-marker" size={10} color="#999" /> {event.location}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  repeatIcon: {
    marginLeft: 6,
  },
  time: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
