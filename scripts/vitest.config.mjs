import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tools/**/__tests__/**/*.test.mjs', 'scripts/__tests__/**/*.test.mjs'],
  },
});
