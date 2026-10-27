// Expected values come from the package contract in packages/cli/package.json
// as planned for the scaffold: bin `cngx` -> dist/index.js, the published file
// set, Node 20 floor, and no MCP SDK anywhere in the dependency fields.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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
