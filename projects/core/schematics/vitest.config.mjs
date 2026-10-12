import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The schematics run in Node under the Angular CLI, not in a browser build,
// so their specs live outside `ng test core` (angular.json excludes the
// folder there).
// The esbuild build loads a `.tpl` template as text; the specs do the same.
const templateText = {
  name: 'cngx-template-text',
  enforce: 'pre',
  transform(code, id) {
    return id.endsWith('.tpl') ? { code: `export default ${JSON.stringify(code)};`, map: null } : undefined;
  },
};

export default defineConfig({
  plugins: [templateText],
  test: {
    root: fileURLToPath(new URL('.', import.meta.url)),
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
  },
});
