const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add GIF support for bundled exercise animations
config.resolver.assetExts.push('gif');

module.exports = config;
