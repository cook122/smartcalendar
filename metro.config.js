module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  },
  resolver: {
    extraNodeModules: {
      'react-native-web': require.resolve('./emptyModule.js'),
    },
  },
};
