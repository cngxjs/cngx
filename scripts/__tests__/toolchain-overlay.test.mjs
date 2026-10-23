import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PUBLISHED_LIBS } from '../cngx-libs.mjs';

import {
  followsAngularMajor,
  isFrameworkPackage,
  overlayManifest,
  overlayTargets,
  parseAngularTarget,
  patchTsconfigForTs6,
  typescriptMajorOf,
  parseArgs,
  compareVersions,
  hashOf,
  pickVersion,
  restorePlan,
  OVERLAID_FILES,
  RESTORE_HINT,
  STATE_FILE,
  typescriptRangeFromPeer,
} from '../toolchain-overlay.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

describe('followsAngularMajor', () => {
  it('moves the Angular family and the tools versioned with it', () => {
    for (const name of [
      '@angular/core',
      '@angular/cdk',
      '@angular-devkit/schematics',
      '@angular-eslint/builder',
      '@schematics/angular',
      'ng-packagr',
      '@ngrx/signals',
      'playwright-ng-schematics',
    ]) {
      expect(followsAngularMajor(name), name).toBe(true);
    }
  });

  it('leaves everything else alone', () => {
    for (const name of ['rxjs', 'zone.js', 'typescript', 'vitest', '@tanstack/angular-query-experimental', '@angular-x/foo']) {
      expect(followsAngularMajor(name), name).toBe(false);
    }
  });
});

describe('overlayTargets', () => {
  it('lists the toolchain packages of the repo manifest, from both dependency fields', () => {
    const targets = overlayTargets(manifest);
    expect(targets).toContain('@angular/core');
    expect(targets).toContain('@angular/compiler-cli');
    expect(targets).toContain('ng-packagr');
    expect(targets).not.toContain('typescript');
    expect(targets).toEqual([...targets].sort());
  });
});

describe('overlayManifest', () => {
  const versions = Object.fromEntries(overlayTargets(manifest).map((name) => [name, '22.2.3']));
  const next = overlayManifest(manifest, versions, '>=6.0 <6.1');

  it('moves every target to the resolved version, keeping exact pins exact', () => {
    expect(next.dependencies['@angular/core']).toBe('^22.2.3');
    expect(next.devDependencies['ng-packagr']).toBe('^22.2.3');
    expect(next.devDependencies['@angular-devkit/schematics']).toBe('22.2.3');
  });

  it('sets typescript to the compiler-cli peer range and keeps unrelated packages', () => {
    expect(next.devDependencies['typescript']).toBe('>=6.0 <6.1');
    expect(next.dependencies['rxjs']).toBe(manifest.dependencies['rxjs']);
    expect(next.devDependencies['vitest']).toBe(manifest.devDependencies['vitest']);
  });

  it('does not mutate the input manifest', () => {
    expect(manifest.dependencies['@angular/core']).not.toBe('^22.2.3');
  });
});

describe('parseAngularTarget', () => {
  it('reads a major as a range', () => {
    expect(parseAngularTarget('22')).toEqual({ exact: undefined, range: '22' });
  });

  it('reads an exact release and lists its packages within its major', () => {
    expect(parseAngularTarget('22.2.3')).toEqual({ exact: '22.2.3', range: '22' });
  });

  it('refuses anything else', () => {
    for (const spec of [undefined, '', '21.2', '^21.0.0', 'latest']) {
      expect(() => parseAngularTarget(spec), String(spec)).toThrow(/pass an exact release/);
    }
  });
});

describe('pickVersion', () => {
  const versions = ['22.6.0', '22.0.1', '22.7.0', '22.7.1-alpha.0', '22.10.0'];
  const times = {
    '22.0.1': '2026-06-01T00:00:00.000Z',
    '22.6.0': '2026-09-30T00:00:00.000Z',
    '22.7.0': '2026-10-15T00:00:00.000Z',
    '22.10.0': '2026-11-01T00:00:00.000Z',
  };

  it('takes the exact release when the package published it', () => {
    expect(pickVersion({ name: 'x', versions: ['22.2.3', '22.2.4'], exact: '22.2.3' })).toBe('22.2.3');
  });

  it('takes the newest stable release published by the anchor, so a later release changes nothing', () => {
    expect(pickVersion({ name: 'x', versions, times, exact: '22.2.3', anchor: '2026-10-14T23:41:35.703Z' })).toBe('22.6.0');
    expect(
      pickVersion({ name: 'x', versions: [...versions, '22.6.1'], times: { ...times, '22.6.1': '2027-01-01T00:00:00.000Z' }, anchor: '2026-10-14T23:41:35.703Z' }),
    ).toBe('22.6.0');
  });

  it('takes the numerically newest stable release without an anchor', () => {
    expect(pickVersion({ name: 'x', versions })).toBe('22.10.0');
  });

  it('refuses when nothing was published by the anchor', () => {
    expect(() => pickVersion({ name: 'tool', versions, times, anchor: '2026-01-01T00:00:00.000Z' })).toThrow(
      /tool has no stable release published by 2026-01-01/,
    );
  });
});

describe('compareVersions', () => {
  it('orders by number, not by text', () => {
    expect(['22.10.0', '22.9.1', '22.2.3'].sort(compareVersions)).toEqual(['22.2.3', '22.9.1', '22.10.0']);
  });
});
describe('overlayTargets for an exact release', () => {
  it('moves only the framework and keeps the build tooling', () => {
    const targets = overlayTargets(manifest, true);
    expect(targets).toContain('@angular/core');
    expect(targets).toContain('@angular/compiler-cli');
    expect(targets).toContain('@ngrx/signals');
    for (const tool of ['@angular/build', '@angular/cli', '@angular-devkit/schematics', 'ng-packagr', '@schematics/angular']) {
      expect(targets, tool).not.toContain(tool);
      expect(isFrameworkPackage(tool), tool).toBe(false);
    }
  });
});

describe('overlayManifest pinning every target', () => {
  it('writes bare versions for an exact release', () => {
    const versions = Object.fromEntries(overlayTargets(manifest).map((name) => [name, '21.0.0']));
    const next = overlayManifest(manifest, versions, '>=5.9 <6.0', true);
    expect(next.dependencies['@angular/core']).toBe('21.0.0');
    expect(next.devDependencies['ng-packagr']).toBe('21.0.0');
  });
});

describe('typescriptRangeFromPeer / typescriptMajorOf', () => {
  it('takes the compiler-cli peer as the range and reads its major', () => {
    expect(typescriptRangeFromPeer(' >=6.0 <6.1 ')).toBe('>=6.0 <6.1');
    expect(typescriptMajorOf('6.0.3')).toBe(6);
    expect(typescriptMajorOf('5.9.3')).toBe(5);
    expect(typescriptMajorOf(undefined)).toBeUndefined();
  });

  it('refuses a compiler-cli without a typescript peer', () => {
    expect(() => typescriptRangeFromPeer(undefined)).toThrow(/names no typescript peer/);
  });
});

describe('parseArgs', () => {
  it('reads an exact framework-only floor run', () => {
    expect(parseArgs(['--angular', '21.1.0', '--framework-only'])).toMatchObject({
      frameworkOnly: true,
      target: { exact: '21.1.0', range: '21' },
    });
  });

  it('needs no target for --restore and takes --discard-local-edits only with it', () => {
    expect(parseArgs(['--restore', '--discard-local-edits'])).toMatchObject({ restore: true, discardLocalEdits: true, target: undefined });
    expect(() => parseArgs(['--angular', '22', '--discard-local-edits'])).toThrow(/only goes with --restore/);
  });

  it('no longer takes --before, which npm view does not honour', () => {
    expect(() => parseArgs(['--angular', '22', '--before', '2026-10-20'])).toThrow(/unknown argument --before/);
  });
});

describe('restorePlan', () => {
  const state = { files: { 'package.json': hashOf('overlaid manifest'), 'package-lock.json': hashOf('overlaid lock') } };

  it('restores a file still as the overlay left it', () => {
    expect(restorePlan(state, { 'package.json': hashOf('overlaid manifest'), 'package-lock.json': hashOf('overlaid lock') })).toEqual({
      restore: ['package.json', 'package-lock.json'],
      edited: [],
    });
  });

  it('names a file edited after the overlay instead of restoring it', () => {
    expect(restorePlan(state, { 'package.json': hashOf('my own edit'), 'package-lock.json': hashOf('overlaid lock') })).toEqual({
      restore: ['package-lock.json'],
      edited: ['package.json'],
    });
  });

  it('touches nothing the overlay did not write', () => {
    expect(restorePlan(state, { 'tsconfig.base.json': hashOf('anything') }).restore).not.toContain('tsconfig.base.json');
    expect(restorePlan(undefined, {})).toEqual({ restore: [], edited: [] });
  });
});

describe('the overlay state file', () => {
  it('lives where git never sees it and npm ci clears it', () => {
    expect(STATE_FILE.startsWith('node_modules')).toBe(true);
  });
});
describe('RESTORE_HINT', () => {
  it('names the restore mode and every file the overlay may rewrite', () => {
    expect(RESTORE_HINT).toContain('--restore');
    for (const file of OVERLAID_FILES) {
      expect(RESTORE_HINT).toContain(file);
    }
    expect(RESTORE_HINT).toContain('npm ci');
  });
});
describe('patchTsconfigForTs6', () => {
  it('adds ignoreDeprecations to the repo tsconfig once', () => {
    const text = readFileSync(join(ROOT, 'tsconfig.base.json'), 'utf8');
    const patched = patchTsconfigForTs6(text);
    expect(JSON.parse(patched).compilerOptions.ignoreDeprecations).toBe('6.0');
    expect(patchTsconfigForTs6(patched)).toBe(patched);
  });

  it('refuses a tsconfig without compilerOptions', () => {
    expect(() => patchTsconfigForTs6('{}')).toThrow(/no compilerOptions/);
  });
});

describe('the angular-libs CI job', () => {
  const ci = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
  const start = ci.indexOf('  angular-libs:');
  const rest = ci.slice(start + 1);
  const next = rest.search(/\n {2}[a-z-]+:\n/);
  const job = next === -1 ? rest : rest.slice(0, next);

  it('runs an exact Angular 22 row and an exact framework-only 21.1.0 floor row on the .nvmrc Node', () => {
    expect(start).toBeGreaterThan(-1);
    expect(job).toContain('node-version-file: .nvmrc');
    expect(job).toMatch(/overlay: '--angular 22\.\d+\.\d+'/);
    expect(job).toContain("overlay: '--angular 21.1.0 --framework-only'");
    expect(job).not.toContain('--before');
    expect(job).toContain('name: angular-${{ matrix.label }}-libs');
  });

  it('overlays before it builds, without a separate npm ci, and keeps the resolved tree', () => {
    expect(job).not.toContain('npm ci');
    expect(job.indexOf('toolchain-overlay.mjs')).toBeLessThan(job.indexOf('npm run build:libs'));
    expect(job).toContain('npm ls --all > npm-ls.txt');
    expect(job).toContain('package-lock.json');
  });

  it('unit tests every published lib and the schematics', () => {
    for (const lib of PUBLISHED_LIBS) {
      expect(job, lib).toContain(`ng test ${lib} --watch=false`);
    }
    expect(job).toContain('npm run test:schematics');
  });
});
