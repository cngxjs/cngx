import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readJson = (rel: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));

describe('bundled mcp.json client snippet', () => {
  it('registers the cngx server as an npx invocation of this package', () => {
    const snippet = readJson('../mcp.json') as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };

    expect(snippet.mcpServers.cngx).toEqual({ command: 'npx', args: ['-y', '@cngx/mcp'] });
  });
});

describe('package manifest', () => {
  const pkg = readJson('../package.json') as {
    bin: Record<string, string>;
    files: string[];
  };

  it('exposes the cngx-mcp bin pointing at the built entry', () => {
    expect(pkg.bin['cngx-mcp']).toBe('dist/index.js');
  });

  it('publishes dist, data, the mcp.json snippet, the readme, the changelog and the license', () => {
    expect([...pkg.files].sort()).toEqual(['CHANGELOG.md', 'LICENSE', 'README.md', 'data', 'dist', 'mcp.json']);
  });
});

// The tarball ships an allowlist: the manifest, the docs, the client snippet, the
// bundled snapshot (plus the optional llm-md dump) and compiled JavaScript with its
// declarations and maps (the package names `types`), never a spec, a test or a
// test helper.
const FIXED_FILES: ReadonlySet<string> = new Set([
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'mcp.json',
  'data/documentation.json',
]);
const OPTIONAL_FILES: ReadonlySet<string> = new Set(['data/llm-context.md']);
const COMPILED = /^dist\/.+\.(?:js|d\.ts)(?:\.map)?$/;
const TEST_ONLY = /(?:\.spec|\.core-spec|\.test)\.(?:js|d\.ts)(?:\.map)?$|(?:^|\/)(?:testing|__fixtures__)\//;

/** Tarball paths outside the allowlist. */
const offAllowlist = (files: readonly string[]): string[] =>
  files.filter(
    (file) => !FIXED_FILES.has(file) && !OPTIONAL_FILES.has(file) && !(COMPILED.test(file) && !TEST_ONLY.test(file)),
  );

describe('@cngx/mcp tarball', () => {
  const PKG_DIR = fileURLToPath(new URL('..', import.meta.url));
  // Needs `npm run build:mcp` first, like the cli tarball spec.
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: PKG_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }),
  ) as { files: { path: string }[] }[];
  const files = packed[0].files.map((file) => file.path);

  it('ships the entry and its declarations', () => {
    expect(files).toContain('dist/index.js');
    expect(files).toContain('dist/index.d.ts');
  });

  it('ships only allowlisted paths, every fixed file among them', () => {
    expect(offAllowlist(files)).toEqual([]);
    expect(files.filter((file) => FIXED_FILES.has(file)).sort()).toEqual([...FIXED_FILES].sort());
  });

  it('ships the root LICENSE byte for byte', () => {
    expect(readFileSync(join(PKG_DIR, 'LICENSE'))).toEqual(readFileSync(join(PKG_DIR, '..', '..', 'LICENSE')));
  });

  it('mutation: a spec, a test, test helpers, fixtures and stray files fall off the allowlist', () => {
    const planted = [
      'dist/server.spec.js',
      'dist/core/query.core-spec.d.ts',
      'dist/x.test.js.map',
      'dist/testing/fake-docs.js',
      'dist/__fixtures__/surface.js',
      'src/index.ts',
      'tsconfig.json',
      'data/other.json',
    ];

    expect(offAllowlist([...planted, 'dist/index.js', 'data/llm-context.md'])).toEqual(planted);
  });
});
