import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useEventStore } from '../../stores/eventStore';
import { RootStackParamList } from '../../types/navigation';
import EventDetail from '../components/event/EventDetail';
import { CalendarEvent } from '../../types';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getEventsForDay } from '../../services/CalendarService';
import { deleteEvent } from '../../services/EventService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Event'>;
type RouteProp = RouteProp<RootStackParamList, 'Event'>;

export default function EventScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { eventId, date, isExceptionInstance } = route.params;
  const getEventById = useEventStore(s => s.getEventById);
  const deleteEventStore = useEventStore(s => s.deleteEvent);
  const events = useEventStore(s => s.events);
  const [deleting, setDeleting] = useState(false);

  const event = useMemo(() => getEventById(eventId), [eventId, getEventById]);

  const relatedEvents = useMemo(() => {
    if (!event?.recurrenceRule || !date) return [];
    return getEventsForDay(events, date).filter(e => e.id === eventId || e.originalEventId === eventId);
  }, [event, events, date]);

  const handleEdit = useCallback(() => {
    if (!event) return;
    navigation.navigate('EventEdit', {
      eventId: event.id,
      instanceDate: date,
      editScope: 'all',
    });
  }, [navigation, event, date]);

  const handleDelete = useCallback(() => {
    if (!event) return;
    if (!event.recurrenceRule) {
      Alert.alert('删除日程', '确定要删除此日程吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除', style: 'destructive', onPress: async () => {
            setDeleting(true);
            await deleteEventStore(event.id);
            navigation.goBack();
          },
        },
      ]);
      return;
    }
    Alert.alert('删除重复日程', '请选择删除范围：', [
      { text: '取消', style: 'cancel' },
      {
        text: '仅此一次', onPress: async () => {
          setDeleting(true);
          await deleteEvent(event.id, 'this', date);
          navigation.goBack();
        },
      },
      {
        text: '此后所有', onPress: async () => {
          setDeleting(true);
          await deleteEvent(event.id, 'future', date);
          navigation.goBack();
        },
      },
      {
        text: '全部', style: 'destructive', onPress: async () => {
          setDeleting(true);
          await deleteEvent(event.id);
          navigation.goBack();
        },
      },
    ]);
  }, [event, date, deleteEventStore, navigation]);

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>日程不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={18} color="#fff" />
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
            <Icon name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.headerBtn, styles.deleteBtn]} disabled={deleting}>
            <Icon name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.body}>
        <EventDetail event={event} instanceDate={date} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00adf5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    padding: 6,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  body: {
    flex: 1,
    padding: 16,
  },
});
