import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  assertPinsPublished,
  assertReleaseMigration,
  checkReleaseMigrations,
  releaseMigrationKeys,
  containsStableRelease,
  createSchematicsVersions,
  declaresSchematics,
  findPlaceholders,
  libBuildCommand,
  npmViewVersion,
  REFRESH_FACTORY,
  refreshMigrationKey,
  replaceVersionInDist,
  resolveDistTag,
  stampManifest,
  stampRefreshMigration,
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
      throw new Error('ENOTFOUND');
    };

    expect(() => assertPinsPublished(pins, view)).toThrow('could not look up @cngx/mcp@0.2.0 on npm: ENOTFOUND');
  });

  it('refuses an E404 from npm view as not on npm', () => {
    const exec = () => {
      throw Object.assign(new Error('Command failed'), {
        status: 1,
        stderr: 'npm warn noise\nnpm error code E404\nnpm error 404 No match found for version 0.2.1\n',
      });
    };
    const view = (spec) => (spec.startsWith('@cngx/mcp') ? '0.2.0\n' : npmViewVersion(spec, '', exec));

    expect(() => assertPinsPublished(pins, view)).toThrow(
      '@cngx/eslint-plugin@0.2.1 is not on npm; publish it first',
    );
  });
});

describe('npmViewVersion', () => {
  it('asks npm for the version on the given registry', () => {
    const commands = [];
    const exec = (command) => {
      commands.push(command);
      return '0.2.0\n';
    };

    expect(npmViewVersion('@cngx/mcp@0.2.0', ' --registry http://localhost:4873', exec)).toBe('0.2.0\n');
    expect(commands).toEqual(['npm view @cngx/mcp@0.2.0 version --registry http://localhost:4873']);
  });

  it('reports any other npm failure by its error code only', () => {
    const exec = () => {
      throw Object.assign(new Error('Command failed'), {
        status: 1,
        stderr: 'npm warn noise\nnpm error code ENOTFOUND\nnpm error network request failed\n',
      });
    };

    expect(() => npmViewVersion('@cngx/mcp@0.2.0', '', exec)).toThrow(/^ENOTFOUND$/);
  });

  it('falls back to the exit status when npm names no error code', () => {
    const exec = () => {
      throw Object.assign(new Error('Command failed'), { status: 127, stderr: '' });
    };

    expect(() => npmViewVersion('@cngx/mcp@0.2.0', '', exec)).toThrow('npm view exited with 127');
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

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SOURCE_COLLECTION = {
  schematics: {
    'migration-v0.1.0': { version: '0.1.0', description: 'first', factory: './0.1.0/index#migrate' },
  },
};

describe('stampRefreshMigration', () => {
  it('keys a refresh entry to a release without its own migration', () => {
    const stamped = stampRefreshMigration(SOURCE_COLLECTION, '0.1.1');

    expect(stamped.schematics['migration-v0.1.1-refresh']).toEqual({
      version: '0.1.1',
      description: expect.stringContaining('0.1.1'),
      factory: REFRESH_FACTORY,
    });
    expect(stamped.schematics['migration-v0.1.0']).toEqual(SOURCE_COLLECTION.schematics['migration-v0.1.0']);
    expect(Object.keys(SOURCE_COLLECTION.schematics)).toEqual(['migration-v0.1.0']);
  });

  it('leaves a release that brings its own migration alone', () => {
    expect(stampRefreshMigration(SOURCE_COLLECTION, '0.1.0')).toBe(SOURCE_COLLECTION);
  });

  it('keys a prerelease as it is', () => {
    const stamped = stampRefreshMigration(SOURCE_COLLECTION, '0.1.1-rc.0');

    expect(stamped.schematics['migration-v0.1.1-rc.0-refresh']?.version).toBe('0.1.1-rc.0');
  });
});

describe('stampRefreshMigration on a collection the CLI cannot load', () => {
  it('refuses a collection without a schematics map', () => {
    expect(() => stampRefreshMigration({}, '0.1.1')).toThrow('the ng update collection has no schematics map');
    expect(() => stampRefreshMigration({ schematics: [] }, '0.1.1')).toThrow('no schematics map');
  });
});

describe('releaseMigrationKeys', () => {
  it('names the entries keyed to the release, own or stamped', () => {
    expect(releaseMigrationKeys(SOURCE_COLLECTION, '0.1.0')).toEqual(['migration-v0.1.0']);
    expect(releaseMigrationKeys(stampRefreshMigration(SOURCE_COLLECTION, '0.1.1'), '0.1.1')).toEqual([
      refreshMigrationKey('0.1.1'),
    ]);
    expect(releaseMigrationKeys(SOURCE_COLLECTION, '0.1.1')).toEqual([]);
  });
});

describe('assertReleaseMigration', () => {
  it('accepts an entry for the release whose factory module exists', () => {
    const seen = [];

    assertReleaseMigration(stampRefreshMigration(SOURCE_COLLECTION, '0.1.1'), '0.1.1', (module) => {
      seen.push(module);
      return true;
    });

    expect(seen).toEqual(['./refresh/index']);
  });

  it('refuses a stamped refresh entry whose factory module is missing', () => {
    expect(() =>
      assertReleaseMigration(stampRefreshMigration(SOURCE_COLLECTION, '0.1.1'), '0.1.1', () => false),
    ).toThrow(`the ng update migration ${refreshMigrationKey('0.1.1')} for 0.1.1 names no factory module`);
  });

  it('refuses a release migration of its own whose factory module is missing', () => {
    expect(() =>
      assertReleaseMigration(SOURCE_COLLECTION, '0.1.0', (module) => module !== './0.1.0/index'),
    ).toThrow('the ng update migration migration-v0.1.0 for 0.1.0 names no factory module');
  });
});

describe('checkReleaseMigrations', () => {
  const SOURCE = join(ROOT_DIR, 'projects', 'core', 'schematics', 'migrations', 'migrations.json');

  it('passes the source collection for a release with and without its own migration', () => {
    expect(Object.keys(checkReleaseMigrations(SOURCE, '0.1.0', '.ts').schematics)).toEqual(['migration-v0.1.0']);
    expect(checkReleaseMigrations(SOURCE, '0.1.1', '.ts').schematics[refreshMigrationKey('0.1.1')]?.factory).toBe(
      REFRESH_FACTORY,
    );
  });

  it('looks for each factory module next to the collection with the given extension', () => {
    const asked = [];
    const read = () => JSON.stringify(SOURCE_COLLECTION);
    const exists = (path) => {
      asked.push(path);
      return true;
    };

    checkReleaseMigrations('/dist/core/schematics/migrations/migrations.json', '0.1.1', '.js', read, exists);

    expect(asked).toEqual([join('/dist/core/schematics/migrations', 'refresh', 'index.js')]);
  });

  it('refuses a release whose refresh bundle the build dropped', () => {
    const read = () => JSON.stringify(SOURCE_COLLECTION);

    expect(() => checkReleaseMigrations('/dist/migrations.json', '0.1.1', '.js', read, () => false)).toThrow(
      'names no factory module',
    );
  });

  it('refuses a collection that is missing or not JSON', () => {
    const missing = () => {
      throw new Error('ENOENT: no such file');
    };

    expect(() => checkReleaseMigrations('/dist/migrations.json', '0.1.1', '.js', missing)).toThrow('ENOENT');
    expect(() => checkReleaseMigrations('/dist/migrations.json', '0.1.1', '.js', () => '{ not json')).toThrow();
  });
});

// `ng update` picks entries by `>from <=to` with prereleases included
// (@angular/cli/src/commands/update/utilities/migration.js). The range is
// rebuilt here with the CLI's own semver; the first case fails when the CLI
// changes how it builds it, so the cases below never test a stale copy.
describe('Angular CLI migration range', () => {
  const cliRequire = createRequire(createRequire(import.meta.url).resolve('@angular/cli/package.json'));
  const semver = cliRequire('semver');
  const MIGRATION_JS = join(
    dirname(cliRequire.resolve('@angular/cli/package.json')),
    'src/commands/update/utilities/migration.js',
  );

  function selects(from, to, version) {
    const range = new semver.Range(
      '>' + (semver.prerelease(from) ? from.split('-')[0] + '-0' : from) + ' <=' + to.split('-')[0],
    );
    return semver.satisfies(version, range, { includePrerelease: true });
  }

  it('is the range the installed CLI builds', () => {
    const source = readFileSync(MIGRATION_JS, 'utf8');

    expect(source).toContain(
      "new semver.Range('>' + (semver.prerelease(from) ? from.split('-')[0] + '-0' : from) + ' <=' + to.split('-')[0])",
    );
    expect(source).toContain('{ includePrerelease: true }');
  });

  it('selects the refresh entry of a stable release', () => {
    expect(selects('0.1.0', '0.1.1', '0.1.1')).toBe(true);
  });

  it('selects the refresh entry of a prerelease', () => {
    expect(selects('0.1.0', '0.1.1-rc.0', '0.1.1-rc.0')).toBe(true);
  });

  it('selects the entry of the release candidate from an earlier candidate', () => {
    expect(selects('0.1.1-rc.0', '0.1.1-rc.1', '0.1.1-rc.1')).toBe(true);
  });

  it('selects the stable entry between two candidates of that release', () => {
    expect(selects('0.1.0-rc.7', '0.1.0-rc.8', '0.1.0')).toBe(true);
  });

  it('skips the entry of the release an app already runs', () => {
    expect(selects('0.1.1', '0.1.2', '0.1.1')).toBe(false);
  });
});
