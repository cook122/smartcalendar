import { CalendarEvent } from './index';

export type RootStackParamList = {
  Calendar: undefined;
  Event: {
    eventId: string;
    date?: string;
    isExceptionInstance?: boolean;
  };
  EventEdit: {
    eventId?: string;
    selectedDate?: string;
    baseEvent?: CalendarEvent;
    instanceDate?: string;
    editScope?: 'this' | 'future' | 'all';
  };
  Settings: undefined;
  LogViewer: undefined;
};
