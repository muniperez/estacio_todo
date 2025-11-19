const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que o Metro carregue arquivos .wasm usados pelo expo-sqlite no ambiente web
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== 'wasm');

module.exports = config;
