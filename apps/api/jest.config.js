/** Jest config for @org/api. Uses Babel (preset-typescript) — no SWC dep needed. */
module.exports = {
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.[tj]s$': 'babel-jest',
  },
  // Reflect metadata for NestJS decorators — must run before user code.
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  // Don't traverse up to the expo/mobile babelrc.
  configFile: '<rootDir>/babel.config.js',
};
