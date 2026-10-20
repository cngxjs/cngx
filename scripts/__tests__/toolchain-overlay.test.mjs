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
  parseBefore,
  OVERLAID_FILES,
  RESTORE_HINT,
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

  it('reads an exact release as that version within its minor', () => {
    expect(parseAngularTarget('21.0.0')).toEqual({ exact: '21.0.0', range: '~21.0.0' });
  });

  it('refuses anything else', () => {
    for (const spec of [undefined, '', '21.2', '^21.0.0', 'latest']) {
      expect(() => parseAngularTarget(spec), String(spec)).toThrow(/pass a major/);
    }
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
  it('takes a dated resolution for deterministic CI runs', () => {
    expect(parseArgs(['--angular', '22', '--before', '2026-10-20'])).toMatchObject({
      before: '2026-10-20',
      target: { exact: undefined, range: '22' },
    });
  });

  it('refuses a --before that is not a calendar date', () => {
    expect(() => parseBefore('yesterday')).toThrow(/takes a date/);
    expect(() => parseArgs(['--angular', '22', '--before'])).toThrow(/takes a date/);
  });

  it('needs no target for --restore', () => {
    expect(parseArgs(['--restore'])).toMatchObject({ restore: true, target: undefined });
  });
});

describe('RESTORE_HINT', () => {
  it('names the restore mode and every file the overlay rewrites', () => {
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

  it('runs a dated Angular 22 row and an exact 21.1.0 floor row on Node 22', () => {
    expect(start).toBeGreaterThan(-1);
    expect(job).toContain('node-version: 22');
    expect(job).toMatch(/overlay: '--angular 22 --before \d{4}-\d{2}-\d{2}'/);
    expect(job).toContain("overlay: '--angular 21.1.0'");
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
