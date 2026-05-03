import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Switch, Clipboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useLogStore } from '../stores/logStore';
import Icon from 'react-native-vector-icons/FontAwesome';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LogViewer'>;

const LEVEL_COLORS: Record<string, string> = {
  info: '#333',
  warn: '#f0a500',
  error: '#d32f2f',
};

const LEVEL_LABELS: Record<string, string> = {
  info: '信息',
  warn: '警告',
  error: '错误',
};

export default function LogViewerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const logs = useLogStore(s => s.logs);
  const clearLogs = useLogStore(s => s.clearLogs);
  const getErrors = useLogStore(s => s.getErrors);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.level !== filter) return false;
    if (tagFilter && !l.tag.toLowerCase().includes(tagFilter.toLowerCase())) return false;
    return true;
  }).reverse(); // newest first

  const errors = getErrors();

  useEffect(() => {
    navigation.setOptions({
      title: `调试日志 (${filtered.length})`,
      headerRight: () => (
        <TouchableOpacity onPress={clearLogs} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>清空</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, filtered.length, clearLogs]);

  const copyToClipboard = async () => {
    const text = filtered.map(l => `[${l.timestamp}][${l.level}][${l.tag}] ${l.message}`).join('\n');
    try {
      Clipboard.setString(text);
      alert('日志已复制到剪贴板');
    } catch (_) {
      alert('复制功能暂不可用');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {(['all', 'info', 'warn', 'error'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}>
              <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                {{ all: '全部', info: '信息', warn: '警告', error: `错误(${errors.length})` }[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="按标签过滤..."
            value={tagFilter}
            onChangeText={setTagFilter}
          />
        </View>
        <View style={styles.optionsRow}>
          <Text style={styles.totalText}>共 {filtered.length} 条</Text>
          <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
            <Icon name="copy" size={12} color="#00adf5" />
            <Text style={styles.copyText}>复制</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View style={styles.logHeader}>
              <Text style={[styles.logLevel, { color: LEVEL_COLORS[item.level] }]}>
                {LEVEL_LABELS[item.level]}
              </Text>
              <Text style={styles.logTag}>[{item.tag}]</Text>
              <Text style={styles.logTime}>{item.timestamp}</Text>
            </View>
            <Text style={styles.logMessage}>{item.message}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => {
          if (autoScroll && filtered.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  toolbar: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  filterBtnActive: {
    backgroundColor: '#00adf5',
  },
  filterBtnText: {
    fontSize: 12,
    color: '#333',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  searchRow: {
    marginBottom: 6,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 12,
    color: '#999',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    color: '#00adf5',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearBtnText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  list: {
    padding: 8,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  logLevel: {
    fontSize: 11,
    fontWeight: 'bold',
    width: 36,
  },
  logTag: {
    fontSize: 11,
    color: '#00adf5',
    flex: 1,
  },
  logTime: {
    fontSize: 11,
    color: '#999',
  },
  logMessage: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
});
