import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  followsAngularMajor,
  overlayManifest,
  overlayTargets,
  patchTsconfigForTs6,
  typescriptMajor,
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

describe('typescriptRangeFromPeer / typescriptMajor', () => {
  it('takes the compiler-cli peer as the range and reads its major', () => {
    expect(typescriptRangeFromPeer(' >=6.0 <6.1 ')).toBe('>=6.0 <6.1');
    expect(typescriptMajor('>=6.0 <6.1')).toBe(6);
    expect(typescriptMajor('~5.9.2')).toBe(5);
  });

  it('refuses a compiler-cli without a typescript peer', () => {
    expect(() => typescriptRangeFromPeer(undefined)).toThrow(/names no typescript peer/);
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
