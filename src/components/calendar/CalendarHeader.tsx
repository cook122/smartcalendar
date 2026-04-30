import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Props {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onToday: () => void;
}

export default function CalendarHeader({ currentMonth, onMonthChange, onToday }: Props) {
  const date = new Date(currentMonth + '-01');

  const goPrev = () => {
    const prev = subMonths(date, 1);
    onMonthChange(format(prev, 'yyyy-MM'));
  };

  const goNext = () => {
    const next = addMonths(date, 1);
    onMonthChange(format(next, 'yyyy-MM'));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goPrev} style={styles.arrowBtn}>
        <Text style={styles.arrow}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToday} style={styles.titleBtn}>
        <Text style={styles.title}>
          {format(date, 'yyyy年M月', { locale: zhCN })}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goNext} style={styles.arrowBtn}>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#00adf5',
  },
  arrowBtn: {
    padding: 8,
  },
  arrow: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  titleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
