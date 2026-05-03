import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useEventStore } from '../stores/eventStore';
import { getSettings, saveSettings } from '../storage/eventRepo';
import { AppSettings, DEFAULT_SETTINGS, EVENT_COLORS } from '../types';
import Icon from 'react-native-vector-icons/FontAwesome';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const loadEvents = useEventStore(s => s.loadEvents);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSetting = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  const handleClearData = () => {
    if (confirm('确定清除所有日程数据吗？此操作不可恢复。')) {
      // In real app, clear AsyncStorage events key
    }
  };

  const reminderLabels: Record<number, string> = {
    0: '准时',
    5: '提前5分钟',
    15: '提前15分钟',
    30: '提前30分钟',
    60: '提前1小时',
    1440: '提前1天',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>提醒设置</Text>
        {Object.entries(reminderLabels).map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={styles.optionRow}
            onPress={() => updateSetting({ defaultReminderMinutes: Number(val) })}>
            <Text style={styles.optionText}>{label}</Text>
            {settings.defaultReminderMinutes === Number(val) && (
              <Icon name="check" size={14} color="#00adf5" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>默认颜色</Text>
        <View style={styles.colorRow}>
          {EVENT_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                settings.defaultEventColor === color && styles.colorSwatchActive,
              ]}
              onPress={() => updateSetting({ defaultEventColor: color })}>
              {settings.defaultEventColor === color && (
                <View style={styles.checkMark} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>深色模式</Text>
          <Switch
            value={settings.theme === 'dark'}
            onValueChange={v => updateSetting({ theme: v ? 'dark' : 'light' })}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.debugBtn}
        onPress={() => navigation.navigate('LogViewer')}>
        <Icon name="bug" size={14} color="#00adf5" />
        <Text style={styles.debugText}>调试日志</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SmartCalendar v0.1.0</Text>
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
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 3,
  },
  checkMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    alignSelf: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 15,
    color: '#333',
  },
  debugBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingVertical: 12,
    gap: 6,
  },
  debugText: {
    fontSize: 14,
    color: '#00adf5',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
