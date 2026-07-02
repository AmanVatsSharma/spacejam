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

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    globals: false,
    environment: 'node',
  },
});
