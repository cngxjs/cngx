import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { declaredRange, parseManifest, readOwnVersion } from './manifest';

describe('parseManifest', () => {
  it('reads version and both dependency maps', () => {
    const manifest = parseManifest(
      JSON.stringify({ version: '1.0.0', dependencies: { a: '^1.0.0' }, devDependencies: { b: '~2.0.0' } }),
    );

    expect(manifest).toEqual({ version: '1.0.0', dependencies: { a: '^1.0.0' }, devDependencies: { b: '~2.0.0' } });
  });

  it('reads malformed sections as empty and drops non-string ranges', () => {
    const manifest = parseManifest(JSON.stringify({ version: 1, dependencies: ['a'], devDependencies: { b: 2, c: '1' } }));

    expect(manifest).toEqual({ version: undefined, dependencies: {}, devDependencies: { c: '1' } });
  });

  it('rejects a body that is not a JSON object', () => {
    expect(() => parseManifest('[]')).toThrow('package.json is not a JSON object.');
  });
});

describe('declaredRange', () => {
  const manifest = parseManifest(JSON.stringify({ dependencies: { a: '1.0.0' }, devDependencies: { b: '2.0.0' } }));

  it('finds a range in dependencies or devDependencies', () => {
    expect(declaredRange(manifest, 'a')).toBe('1.0.0');
    expect(declaredRange(manifest, 'b')).toBe('2.0.0');
  });

  it('is undefined for an undeclared package', () => {
    expect(declaredRange(manifest, 'c')).toBeUndefined();
  });
});

describe('readOwnVersion', () => {
  let pkg: string;

  beforeEach(() => {
    pkg = mkdtempSync(join(tmpdir(), 'cngx-own-version-'));
    mkdirSync(join(pkg, 'schematics', 'ng-add'), { recursive: true });
  });

  afterEach(() => {
    rmSync(pkg, { recursive: true, force: true });
  });

  it('reads the manifest two folders above the bundle', () => {
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ version: '0.1.0' }));

    expect(readOwnVersion(join(pkg, 'schematics', 'ng-add'))).toBe('0.1.0');
  });

  it('fails loudly when the manifest has no version', () => {
    writeFileSync(join(pkg, 'package.json'), '{}');

    expect(() => readOwnVersion(join(pkg, 'schematics', 'ng-add'))).toThrow(/No version in/);
  });
});
