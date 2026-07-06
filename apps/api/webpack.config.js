const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    library: { type: 'commonjs2' },
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  experiments: {
    outputModule: false,
  },
  // Prevent webpack from tree-shaking NestJS decorator-referenced classes
  // (classes only used as @Query(() => SomeClass) arguments). Without this,
  // webpack marks them as unused and they resolve to undefined at runtime,
  // causing "TypeError: metatype is not a constructor".
  optimization: {
    usedExports: false,
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
