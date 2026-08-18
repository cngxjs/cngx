import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(here, '..');
const repoRoot = resolve(here, '../../..');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const pluginManifestPath = resolve(pluginRoot, '.claude-plugin/plugin.json');
const mcpConfigPath = resolve(pluginRoot, '.mcp.json');
const marketplacePath = resolve(repoRoot, '.claude-plugin/marketplace.json');

// A pinned scoped-package spec: "@cngx/mcp@<version>" with a real, non-floating
// version. Rejects bare "@cngx/mcp" and "@cngx/mcp@latest".
const MCP_PIN = /^@cngx\/mcp@(?!latest$)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/;

describe('plugin manifests are valid JSON', () => {
  it('parses plugin.json, marketplace.json and .mcp.json', () => {
    expect(() => readJson(pluginManifestPath)).not.toThrow();
    expect(() => readJson(marketplacePath)).not.toThrow();
    expect(() => readJson(mcpConfigPath)).not.toThrow();
  });
});

describe('manifests resolve to each other', () => {
  const marketplace = readJson(marketplacePath);
  const plugin = readJson(pluginManifestPath);

  it('the marketplace advertises the cngx plugin at packages/plugin', () => {
    const entry = marketplace.plugins.find((p) => p.name === 'cngx');
    expect(entry).toBeDefined();
    expect(entry.source).toBe('./packages/plugin');
    const resolved = resolve(repoRoot, entry.source, '.claude-plugin/plugin.json');
    expect(resolved).toBe(pluginManifestPath);
    expect(existsSync(resolved)).toBe(true);
  });

  it('the plugin manifest name matches the marketplace entry', () => {
    const entry = marketplace.plugins.find((p) => p.name === 'cngx');
    expect(plugin.name).toBe(entry.name);
  });

  it('the plugin manifest references the bundled .mcp.json and the file exists', () => {
    expect(plugin.mcpServers).toBe('./.mcp.json');
    expect(existsSync(mcpConfigPath)).toBe(true);
  });
});

describe('bundled MCP wiring is version-pinned', () => {
  const mcp = readJson(mcpConfigPath);

  it('starts the cngx server via npx', () => {
    expect(mcp.mcpServers.cngx.command).toBe('npx');
    expect(mcp.mcpServers.cngx.args).toContain('-y');
  });

  it('pins an explicit, well-formed @cngx/mcp version (never floating @latest)', () => {
    const spec = mcp.mcpServers.cngx.args.find((a) => a.startsWith('@cngx/mcp'));
    expect(spec, 'no @cngx/mcp argument found').toBeDefined();
    expect(spec).not.toBe('@cngx/mcp');
    const match = MCP_PIN.exec(spec);
    expect(match, `"${spec}" is not a pinned semver spec`).not.toBeNull();
    expect(match[1]).toMatch(/^\d+\.\d+\.\d+/);
  });
});
