import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@enums': fileURLToPath(new URL('../src/common/enums.ts', import.meta.url)),
    },
  },
  plugins: [
    tsconfigPaths({ root: './', projects: ['./tsconfig.base.json'] }),
    swc.vite({
      tsconfigFile: './tsconfig.app.json',
    }),
  ],
});
