// Runs the shared core specs (packages/mcp/src/core) against the zod install
// @cngx/cli ships with. cli:copy-check proves the copy holds the same bytes; this
// proves those bytes behave the same on the CLI's zod, which may resolve to a
// different 4.x than packages/mcp (both declare ^4.4.3, neither pins it). The
// alias is absolute, so every `from 'zod'` - in a spec or in a core source under
// packages/mcp - loads packages/cli/node_modules/zod. zod-source.core-spec.ts
// asserts that, so the run cannot fall back to the mcp install unnoticed.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const require = createRequire(new URL('./package.json', import.meta.url));
const zodDir = dirname(require.resolve('zod/package.json'));
const zodEntry = join(zodDir, JSON.parse(readFileSync(join(zodDir, 'package.json'), 'utf8')).exports['.'].import);

export default defineConfig({
  resolve: {
    alias: [{ find: /^zod$/, replacement: zodEntry }],
  },
  test: {
    root: fileURLToPath(new URL('../..', import.meta.url)),
    include: ['packages/mcp/src/core/**/*.spec.ts', 'packages/cli/src/**/*.core-spec.ts'],
    environment: 'node',
  },
});
