import React, { useEffect, useRef } from 'react';
import { StatusBar, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { useEventStore } from './src/stores/eventStore';
import { setupNotificationChannel, scheduleAllReminders } from './src/services/ReminderService';
import { logger } from './src/utils/logger';

export default function App() {
  const loadEvents = useEventStore(s => s.loadEvents);
  const events = useEventStore(s => s.events);

  useEffect(() => {
    logger.info('App', 'App launched');
    loadEvents().then(() => {
      logger.info('App', 'Events loaded successfully');
    }).catch(e => {
      logger.error('App', 'Failed to load events', e);
    });

    if (Platform.OS === 'android') {
      setupNotificationChannel();
    }
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      scheduleAllReminders(events);
    }
  }, [events]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#00adf5" />
      <AppNavigator />
    </>
  );
}
