import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CalendarEvent } from '../../types';
import { format, parseISO } from 'date-fns';
import { getRuleDescription } from '../../services/RecurrenceEngine';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Props {
  event: CalendarEvent;
  instanceDate?: string;
}

export default function EventDetail({ event, instanceDate }: Props) {
  const startDate = parseISO(event.startAt);
  const endDate = parseISO(event.endAt);

  return (
    <View style={styles.container}>
      <View style={[styles.colorBar, { backgroundColor: event.color }]} />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoRow}>
          <Icon name="clock-o" size={14} color="#666" style={styles.infoIcon} />
          {event.isAllDay ? (
            <Text style={styles.infoText}>全天</Text>
          ) : (
            <Text style={styles.infoText}>
              {format(startDate, 'yyyy年M月d日 HH:mm')} - {format(endDate, 'HH:mm')}
            </Text>
          )}
        </View>

        {event.location && (
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={14} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{event.location}</Text>
          </View>
        )}

        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>描述</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {event.recurrenceRule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>重复</Text>
            <View style={styles.infoRow}>
              <Icon name="repeat" size={14} color="#666" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {getRuleDescription(event.recurrenceRule)}
              </Text>
            </View>
          </View>
        )}

        {event.reminderMinutes !== null && event.reminderMinutes !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>提醒</Text>
            <View style={styles.infoRow}>
              <Icon name="bell" size={14} color="#666" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {event.reminderMinutes === 0
                  ? '准时'
                  : `提前 ${event.reminderMinutes} 分钟`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他</Text>
          <Text style={styles.metaText}>
            创建: {format(parseISO(event.createdAt), 'yyyy-MM-dd HH:mm')}
          </Text>
          <Text style={styles.metaText}>
            更新: {format(parseISO(event.updatedAt), 'yyyy-MM-dd HH:mm')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
