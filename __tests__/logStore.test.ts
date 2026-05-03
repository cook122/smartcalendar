import { useLogStore } from '@/stores/logStore';

describe('logStore', () => {
  beforeEach(() => {
    useLogStore.getState().clearLogs();
  });

  it('adds info log', () => {
    useLogStore.getState().addLog('info', 'App', 'Started');
    const logs = useLogStore.getState().logs;
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].tag).toBe('App');
    expect(logs[0].message).toBe('Started');
  });

  it('adds error log', () => {
    useLogStore.getState().addLog('error', 'Net', 'Timeout');
    const errors = useLogStore.getState().getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Timeout');
  });

  it('filters logs by tag', () => {
    useLogStore.getState().addLog('info', 'App', 'A');
    useLogStore.getState().addLog('info', 'Net', 'B');
    useLogStore.getState().addLog('warn', 'App', 'C');
    const appLogs = useLogStore.getState().getLogsByTag('App');
    expect(appLogs.length).toBe(2);
  });

  it('clears logs', () => {
    useLogStore.getState().addLog('info', 'App', 'X');
    useLogStore.getState().clearLogs();
    expect(useLogStore.getState().logs.length).toBe(0);
  });

  it('caps at maxEntries', () => {
    for (let i = 0; i < 600; i++) {
      useLogStore.getState().addLog('info', 'Test', `log-${i}`);
    }
    expect(useLogStore.getState().logs.length).toBeLessThanOrEqual(500);
  });
});
