import { describe, expect, it } from 'vitest';

import { bumpMcpPin, bumpPluginManifest, parseArgs } from '../plugin-release.mjs';

describe('bumpPluginManifest', () => {
  it('sets the version and preserves every other field', () => {
    const manifest = { name: 'cngx', version: '0.1.0-rc.0', mcpServers: './.mcp.json' };
    const next = bumpPluginManifest(manifest, '0.1.0-rc.1');
    expect(next.version).toBe('0.1.0-rc.1');
    expect(next.name).toBe('cngx');
    expect(next.mcpServers).toBe('./.mcp.json');
  });
});

describe('bumpMcpPin', () => {
  const config = {
    mcpServers: { cngx: { command: 'npx', args: ['-y', '@cngx/mcp@0.1.0-rc.0'] } },
  };

  it('rewrites only the @cngx/mcp pin and keeps the rest of the invocation', () => {
    const next = bumpMcpPin(config, '0.2.0');
    expect(next.mcpServers.cngx.args).toEqual(['-y', '@cngx/mcp@0.2.0']);
    expect(next.mcpServers.cngx.command).toBe('npx');
  });

  it('is a no-op when there is no cngx server to pin', () => {
    const bare = { mcpServers: {} };
    expect(bumpMcpPin(bare, '0.2.0')).toEqual(bare);
  });
});

describe('parseArgs', () => {
  it('reads --version, --mcp and --dry-run', () => {
    expect(parseArgs(['--version', '0.1.0-rc.1', '--mcp', '0.2.0', '--dry-run'])).toEqual({
      version: '0.1.0-rc.1',
      mcp: '0.2.0',
      dryRun: true,
    });
  });

  it('defaults mcp to null and dryRun to false', () => {
    expect(parseArgs(['--version', '0.1.0-rc.1'])).toEqual({
      version: '0.1.0-rc.1',
      mcp: null,
      dryRun: false,
    });
  });
});
