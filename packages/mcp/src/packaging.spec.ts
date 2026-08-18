import { readFileSync } from 'node:fs';
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

  it('publishes dist, data, and the mcp.json snippet', () => {
    expect(pkg.files).toEqual(expect.arrayContaining(['dist', 'data', 'mcp.json']));
  });
});
