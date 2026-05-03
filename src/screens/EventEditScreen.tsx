import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useEventStore } from '../stores/eventStore';
import { RootStackParamList } from '../types/navigation';
import { CalendarEvent, RecurrenceRule } from '../types';
import { createEvent, updateEvent } from '../services/EventService';
import { getRuleDescription } from '../services/RecurrenceEngine';
import RecurrencePicker from '../components/recurrence/RecurrencePicker';
import ReminderPicker from '../components/reminder/ReminderPicker';
import ColorPicker from '../components/event/ColorPicker';
import { EVENT_COLORS } from '../types';
import Icon from 'react-native-vector-icons/FontAwesome';
import { format, parseISO } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EventEdit'>;
type RouteProp = RouteProp<RootStackParamList, 'EventEdit'>;

export default function EventEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { eventId, selectedDate, baseEvent, instanceDate, editScope } = route.params || {};
  const getEventById = useEventStore(s => s.getEventById);
  const addEvent = useEventStore(s => s.addEvent);
  const updateEventStore = useEventStore(s => s.updateEvent);

  const base = eventId ? getEventById(eventId) : (baseEvent || null);
  const isEditing = !!eventId;

  const [title, setTitle] = useState(base?.title || '');
  const [description, setDescription] = useState(base?.description || '');
  const [location, setLocation] = useState(base?.location || '');
  const [startDate, setStartDate] = useState(
    selectedDate || (base ? base.startAt.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'))
  );
  const [startTime, setStartTime] = useState(
    base ? base.startAt.slice(11, 16) : '09:00'
  );
  const [endTime, setEndTime] = useState(
    base ? base.endAt.slice(11, 16) : '10:00'
  );
  const [isAllDay, setIsAllDay] = useState(base?.isAllDay || false);
  const [color, setColor] = useState(base?.color || EVENT_COLORS[0]);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(base?.recurrenceRule);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(
    base?.reminderMinutes !== undefined ? base.reminderMinutes : 15
  );

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? '编辑日程' : '新建日程',
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>保存</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing, handleSave, title, startDate, startTime, endTime, recurrenceRule]);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('提示', '请输入日程标题');
      return;
    }

    const startAt = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`;
    const endAt = isAllDay
      ? `${startDate}T23:59:59`
      : `${startDate}T${endTime}:00`;

    if (!isAllDay && endAt <= startAt) {
      Alert.alert('提示', '结束时间必须晚于开始时间');
      return;
    }

    try {
      if (isEditing && base) {
        await updateEvent(base.id, {
          title: trimmedTitle,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startAt,
          endAt,
          isAllDay,
          color,
          recurrenceRule,
          reminderMinutes,
        });
      } else {
        await createEvent({
          title: trimmedTitle,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startAt,
          endAt,
          isAllDay,
          color,
          recurrenceRule,
          reminderMinutes,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('保存失败', e.message);
    }
  }, [title, description, location, startDate, startTime, endTime, isAllDay, color, recurrenceRule, reminderMinutes, isEditing, base]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <TextInput
          style={styles.titleInput}
          placeholder="添加标题"
          value={title}
          onChangeText={setTitle}
          returnKeyType="done"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Icon name="clock-o" size={16} color="#666" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>全天</Text>
          <Switch value={isAllDay} onValueChange={setIsAllDay} />
        </View>

        <View style={styles.row}>
          <Icon name="calendar" size={16} color="#666" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>日期</Text>
          <TextInput
            style={styles.dateInput}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {!isAllDay && (
          <>
            <View style={styles.row}>
              <Icon name="clock-o" size={16} color="#666" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>开始</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:mm"
              />
            </View>
            <View style={styles.row}>
              <Icon name="clock-o" size={16} color="#666" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>结束</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:mm"
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Icon name="align-left" size={16} color="#666" style={styles.rowIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="添加描述"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        <View style={styles.row}>
          <Icon name="map-marker" size={16} color="#666" style={styles.rowIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="添加地点"
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>重复</Text>
        <RecurrencePicker
          value={recurrenceRule}
          onChange={setRecurrenceRule}
        />
        {recurrenceRule && (
          <Text style={styles.ruleDesc}>{getRuleDescription(recurrenceRule)}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>提醒</Text>
        <ReminderPicker
          value={reminderMinutes}
          onChange={setReminderMinutes}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>颜色</Text>
        <ColorPicker value={color} onChange={setColor} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    marginTop: 4,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  rowLabel: {
    fontSize: 15,
    color: '#333',
    width: 50,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  timeInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  ruleDesc: {
    fontSize: 14,
    color: '#00adf5',
    marginTop: 8,
    paddingLeft: 28,
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
