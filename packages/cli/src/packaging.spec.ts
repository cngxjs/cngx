// Expected values come from the package contract in packages/cli/package.json
// as planned for the scaffold: bin `cngx` -> dist/index.js, the published file
// set, Node 20 floor, and no MCP SDK anywhere in the dependency fields or in any
// source file under src/ (core copy included).
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SourceFile } from './output-guards.js';
import { findSdkImports } from './output-guards.js';

interface Manifest {
  name: string;
  bin: Record<string, string>;
  files: string[];
  engines: { node: string };
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as Manifest;

describe('@cngx/cli package manifest', () => {
  it('is the scoped @cngx/cli package', () => {
    expect(pkg.name).toBe('@cngx/cli');
  });

  it('exposes only the cngx bin, pointing at the built entry', () => {
    expect(pkg.bin).toEqual({ cngx: 'dist/index.js' });
  });

  it('publishes dist, the bundled data, the readme and the changelog', () => {
    expect([...pkg.files].sort()).toEqual(['CHANGELOG.md', 'README.md', 'data', 'dist']);
  });

  it('declares the Node 20 floor', () => {
    expect(pkg.engines.node).toBe('>=20');
  });

  it('checks the bundled snapshot before publishing', () => {
    expect(pkg.scripts['prepublishOnly']).toContain('mcp-bundle-check.mjs --data-dir=packages/cli/data');
  });

  it('depends on no MCP SDK in any dependency field', () => {
    const fields = [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies];
    const names = fields.flatMap((field) => Object.keys(field ?? {}));

    expect(names.filter((name) => name.startsWith('@modelcontextprotocol/'))).toEqual([]);
  });
});

describe('@cngx/cli sources', () => {
  const SRC = fileURLToPath(new URL('.', import.meta.url));

  const sources = (dir: string): SourceFile[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return sources(path);
      }
      return entry.name.endsWith('.ts') ? [{ path, source: readFileSync(path, 'utf8') }] : [];
    });

  it('scans the adapter and the core copy', () => {
    const paths = sources(SRC).map((file) => file.path);

    expect(paths.some((path) => path.endsWith('cli-adapter.ts'))).toBe(true);
    expect(paths.some((path) => path.endsWith(join('core', 'registry.ts')))).toBe(true);
  });

  it('import no MCP SDK module', () => {
    expect(findSdkImports(sources(SRC))).toEqual([]);
  });
});

// The test-only guards are imported by specs alone; the tarball ships neither, and
// every sourcemap it ships either points at a shipped file or carries its source.
const TEST_ONLY_MODULES = /^dist\/(?:readme-guard|output-guards)\./;

/** Tarball paths of a test-only guard module. */
const shippedGuards = (files: readonly string[]): string[] => files.filter((file) => TEST_ONLY_MODULES.test(file));

interface SourceMap {
  sources: string[];
  sourcesContent?: (string | null)[];
}

/** `<map> -> <source>` for every map source that is neither shipped nor inlined. */
function danglingSources(files: readonly string[], readMap: (file: string) => SourceMap): string[] {
  const shipped = new Set(files);
  return files
    .filter((file) => file.endsWith('.map'))
    .flatMap((file) => {
      const map = readMap(file);
      return map.sources
        .filter((source, i) => typeof map.sourcesContent?.[i] !== 'string' && !shipped.has(normalize(join(dirname(file), source))))
        .map((source) => `${file} -> ${source}`);
    });
}

describe('@cngx/cli tarball', () => {
  const PKG_DIR = fileURLToPath(new URL('..', import.meta.url));
  // Needs `npm run build:cli` first, like entry.spec.ts.
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: PKG_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
  ) as { files: { path: string }[] }[];
  const files = packed[0].files.map((file) => file.path);
  const readMap = (file: string) => JSON.parse(readFileSync(join(PKG_DIR, file), 'utf8')) as SourceMap;

  it('ships the entry and the adapter', () => {
    expect(files).toContain('dist/index.js');
    expect(files).toContain('dist/cli-adapter.js');
  });

  it('ships neither test-only guard module', () => {
    expect(shippedGuards(files)).toEqual([]);
  });

  it('ships no sourcemap that points at an unshipped source', () => {
    expect(files.some((file) => file.endsWith('.map'))).toBe(true);
    expect(danglingSources(files, readMap)).toEqual([]);
  });

  it('mutation: a build without the exclude ships the guards', () => {
    expect(shippedGuards([...files, 'dist/readme-guard.js', 'dist/output-guards.d.ts'])).toEqual([
      'dist/readme-guard.js',
      'dist/output-guards.d.ts',
    ]);
  });

  it('mutation: a map without inlined sources dangles', () => {
    expect(danglingSources(['dist/x.js.map'], () => ({ sources: ['../src/x.ts'] }))).toEqual(['dist/x.js.map -> ../src/x.ts']);
  });
});
