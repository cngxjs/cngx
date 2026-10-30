// Every expectation encodes one row of the "Project layout and installed version"
// matrix in cngx-cli-core-phase-4-plan.md (copied from cngx-cli-core-plan.md).
// Layouts are real directories in a temp root, resolved through Node itself.

import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveInstalledCngxVersion } from './installed-version.js';

let root: string;

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'cngx-installed-spec-')));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const write = (path: string, content: string) => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
};

const manifest = (dir: string, fields: Record<string, unknown>) => write(join(dir, 'package.json'), JSON.stringify(fields));

/** An installed `@cngx/<lib>` at `version` under `<dir>/node_modules`. */
const install = (dir: string, lib: string, version: string) =>
  manifest(join(dir, 'node_modules', '@cngx', lib), { name: `@cngx/${lib}`, version });

describe('resolveInstalledCngxVersion - installed', () => {
  it('npm, flat node_modules: pins to the installed @cngx/core', () => {
    manifest(root, { dependencies: { '@cngx/core': '^0.2.0' } });
    install(root, 'core', '0.2.1');

    expect(resolveInstalledCngxVersion(root)).toEqual({
      version: '0.2.1',
      source: 'installed',
      notes: [],
      packages: { '@cngx/core': '0.2.1' },
    });
  });

  it('pnpm: follows the node_modules/@cngx symlink into .pnpm', () => {
    manifest(root, { dependencies: { '@cngx/core': '0.2.1' } });
    const store = join(root, 'node_modules', '.pnpm', '@cngx+core@0.2.1', 'node_modules', '@cngx', 'core');
    manifest(store, { name: '@cngx/core', version: '0.2.1' });
    mkdirSync(join(root, 'node_modules', '@cngx'), { recursive: true });
    symlinkSync(store, join(root, 'node_modules', '@cngx', 'core'), 'dir');

    expect(resolveInstalledCngxVersion(root)).toMatchObject({ version: '0.2.1', source: 'installed' });
  });

  it('workspace sub-package with deps hoisted to the root: walks to the ancestor node_modules', () => {
    manifest(root, { workspaces: ['packages/*'] });
    install(root, 'core', '0.2.0');
    const app = join(root, 'packages', 'app');
    manifest(app, { dependencies: { '@cngx/core': '^0.2.0' } });

    expect(resolveInstalledCngxVersion(app)).toMatchObject({ version: '0.2.0', source: 'installed' });
  });

  it('monorepo root and a non-hoisted sub-package: the nearest node_modules wins', () => {
    install(root, 'core', '0.1.0');
    const app = join(root, 'packages', 'app');
    manifest(app, { dependencies: { '@cngx/core': '0.2.0' } });
    install(app, 'core', '0.2.0');

    expect(resolveInstalledCngxVersion(app)).toMatchObject({ version: '0.2.0', source: 'installed' });
    expect(resolveInstalledCngxVersion(root)).toMatchObject({ version: '0.1.0', source: 'installed' });
  });

  it('mixed installed versions: @cngx/core wins and the disagreeing packages are listed', () => {
    install(root, 'core', '0.2.0');
    install(root, 'forms', '0.1.0');
    install(root, 'common', '0.2.0');

    const result = resolveInstalledCngxVersion(root);

    expect(result.version).toBe('0.2.0');
    expect(result.notes).toEqual(['installed @cngx packages disagree (@cngx/forms 0.1.0); using @cngx/core 0.2.0.']);
  });

  it('installed without @cngx/core: the first package in the fixed order wins and stderr says which', () => {
    install(root, 'ui', '0.3.0');
    install(root, 'forms', '0.2.0');

    const result = resolveInstalledCngxVersion(root);

    expect(result.version).toBe('0.2.0');
    expect(result.notes[0]).toBe('@cngx/core is not installed; using @cngx/forms 0.2.0.');
  });
});

describe('resolveInstalledCngxVersion - declared', () => {
  it.each([
    ['0.1.0-rc.9', '0.1.0-rc.9'],
    ['0.2.0', '0.2.0'],
    ['=0.2.0', '0.2.0'],
    ['v0.2.0', '0.2.0'],
  ])('nothing installed, declared exact %j: pins to %s', (specifier, expected) => {
    manifest(root, { dependencies: { '@cngx/core': specifier } });

    expect(resolveInstalledCngxVersion(root)).toEqual({
      version: expected,
      source: 'declared',
      notes: [`@cngx/core not installed, using declared ${expected}.`],
      packages: { '@cngx/core': specifier },
    });
  });

  it('npm: alias with an exact version pins to the aliased version', () => {
    manifest(root, { dependencies: { '@cngx/core': 'npm:@cngx/core@0.2.0' } });

    expect(resolveInstalledCngxVersion(root)).toMatchObject({ version: '0.2.0', source: 'declared' });
  });

  it('reads a peer-only declaration like dependencies', () => {
    manifest(root, { peerDependencies: { '@cngx/core': '0.2.0' } });

    expect(resolveInstalledCngxVersion(root)).toMatchObject({ version: '0.2.0', source: 'declared' });
  });

  it.each(['^0.1.0', '~0.2.0', '*'])('declared range %j: not pinned, stderr names the range', (range) => {
    manifest(root, { devDependencies: { '@cngx/core': range } });

    const result = resolveInstalledCngxVersion(root);

    expect(result).toMatchObject({ version: null, source: 'declared' });
    expect(result.notes).toEqual([
      `@cngx/core is declared as "${range}" in ${join(root, 'package.json')}, not an exact version, and not installed; answering from the bundled snapshot.`,
    ]);
  });

  it.each([
    'catalog:',
    'workspace:*',
    'latest',
    'next',
    'file:../cngx-core',
    'link:../cngx-core',
    'git+https://github.com/cngxjs/cngx.git',
    'https://example.com/cngx-core-0.2.0.tgz',
    'npm:@cngx/core@^0.2.0',
  ])('declared specifier %j: not pinned, stderr names it', (specifier) => {
    manifest(root, { dependencies: { '@cngx/core': specifier } });

    const result = resolveInstalledCngxVersion(root);

    expect(result.version).toBeNull();
    expect(result.notes[0]).toContain(`declared as "${specifier}"`);
  });

  it('skips a malformed ancestor package.json with one note and keeps walking', () => {
    manifest(root, { dependencies: { '@cngx/core': '0.2.0' } });
    const app = join(root, 'app');
    write(join(app, 'package.json'), '{ "name": ');

    const result = resolveInstalledCngxVersion(app);

    expect(result).toMatchObject({ version: '0.2.0', source: 'declared' });
    expect(result.notes[0]).toMatch(new RegExp(`^skipped malformed ${join(app, 'package.json').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: `));
  });

  it('Yarn PnP started without the PnP runtime: falls through to the declared rows and adds the PnP note', () => {
    manifest(root, { dependencies: { '@cngx/core': '^0.2.0' } });
    write(join(root, '.pnp.cjs'), '');

    const result = resolveInstalledCngxVersion(root);

    expect(result).toMatchObject({ version: null, source: 'declared' });
    expect(result.notes).toContain('Yarn PnP detected, run `yarn cngx` for the installed version.');
    expect(result.notes).not.toContain('no @cngx package found; answering from the bundled snapshot.');
  });

  it('no @cngx anywhere up to the filesystem root: bundled, stderr says so', () => {
    manifest(root, { dependencies: { rxjs: '^7.8.0' } });

    expect(resolveInstalledCngxVersion(root)).toEqual({
      version: null,
      source: 'none',
      notes: ['no @cngx package found; answering from the bundled snapshot.'],
      packages: {},
    });
  });
});
