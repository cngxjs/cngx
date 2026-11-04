import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PACKED_LIBS, TOOLING_PACKAGES } from '../cngx-libs.mjs';

import {
  assertDependencyResolvable,
  assertPinsPublished,
  assertVersionAdvances,
  assertWholeGroup,
  compareReleaseVersions,
  assertReleaseMigration,
  checkReleaseMigrations,
  releaseMigrationKeys,
  containsStableRelease,
  createSchematicsVersions,
  declaresSchematics,
  findPlaceholders,
  libBuildCommand,
  npmViewVersion,
  publishOrder,
  REFRESH_FACTORY,
  refreshMigrationKey,
  releasePins,
  replaceVersionInDist,
  resolveDistTag,
  runToolingSection,
  stampManifest,
  stampRefreshMigration,
  stampSchematicsDist,
  stampToolingManifest,
  toolingBuildSteps,
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

  it('pins @cngx/mcp at the release version, published in the same run', () => {
    const versions = createSchematicsVersions({
      ...releasePins({ nextVersion: '0.3.0', eslintPluginVersion: '0.2.1' }),
      angularRange: '^21.2.0',
    });

    expect(versions).toEqual({ cngx: '0.3.0', mcp: '0.3.0', eslintPlugin: '0.2.1', angular: '^21.2.0' });
  });
});

describe('assertPinsPublished', () => {
  const pins = { eslintPluginVersion: '0.2.1' };

  it('looks up only the eslint-plugin pin; @cngx/mcp is published in the same run', () => {
    const asked = [];
    const view = (spec) => {
      asked.push(spec);
      return `${spec.slice(spec.lastIndexOf('@') + 1)}\n`;
    };

    expect(() => assertPinsPublished(pins, view)).not.toThrow();
    expect(asked).toEqual(['@cngx/eslint-plugin@0.2.1']);
  });

  it('refuses a pin npm does not list', () => {
    const view = () => '';

    expect(() => assertPinsPublished(pins, view)).toThrow(
      '@cngx/eslint-plugin@0.2.1 is not on npm; publish it first',
    );
  });

  it('fails closed when the lookup throws', () => {
    const view = () => {
      throw new Error('ENOTFOUND');
    };

    expect(() => assertPinsPublished(pins, view)).toThrow(
      'could not look up @cngx/eslint-plugin@0.2.1 on npm: ENOTFOUND',
    );
  });

  it('refuses an E404 from npm view as not on npm', () => {
    const exec = () => {
      throw Object.assign(new Error('Command failed'), {
        status: 1,
        stderr: 'npm warn noise\nnpm error code E404\nnpm error 404 No match found for version 0.2.1\n',
      });
    };
    const view = (spec) => npmViewVersion(spec, '', exec);

    expect(() => assertPinsPublished(pins, view)).toThrow(
      '@cngx/eslint-plugin@0.2.1 is not on npm; publish it first',
    );
  });
});

describe('compareReleaseVersions', () => {
  it('sorts a prerelease below its release and the release below the next patch', () => {
    expect(compareReleaseVersions('0.1.0-rc.9', '0.1.0')).toBeLessThan(0);
    expect(compareReleaseVersions('0.1.0', '0.1.1')).toBeLessThan(0);
    expect(compareReleaseVersions('0.1.1', '0.1.0-rc.9')).toBeGreaterThan(0);
  });

  it('compares numeric prerelease identifiers as numbers', () => {
    expect(compareReleaseVersions('0.1.0-rc.9', '0.1.0-rc.10')).toBeLessThan(0);
    expect(compareReleaseVersions('0.1.0-rc.10', '0.1.0-rc.9')).toBeGreaterThan(0);
  });

  it('lets a minor beat any patch and a major beat any minor', () => {
    expect(compareReleaseVersions('0.2.0', '0.1.9')).toBeGreaterThan(0);
    expect(compareReleaseVersions('1.0.0', '0.99.99')).toBeGreaterThan(0);
  });

  it('is 0 for equal versions', () => {
    expect(compareReleaseVersions('0.3.0', '0.3.0')).toBe(0);
    expect(compareReleaseVersions('0.1.0-rc.9', '0.1.0-rc.9')).toBe(0);
  });

  it('sorts numeric identifiers below alphanumeric ones and shorter lists first', () => {
    expect(compareReleaseVersions('1.0.0-1', '1.0.0-alpha')).toBeLessThan(0);
    expect(compareReleaseVersions('1.0.0-alpha', '1.0.0-alpha.1')).toBeLessThan(0);
    expect(compareReleaseVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
  });

  it('refuses a string that is no release version', () => {
    expect(() => compareReleaseVersions('0.1', '0.1.0')).toThrow(/not a release version/);
  });
});

describe('assertVersionAdvances', () => {
  const current = { 'the libs (root package.json)': '0.1.0-rc.9', '@cngx/mcp': '0.2.0', '@cngx/cli': '0.1.0' };

  it('refuses 0.1.1, which would move @cngx/mcp backwards, naming it and --version 0.3.0', () => {
    expect(() => assertVersionAdvances({ nextVersion: '0.1.1', current })).toThrow(
      /does not advance @cngx\/mcp 0\.2\.0; .*--version 0\.3\.0/,
    );
  });

  it('names every member at or above the release version', () => {
    let message = '';
    try {
      assertVersionAdvances({ nextVersion: '0.1.0', current });
    } catch (error) {
      message = error.message;
    }

    expect(message).toContain('@cngx/mcp 0.2.0');
    expect(message).toContain('@cngx/cli 0.1.0');
    expect(message).not.toContain('root package.json');
  });

  it('refuses the prerelease bump 0.1.0-rc.10 below @cngx/mcp 0.2.0', () => {
    expect(() => assertVersionAdvances({ nextVersion: '0.1.0-rc.10', current })).toThrow(/@cngx\/mcp 0\.2\.0/);
  });

  it('accepts 0.3.0 against rc.9, 0.2.0 and 0.1.0', () => {
    expect(() => assertVersionAdvances({ nextVersion: '0.3.0', current })).not.toThrow();
  });

  it('refuses a release equal to a member version', () => {
    const aligned = { 'the libs (root package.json)': '0.3.0', '@cngx/mcp': '0.3.0', '@cngx/cli': '0.3.0' };

    expect(() => assertVersionAdvances({ nextVersion: '0.3.0', current: aligned })).toThrow(/0\.3\.0 does not advance/);
    expect(() => assertVersionAdvances({ nextVersion: '0.3.1', current: aligned })).not.toThrow();
  });
});

describe('assertDependencyResolvable', () => {
  it('passes when the range matches a published version', () => {
    const asked = [];
    const view = (spec) => {
      asked.push(spec);
      return '0.3.0\n';
    };

    expect(() => assertDependencyResolvable('@cngx/doctor', '^0.3.0', view)).not.toThrow();
    expect(asked).toEqual(['@cngx/doctor@^0.3.0']);
  });

  it('refuses a range npm matches nothing for (E404)', () => {
    const exec = () => {
      throw Object.assign(new Error('Command failed'), {
        status: 1,
        stderr: 'npm error code E404\nnpm error 404 No match found for version ^0.4.0\n',
      });
    };

    expect(() =>
      assertDependencyResolvable('@cngx/doctor', '^0.4.0', (spec) => npmViewVersion(spec, '', exec)),
    ).toThrow('@cngx/doctor@^0.4.0 matches no version on npm; publish it first');
  });

  it('fails closed when the lookup throws', () => {
    const view = () => {
      throw new Error('ENOTFOUND');
    };

    expect(() => assertDependencyResolvable('@cngx/doctor', '^0.3.0', view)).toThrow(
      'could not look up @cngx/doctor@^0.3.0 on npm: ENOTFOUND',
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
});

describe('assertWholeGroup', () => {
  it('passes the whole lockstep group in any order', () => {
    expect(() => assertWholeGroup([...PACKED_LIBS].reverse())).not.toThrow();
  });

  it('refuses a partial set and names the missing members', () => {
    expect(() => assertWholeGroup(['core'])).toThrow(
      `@cngx/* releases in lockstep; --lib core leaves out ${PACKED_LIBS.filter((lib) => lib !== 'core').join(', ')}. Publish every package, or none.`,
    );
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

  it('keeps the ng update package group', () => {
    const group = { packageGroup: ['@cngx/core', '@cngx/forms'] };
    expect(stampManifest({ version: '0.0.0-PLACEHOLDER', 'ng-update': group }, '0.1.0')['ng-update']).toEqual(group);
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

  it('keys the refresh entry to any release of the source collection, which holds no hand-written migration', () => {
    expect(Object.keys(checkReleaseMigrations(SOURCE, '0.1.1', '.ts').schematics)).toEqual([
      refreshMigrationKey('0.1.1'),
    ]);
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
describe('stampSchematicsDist', () => {
  let schematicsDir;

  const PINS = { mcpVersion: '0.4.0', eslintPluginVersion: '0.2.0', angularRange: '^21.2.0' };

  function writeCollection(schematics) {
    mkdirSync(join(schematicsDir, 'migrations', 'refresh'), { recursive: true });
    writeFileSync(join(schematicsDir, 'migrations', 'refresh', 'index.js'), '');
    writeFileSync(join(schematicsDir, 'migrations', 'migrations.json'), JSON.stringify({ schematics }));
  }

  function read(path) {
    return JSON.parse(readFileSync(join(schematicsDir, path), 'utf8'));
  }

  beforeEach(() => {
    schematicsDir = mkdtempSync(join(tmpdir(), 'cngx-stamp-'));
  });

  afterEach(() => {
    rmSync(schematicsDir, { recursive: true, force: true });
  });

  it('writes versions.json and the stamped refresh entry', () => {
    writeCollection({});

    stampSchematicsDist({ schematicsDir, nextVersion: '0.2.0', ...PINS });

    expect(read('versions.json')).toEqual({ cngx: '0.2.0', mcp: '0.4.0', eslintPlugin: '0.2.0', angular: '^21.2.0' });
    expect(read('migrations/migrations.json').schematics[refreshMigrationKey('0.2.0')]).toMatchObject({
      version: '0.2.0',
      factory: REFRESH_FACTORY,
    });
  });

  it('keeps the collection of a release that brings its own migration', () => {
    const own = { 'migration-v0.2.0': { version: '0.2.0', description: 'd', factory: './0.2.0/index#migrate' } };
    writeCollection(own);
    mkdirSync(join(schematicsDir, 'migrations', '0.2.0'));
    writeFileSync(join(schematicsDir, 'migrations', '0.2.0', 'index.js'), '');

    stampSchematicsDist({ schematicsDir, nextVersion: '0.2.0', ...PINS });

    expect(read('migrations/migrations.json').schematics).toEqual(own);
  });

  it('refuses a release entry whose factory module is missing and writes nothing', () => {
    writeCollection({ 'migration-v0.2.0': { version: '0.2.0', description: 'd', factory: './0.2.0/index#migrate' } });

    expect(() => stampSchematicsDist({ schematicsDir, nextVersion: '0.2.0', ...PINS })).toThrow(/names no factory module/);
    expect(() => read('versions.json')).toThrow();
  });
});

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

  it('selects the stable entry and the later candidate entry between two candidates', () => {
    expect(selects('0.1.0-rc.8', '0.1.0-rc.9', '0.1.0')).toBe(true);
    expect(selects('0.1.0-rc.8', '0.1.0-rc.9', '0.1.0-rc.9')).toBe(true);
  });

  it('skips the entry of the release an app already runs', () => {
    expect(selects('0.1.1', '0.1.2', '0.1.1')).toBe(false);
  });
});

describe('stampToolingManifest', () => {
  const pkg = { name: '@cngx/mcp', version: '0.2.0', dependencies: { zod: '^4.4.3' } };
  const lock = {
    name: '@cngx/mcp',
    version: '0.2.0',
    lockfileVersion: 3,
    packages: {
      '': { name: '@cngx/mcp', version: '0.2.0', dependencies: { zod: '^4.4.3' } },
      'node_modules/zod': { version: '4.4.3' },
    },
  };

  it('rewrites the manifest version and the lockfile root, nothing else', () => {
    const stamped = stampToolingManifest(pkg, lock, '0.3.0');

    expect(stamped.pkg).toEqual({ ...pkg, version: '0.3.0' });
    expect(stamped.lock.version).toBe('0.3.0');
    expect(stamped.lock.packages['']).toEqual({ ...lock.packages[''], version: '0.3.0' });
    expect(stamped.lock.packages['node_modules/zod']).toEqual({ version: '4.4.3' });
    expect(stamped.pkg.dependencies).toEqual({ zod: '^4.4.3' });
  });

  it('leaves its inputs as they are', () => {
    stampToolingManifest(pkg, lock, '0.3.0');

    expect(pkg.version).toBe('0.2.0');
    expect(lock.packages[''].version).toBe('0.2.0');
  });
});

describe('toolingBuildSteps', () => {
  const steps = toolingBuildSteps('0.3.0');

  it('regenerates both docs exports before the snapshot', () => {
    expect(steps.slice(0, 3)).toEqual([
      'npm run docs:json',
      'npm run docs:llm',
      'node scripts/mcp-snapshot.mjs --cngx-version=0.3.0 --require-llm-dump',
    ]);
  });

  it('cleans each dist directly before its compile, mcp before cli', () => {
    const compiles = steps.flatMap((step, i) => (/tsc -p packages\/\w+$/.test(step) ? [i] : []));

    expect(compiles.map((i) => steps[i])).toEqual(['npx tsc -p packages/mcp', 'npx tsc -p packages/cli']);
    for (const i of compiles) {
      const name = steps[i].split('/').pop();
      expect(steps[i - 1]).toBe(`rm -rf packages/${name}/dist`);
    }
  });

  it('checks both bundles against the package version, then both dists, after the compiles', () => {
    expect(steps.slice(-4)).toEqual([
      'node scripts/mcp-bundle-check.mjs --expect=package',
      'node scripts/mcp-bundle-check.mjs --data-dir=packages/cli/data --expect=package',
      'node scripts/package-dist-check.mjs --package-dir=packages/mcp',
      'node scripts/package-dist-check.mjs --package-dir=packages/cli',
    ]);
    expect(steps).toHaveLength(11);
  });
});

describe('publishOrder', () => {
  it('publishes @cngx/mcp, then @cngx/cli, then the libs in build order', () => {
    expect(publishOrder(PACKED_LIBS).map(({ name }) => name)).toEqual(['mcp', 'cli', ...PACKED_LIBS]);
    expect(publishOrder(PACKED_LIBS).filter(({ tooling }) => tooling).map(({ name }) => name)).toEqual(
      TOOLING_PACKAGES,
    );
  });
});

describe('runToolingSection', () => {
  let root;
  const files = TOOLING_PACKAGES.flatMap((name) => [`packages/${name}/package.json`, `packages/${name}/package-lock.json`]);

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'cngx-tooling-release-'));
    for (const name of TOOLING_PACKAGES) {
      mkdirSync(join(root, 'packages', name), { recursive: true });
      // Hand-formatted on purpose: a restore must give back the bytes, not a re-serialisation.
      writeFileSync(join(root, 'packages', name, 'package.json'), `{"name": "@cngx/${name}", "version": "0.2.0"}\n`);
      writeFileSync(
        join(root, 'packages', name, 'package-lock.json'),
        `{"name": "@cngx/${name}", "version": "0.2.0", "packages": {"": {"version": "0.2.0"}}}`,
      );
    }
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const snapshot = () => files.map((file) => readFileSync(join(root, file)));
  const versionOnDisk = (file) => JSON.parse(readFileSync(join(root, file), 'utf8')).version;

  it('restores both manifests and lockfiles byte for byte when a step fails', () => {
    const before = snapshot();
    const ran = [];
    const run = (step) => {
      ran.push(step);
      expect(files.map(versionOnDisk)).toEqual(['0.3.0', '0.3.0', '0.3.0', '0.3.0']);
      if (step.includes('mcp-bundle-check')) {
        throw new Error('stale bundle');
      }
    };

    expect(() => runToolingSection({ root, nextVersion: '0.3.0', run, keepStamped: true })).toThrow(
      /tooling build step failed \(node scripts\/mcp-bundle-check\.mjs --expect=package\): stale bundle/,
    );
    expect(snapshot()).toEqual(before);
    expect(ran.at(-1)).toContain('mcp-bundle-check');
  });

  it('restores the originals after a dry run', () => {
    const before = snapshot();

    runToolingSection({ root, nextVersion: '0.3.0', run: () => {}, keepStamped: false });

    expect(snapshot()).toEqual(before);
  });

  it('keeps the stamp after a real run that built, for the publish loop and the release commit', () => {
    runToolingSection({ root, nextVersion: '0.3.0', run: () => {}, keepStamped: true });

    expect(files.map(versionOnDisk)).toEqual(['0.3.0', '0.3.0', '0.3.0', '0.3.0']);
    const lock = JSON.parse(readFileSync(join(root, 'packages', 'cli', 'package-lock.json'), 'utf8'));
    expect(lock.packages[''].version).toBe('0.3.0');
  });
});
