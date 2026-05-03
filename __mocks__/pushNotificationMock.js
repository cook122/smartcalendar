export default {
  configure: jest.fn(),
  localNotificationSchedule: jest.fn(),
  cancelLocalNotifications: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  registerAndroidChannels: jest.fn(),
  addEventListener: jest.fn(),
  requestPermissions: jest.fn(() => Promise.resolve(true)),
};
