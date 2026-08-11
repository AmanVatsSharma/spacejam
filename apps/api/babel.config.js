module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Emits the design:* metadata that TypeORM entities rely on at runtime
    // (mirrors tsconfig's emitDecoratorMetadata: true). MUST come before
    // @babel/plugin-proposal-decorators — this order is the canonical
    // NestJS+TypeORM+jest recipe.
    'babel-plugin-transform-typescript-metadata',
    // Parse NestJS decorators (e.g. @ObjectType() in user.type.ts).
    // legacy/loose matches tsconfig's experimentalDecorators semantics.
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
  ],
};
