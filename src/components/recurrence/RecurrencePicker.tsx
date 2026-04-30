import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { RecurrenceRule } from '../../types';
import { getRuleDescription } from '../../services/RecurrenceEngine';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Props {
  value: RecurrenceRule | undefined;
  onChange: (rule: RecurrenceRule | undefined) => void;
}

const FREQ_OPTIONS = [
  { key: 'daily', label: '每天' },
  { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' },
  { key: 'yearly', label: '每年' },
];

const WEEK_DAYS = [
  { key: 0, label: '日' },
  { key: 1, label: '一' },
  { key: 2, label: '二' },
  { key: 3, label: '三' },
  { key: 4, label: '四' },
  { key: 5, label: '五' },
  { key: 6, label: '六' },
];

export default function RecurrencePicker({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(!!value);

  const toggleEnabled = () => {
    if (value) {
      onChange(undefined);
      setExpanded(false);
    } else {
      const newRule: RecurrenceRule = {
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      };
      onChange(newRule);
      setExpanded(true);
    }
  };

  const updateRule = (patch: Partial<RecurrenceRule>) => {
    if (!value) return;
    onChange({ ...value, ...patch });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleEnabled}>
        <View style={styles.headerLeft}>
          <Icon name="repeat" size={16} color="#666" style={styles.headerIcon} />
          <Text style={styles.headerText}>
            {value ? getRuleDescription(value) : '不重复'}
          </Text>
        </View>
        <Switch value={!!value} onValueChange={toggleEnabled} />
      </TouchableOpacity>

      {expanded && value && (
        <View style={styles.body}>
          <Text style={styles.label}>重复频率</Text>
          <View style={styles.freqRow}>
            {FREQ_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.freqBtn,
                  value.frequency === opt.key && styles.freqBtnActive,
                ]}
                onPress={() => updateRule({ frequency: opt.key as any })}>
                <Text
                  style={[
                    styles.freqBtnText,
                    value.frequency === opt.key && styles.freqBtnTextActive,
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {value.frequency === 'weekly' && (
            <>
              <Text style={styles.label}>重复日期</Text>
              <View style={styles.weekRow}>
                {WEEK_DAYS.map(d => {
                  const selected = value.byDay?.includes(d.key) || false;
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[
                        styles.weekDayBtn,
                        selected && styles.weekDayBtnActive,
                      ]}
                      onPress={() => {
                        const current = value.byDay || [];
                        const next = selected
                          ? current.filter(x => x !== d.key)
                          : [...current, d.key];
                        updateRule({ byDay: next });
                      }}>
                      <Text
                        style={[
                          styles.weekDayText,
                          selected && styles.weekDayTextActive,
                        ]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>间隔</Text>
          <View style={styles.intervalRow}>
            {[1, 2, 3, 6, 12].map(n => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.intervalBtn,
                  value.interval === n && styles.intervalBtnActive,
                ]}
                onPress={() => updateRule({ interval: n })}>
                <Text
                  style={[
                    styles.intervalBtnText,
                    value.interval === n && styles.intervalBtnTextActive,
                  ]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.intervalUnit}>次</Text>
          </View>

          <Text style={styles.label}>结束条件</Text>
          <View style={styles.endRow}>
            {(['never', 'count', 'until'] as const).map(endType => (
              <TouchableOpacity
                key={endType}
                style={[
                  styles.endBtn,
                  value.endType === endType && styles.endBtnActive,
                ]}
                onPress={() =>
                  updateRule({
                    endType,
                    ...(endType !== 'count' ? { endCount: undefined } : {}),
                    ...(endType !== 'until' ? { endUntil: undefined } : {}),
                  })
                }>
                <Text
                  style={[
                    styles.endBtnText,
                    value.endType === endType && styles.endBtnTextActive,
                  ]}>
                  {{ never: '永不', count: '次数', until: '日期' }[endType]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {value.endType === 'count' && (
            <View style={styles.countRow}>
              <Text style={styles.label}>重复</Text>
              <TouchableOpacity
                style={styles.countBtn}
                onPress={() =>
                  updateRule({ endCount: Math.max(1, (value.endCount || 1) - 1) })
                }>
                <Text style={styles.countBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.countValue}>{value.endCount || 1}</Text>
              <TouchableOpacity
                style={styles.countBtn}
                onPress={() =>
                  updateRule({ endCount: (value.endCount || 1) + 1 })
                }>
                <Text style={styles.countBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.label}>次</Text>
            </View>
          )}

          {value.endType === 'until' && (
            <View style={styles.untilRow}>
              <Text style={styles.label}>结束日期</Text>
              <TouchableOpacity
                style={styles.untilInput}
                onPress={() => {
                  // In real app, open a date picker
                }}>
                <Text>{value.endUntil || '选择日期'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerText: {
    fontSize: 15,
    color: '#333',
  },
  body: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  label: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
    marginTop: 10,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  freqBtnActive: {
    backgroundColor: '#00adf5',
  },
  freqBtnText: {
    fontSize: 14,
    color: '#333',
  },
  freqBtnTextActive: {
    color: '#fff',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekDayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayBtnActive: {
    backgroundColor: '#00adf5',
  },
  weekDayText: {
    fontSize: 14,
    color: '#333',
  },
  weekDayTextActive: {
    color: '#fff',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intervalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  intervalBtnActive: {
    backgroundColor: '#00adf5',
  },
  intervalBtnText: {
    fontSize: 14,
    color: '#333',
  },
  intervalBtnTextActive: {
    color: '#fff',
  },
  intervalUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  endRow: {
    flexDirection: 'row',
    gap: 8,
  },
  endBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  endBtnActive: {
    backgroundColor: '#00adf5',
  },
  endBtnText: {
    fontSize: 14,
    color: '#333',
  },
  endBtnTextActive: {
    color: '#fff',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnText: {
    fontSize: 18,
    color: '#333',
  },
  countValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  untilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  untilInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
});
