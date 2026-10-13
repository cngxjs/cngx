import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  assertPinsPublished,
  containsStableRelease,
  createSchematicsVersions,
  declaresSchematics,
  findPlaceholders,
  libBuildCommand,
  replaceVersionInDist,
  resolveDistTag,
  stampManifest,
} from '../publish.mjs';

describe('resolveDistTag', () => {
  it('lets an explicit --tag win over every derived rule', () => {
    expect(resolveDistTag({ nextVersion: '1.2.0', explicitTag: 'next', hasStableRelease: true })).toBe(
      'next',
    );
    expect(
      resolveDistTag({ nextVersion: '0.1.0-rc.8', explicitTag: 'beta', hasStableRelease: false }),
    ).toBe('beta');
  });

  it('publishes a stable version to latest', () => {
    expect(resolveDistTag({ nextVersion: '1.0.0', explicitTag: null, hasStableRelease: false })).toBe(
      'latest',
    );
    expect(resolveDistTag({ nextVersion: '1.0.1', explicitTag: null, hasStableRelease: true })).toBe(
      'latest',
    );
  });

  it('publishes a prerelease to latest while no stable release exists', () => {
    expect(
      resolveDistTag({ nextVersion: '0.1.0-rc.8', explicitTag: null, hasStableRelease: false }),
    ).toBe('latest');
  });

  it('keeps a prerelease on next once a stable release exists', () => {
    expect(
      resolveDistTag({ nextVersion: '1.1.0-rc.0', explicitTag: null, hasStableRelease: true }),
    ).toBe('next');
  });
});

describe('containsStableRelease', () => {
  it('is false when only prereleases are published', () => {
    expect(containsStableRelease(['0.1.0-rc.0', '0.1.0-rc.7'])).toBe(false);
  });

  it('is true once any stable version is published', () => {
    expect(containsStableRelease(['0.1.0-rc.7', '0.1.0'])).toBe(true);
  });

  it('is false for an unpublished package', () => {
    expect(containsStableRelease([])).toBe(false);
  });
});

describe('replaceVersionInDist', () => {
  const PLACEHOLDER = '0.0.0-PLACEHOLDER';
  let dist;

  function seed(relativePath, content) {
    const file = join(dist, relativePath);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, content);
    return file;
  }

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), 'cngx-publish-'));
  });

  afterEach(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  it('rewrites the placeholder in JS bundles and in JSON under schematics/', () => {
    const fesm = seed('fesm2022/cngx-core.mjs', `const v = '${PLACEHOLDER}';`);
    const bundle = seed('schematics/ng-add/index.js', `exports.v = '${PLACEHOLDER}';`);
    const schema = seed('schematics/ng-add/schema.json', `{ "default": "${PLACEHOLDER}" }`);

    replaceVersionInDist(dist, '0.1.0');

    expect(readFileSync(fesm, 'utf8')).toBe(`const v = '0.1.0';`);
    expect(readFileSync(bundle, 'utf8')).toBe(`exports.v = '0.1.0';`);
    expect(readFileSync(schema, 'utf8')).toBe(`{ "default": "0.1.0" }`);
  });

  it('leaves JSON outside schematics/ untouched', () => {
    const other = seed('i18n/data.json', `{ "v": "${PLACEHOLDER}" }`);

    replaceVersionInDist(dist, '0.1.0');

    expect(readFileSync(other, 'utf8')).toBe(`{ "v": "${PLACEHOLDER}" }`);
  });
});

describe('createSchematicsVersions', () => {
  it('pins the release, the mcp server, the eslint plugin and the Angular range', () => {
    expect(
      createSchematicsVersions({
        nextVersion: '0.1.0',
        mcpVersion: '0.2.0',
        eslintPluginVersion: '0.2.1',
        angularRange: '^21.2.0',
      }),
    ).toEqual({ cngx: '0.1.0', mcp: '0.2.0', eslintPlugin: '0.2.1', angular: '^21.2.0' });
  });
});

describe('assertPinsPublished', () => {
  const pins = { mcpVersion: '0.2.0', eslintPluginVersion: '0.2.1' };

  it('passes when every pinned version is on npm', () => {
    const asked = [];
    const view = (spec) => {
      asked.push(spec);
      return `${spec.slice(spec.lastIndexOf('@') + 1)}\n`;
    };

    expect(() => assertPinsPublished(pins, view)).not.toThrow();
    expect(asked).toEqual(['@cngx/mcp@0.2.0', '@cngx/eslint-plugin@0.2.1']);
  });

  it('refuses a pin npm does not list', () => {
    const view = (spec) => (spec.startsWith('@cngx/eslint-plugin') ? '' : '0.2.0');

    expect(() => assertPinsPublished(pins, view)).toThrow(
      '@cngx/eslint-plugin@0.2.1 is not on npm; publish it first',
    );
  });

  it('fails closed when the lookup throws', () => {
    const view = () => {
      throw new Error('E404');
    };

    expect(() => assertPinsPublished(pins, view)).toThrow('could not look up @cngx/mcp@0.2.0 on npm: E404');
  });
});

describe('libBuildCommand', () => {
  it('builds a lib without its schematics, which only the declaresSchematics gate adds', () => {
    expect(libBuildCommand('core')).toBe('npx ng build core');
    expect(libBuildCommand('themes')).toBe('node scripts/build-themes.mjs');
  });
});

describe('declaresSchematics', () => {
  it('ships schematics only when the source manifest names the collection', () => {
    expect(declaresSchematics({ schematics: './schematics/collection.json' })).toBe(true);
  });

  it('keeps an undeclared schematics folder out of the tarball', () => {
    expect(declaresSchematics({ name: '@cngx/core' })).toBe(false);
    expect(declaresSchematics({ schematics: '' })).toBe(false);
  });
});

describe('publishable libs', () => {
  const libs = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui', 'themes'];
  const sourcePkg = (lib) =>
    JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'projects', lib, 'package.json'), 'utf8'));

  it('all eight declare their schematics collection, so publish ships every ng-add', () => {
    expect(libs.filter((lib) => declaresSchematics(sourcePkg(lib)))).toEqual(libs);
  });

  it('group every package for ng update on core and name its migrations', () => {
    expect(sourcePkg('core')['ng-update']).toEqual({
      migrations: './schematics/migrations/migrations.json',
      packageGroup: libs.map((lib) => `@cngx/${lib}`),
    });
  });
});

describe('findPlaceholders', () => {
  it('reports the manifest fields that still carry the placeholder', () => {
    const pkg = {
      version: '0.0.0-PLACEHOLDER',
      peerDependencies: { '@cngx/core': '0.0.0-PLACEHOLDER', '@angular/core': '^21.2.0' },
      description: 'plain',
    };
    expect(findPlaceholders(pkg)).toEqual(['version', 'peerDependencies']);
  });

  it('accepts a fully rewritten manifest', () => {
    const pkg = { version: '0.1.0', peerDependencies: { '@cngx/core': '0.1.0' } };
    expect(findPlaceholders(pkg)).toEqual([]);
  });
});

describe('stampManifest', () => {
  it('rewrites the version and the cross-@cngx placeholder peers only', () => {
    const pkg = {
      version: '0.0.0-PLACEHOLDER',
      peerDependencies: { '@cngx/core': '0.0.0-PLACEHOLDER', '@angular/core': '^21.2.0' },
    };
    const stamped = stampManifest(pkg, '0.1.0');
    expect(stamped.version).toBe('0.1.0');
    expect(stamped.peerDependencies).toEqual({ '@cngx/core': '0.1.0', '@angular/core': '^21.2.0' });
    expect(findPlaceholders(stamped)).toEqual([]);
  });

  it('copes with a manifest without peers', () => {
    expect(stampManifest({ version: '0.0.0-PLACEHOLDER' }, '1.0.0')).toEqual({ version: '1.0.0' });
  });
});
