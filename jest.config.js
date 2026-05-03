module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        esModuleInterop: true,
        strict: true,
        baseUrl: '.',
        paths: { '@/*': ['src/*'] },
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(zustand|date-fns)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/asyncStorageMock.js',
    '^react-native-push-notification$':
      '<rootDir>/__mocks__/pushNotificationMock.js',
    '^react-native-vector-icons/.+$':
      '<rootDir>/__mocks__/vectorIconsMock.js',
    '^react-native-calendars$':
      '<rootDir>/__mocks__/calendarsMock.js',
    '^react-native$':
      '<rootDir>/__mocks__/reactNativeMock.js',
    '^@react-navigation/native$':
      '<rootDir>/__mocks__/navigationMock.js',
    '^@react-navigation/stack$':
      '<rootDir>/__mocks__/navigationMock.js',
    '^react-native-screens$':
      '<rootDir>/__mocks__/reactNativeScreensMock.js',
    '^react-native-safe-area-context$':
      '<rootDir>/__mocks__/safeAreaContextMock.js',
  },
};
