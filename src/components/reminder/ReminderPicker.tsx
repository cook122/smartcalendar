import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Props {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

const OPTIONS: { label: string; value: number | null }[] = [
  { label: '不提醒', value: null },
  { label: '准时', value: 0 },
  { label: '提前5分钟', value: 5 },
  { label: '提前15分钟', value: 15 },
  { label: '提前30分钟', value: 30 },
  { label: '提前1小时', value: 60 },
  { label: '提前1天', value: 1440 },
];

export default function ReminderPicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map(opt => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.option, selected && styles.optionActive]}
            onPress={() => onChange(opt.value)}>
            <Icon
              name="bell"
              size={14}
              color={selected ? '#fff' : '#666'}
              style={styles.optionIcon}
            />
            <Text style={[styles.optionText, selected && styles.optionTextActive]}>
              {opt.label}
            </Text>
            {selected && (
              <Icon name="check" size={14} color="#fff" style={styles.checkIcon} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: '#00adf5',
  },
  optionIcon: {
    marginRight: 10,
    width: 16,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
});
