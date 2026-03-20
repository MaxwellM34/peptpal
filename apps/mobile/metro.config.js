const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo support
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force react-native and react to always resolve from the workspace root.
// pnpm installs older peer-dep versions in packages/ui/node_modules which
// causes a JS/native version mismatch (PlatformConstants not found).
const rnRoot = path.resolve(workspaceRoot, 'node_modules/react-native');
const reactRoot = path.resolve(workspaceRoot, 'node_modules/react');
const emptyModule = path.resolve(projectRoot, 'src/empty-module.js');
const origResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native') {
    return { filePath: path.join(rnRoot, 'index.js'), type: 'sourceFile' };
  }
  if (moduleName === 'react') {
    return { filePath: path.join(reactRoot, 'index.js'), type: 'sourceFile' };
  }
  // expo-sqlite uses WebAssembly on web which Metro can't bundle — shim it
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return { filePath: emptyModule, type: 'sourceFile' };
  }
  const fn = origResolve ?? context.resolveRequest;
  return fn(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
