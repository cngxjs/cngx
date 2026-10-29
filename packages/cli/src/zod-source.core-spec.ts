// Source: the OD5 decision of the cli-core plan: the shared core specs also run
// against the zod @cngx/cli installs. Run by vitest.core.config.mjs only; the
// default config's `src/**/*.spec.ts` glob does not match this file. Every zod
// schema carries the version of the zod that built it (`_zod.version`), so a core
// source under packages/mcp proves which install it was loaded with.
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { versionInput } from '../../mcp/src/core/commands/version-input.js';

const versionOf = (packageJson: URL): string =>
  (createRequire(packageJson)('zod/package.json') as { version: string }).version;

const CLI_ZOD = versionOf(new URL('../package.json', import.meta.url));
const MCP_ZOD = versionOf(new URL('../../mcp/package.json', import.meta.url));

describe('the core spec run', () => {
  it('builds the core schemas with the zod of packages/cli', () => {
    const { major, minor, patch } = (versionInput as unknown as { _zod: { version: Record<string, number> } })._zod
      .version;

    expect(`${major}.${minor}.${patch}`).toBe(CLI_ZOD);
  });

  it('runs on a zod 4 install in both packages', () => {
    expect(CLI_ZOD).toMatch(/^4\./);
    expect(MCP_ZOD).toMatch(/^4\./);
  });
});
