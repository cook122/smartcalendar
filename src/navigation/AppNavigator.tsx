import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import CalendarScreen from '../screens/CalendarScreen';
import EventScreen from '../screens/EventScreen';
import EventEditScreen from '../screens/EventEditScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LogViewerScreen from '../screens/LogViewerScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Calendar"
        screenOptions={{
          headerStyle: { backgroundColor: '#00adf5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'SmartCalendar' }}
        />
        <Stack.Screen
          name="Event"
          component={EventScreen}
          options={{ title: '日程详情' }}
        />
        <Stack.Screen
          name="EventEdit"
          component={EventEditScreen}
          options={{ title: '编辑日程' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '设置' }}
        />
        <Stack.Screen
          name="LogViewer"
          component={LogViewerScreen}
          options={{ title: '调试日志' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
