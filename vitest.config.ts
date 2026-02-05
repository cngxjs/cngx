import { defineConfig } from 'vitest/config';
import { join } from 'path';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: join(__dirname, 'tsconfig.spec.json'),
      jit: true,  // JIT Mode für Tests
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    include: ['projects/**/*.spec.ts'],
    server: {
      deps: {
        inline: [
          /^@angular/,
          '@analogjs/vite-plugin-angular',
        ]
      }
    },
  },
  resolve: {
    alias: {
      '@cngx/common': join(__dirname, 'projects/common/src/public-api.ts')
    },
  },
});