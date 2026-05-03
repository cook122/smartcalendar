module.exports = {
  StyleSheet: {
    create: (styles) => styles,
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Image: 'Image',
  StatusBar: {
    currentHeight: 24,
    setHidden: jest.fn(),
    setBarStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
  },
  Platform: {
    OS: 'android',
    select: (obj) => obj.android || obj.default,
  },
  Dimensions: {
    get: () => ({ width: 360, height: 800 }),
  },
  Alert: {
    alert: jest.fn(),
  },
  AppRegistry: {
    registerComponent: jest.fn(),
  },
};
