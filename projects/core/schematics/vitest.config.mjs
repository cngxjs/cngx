import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The schematics run in Node under the Angular CLI, not in a browser build,
// so their specs live outside `ng test core` (angular.json excludes the
// folder there).
export default defineConfig({
  test: {
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
  },
});
