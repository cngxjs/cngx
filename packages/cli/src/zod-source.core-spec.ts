// Source: the OD5 decision of the cli-core plan: the shared core specs also run
// against the zod @cngx/cli installs. Run by vitest.core.config.mjs only; the
// default config's `src/**/*.spec.ts` glob does not match this file. A core
// schema built under packages/mcp has its constructor exported by the zod module
// loaded from the cli install's own entry file, so the check holds by resolved
// path even when both installs carry the same zod version. (zod 4 answers
// `instanceof` by traits, which match across installs, so it cannot decide this.)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { versionInput } from '../../mcp/src/core/commands/version-input.js';

const CLI_DIR = fileURLToPath(new URL('..', import.meta.url));
const zodDir = dirname(createRequire(new URL('../package.json', import.meta.url)).resolve('zod/package.json'));
const zodManifest = JSON.parse(readFileSync(join(zodDir, 'package.json'), 'utf8')) as { exports: { '.': { import: string } } };
const CLI_ZOD_ENTRY = join(zodDir, zodManifest.exports['.'].import);

const versionOf = (packageJson: URL): string =>
  (createRequire(packageJson)('zod/package.json') as { version: string }).version;

const CLI_ZOD = versionOf(new URL('../package.json', import.meta.url));
const MCP_ZOD = versionOf(new URL('../../mcp/package.json', import.meta.url));

describe('the core spec run', () => {
  it('resolves the cli zod under packages/cli/node_modules', () => {
    expect(CLI_ZOD_ENTRY.startsWith(join(CLI_DIR, 'node_modules') + sep)).toBe(true);
  });

  it('builds the core schemas with the zod module loaded from that path', async () => {
    const cliZod = (await import(pathToFileURL(CLI_ZOD_ENTRY).href)) as Record<string, unknown>;

    expect(Object.values(cliZod)).toContain(versionInput.constructor);
  });

  it('tells the two installs apart: the mcp zod module does not export the core schema constructor', async () => {
    const mcpDir = dirname(createRequire(new URL('../../mcp/package.json', import.meta.url)).resolve('zod/package.json'));
    const mcpManifest = JSON.parse(readFileSync(join(mcpDir, 'package.json'), 'utf8')) as typeof zodManifest;
    const mcpZod = (await import(pathToFileURL(join(mcpDir, mcpManifest.exports['.'].import)).href)) as Record<string, unknown>;

    expect(mcpDir).not.toBe(zodDir);
    expect(Object.values(mcpZod)).not.toContain(versionInput.constructor);
  });

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
