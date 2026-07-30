const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const defaultConfig = getDefaultConfig(projectRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;

module.exports = withNxMetro(
  {
    projectRoot,
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
      resolveRequest: (context, moduleName, platform) => {
        if (moduleName === './index') {
          return {
            type: 'sourceFile',
            filePath: path.join(projectRoot, 'index.js'),
          };
        }
        const { resolveRequest: baseResolve } = context;
        return baseResolve(context, moduleName, platform);
      },
    },
  },
  {
    extensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'cjs', 'mjs'],
  }
);