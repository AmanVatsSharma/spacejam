module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Required to parse NestJS decorators (e.g. @ObjectType() in user.type.ts).
    // legacy/loose matches tsconfig's experimentalDecorators semantics.
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
  ],
};
