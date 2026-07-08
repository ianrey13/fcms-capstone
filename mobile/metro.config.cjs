// metro.config.cjs - CommonJS format for Windows
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
  'web.js',
  'web.ts',
  'web.tsx',
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
  path: require.resolve('path-browserify'),
};

module.exports = withNativeWind(config, { 
  input: './global.css',
});