/**
 * File:        apps/api/vitest.config.ts
 * Module:      API · Test Configuration
 * Purpose:     Vitest config using SWC for TypeScript decorator support
 *              Required for TypeORM entity tests
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  plugins: [
    swc.vite({
      tsconfigFile: './tsconfig.app.json',
    }),
  ],
});

