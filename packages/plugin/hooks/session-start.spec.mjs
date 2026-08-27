import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildContext } from './session-start.mjs';

const created = [];

// Build a throwaway workspace on disk rather than committing a node_modules
// fixture - the repo gitignores every node_modules dir, so a committed one
// would vanish in CI. os.tmpdir() sits outside the repo, so the real
// node_modules resolution path is exercised for keeps.
function workspace(layout) {
  const dir = mkdtempSync(join(tmpdir(), 'cngx-plugin-'));
  created.push(dir);
  if (layout.pkg) {
    writeFileSync(join(dir, 'package.json'), JSON.stringify(layout.pkg));
  }
  for (const [name, version] of Object.entries(layout.installed ?? {})) {
    const pkgDir = join(dir, 'node_modules', '@cngx', name);
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: `@cngx/${name}`, version }));
  }
  if (layout.profile) {
    mkdirSync(join(dir, '.cngx'), { recursive: true });
    writeFileSync(join(dir, '.cngx', 'profile.json'), JSON.stringify(layout.profile));
  }
  return dir;
}

afterEach(() => {
  while (created.length > 0) {
    rmSync(created.pop(), { recursive: true, force: true });
  }
});

describe('buildContext', () => {
  it('reports the installed @cngx version plus MCP and llms pointers', () => {
    const dir = workspace({ installed: { forms: '0.1.0-rc.0' } });
    const out = buildContext(dir);
    expect(out).toContain('@cngx/forms@0.1.0-rc.0');
    expect(out).toMatch(/MCP tools/i);
    expect(out).toContain('https://cngxjs.github.io/cngx/llms.txt');
    expect(out).toContain('https://cngxjs.github.io/cngx/llms-full.txt');
  });

  it('merges .cngx/profile.json libs and brand-token pointers', () => {
    const dir = workspace({
      installed: { forms: '0.1.0-rc.0' },
      profile: { libs: ['@cngx/forms', '@cngx/ui'], brandTokens: 'src/styles/brand.css' },
    });
    const out = buildContext(dir);
    expect(out).toContain('@cngx/forms, @cngx/ui');
    expect(out).toContain('src/styles/brand.css');
  });

  it('stays silent when the workspace has no cngx footprint at all', () => {
    const dir = workspace({ pkg: { name: 'plain-app', dependencies: { rxjs: '^7.8.0' } } });
    expect(buildContext(dir)).toBe('');
  });

  it('still speaks for a profile-only workspace (declared footprint, nothing installed yet)', () => {
    const dir = workspace({
      pkg: { name: 'plain-app', dependencies: { rxjs: '^7.8.0' } },
      profile: { libs: ['@cngx/forms'] },
    });
    const out = buildContext(dir);
    expect(out).toContain('No @cngx/* packages');
    expect(out).toContain('@cngx/forms');
    expect(out).toContain('https://cngxjs.github.io/cngx/llms.txt');
  });
});
