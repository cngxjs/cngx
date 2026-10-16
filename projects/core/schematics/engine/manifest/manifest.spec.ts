import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import {
  compareVersions,
  declaredRange,
  installedVersion,
  parseManifest,
  parseVersion,
  readOwnName,
  readOwnPeerRange,
  readOwnVersion,
} from './manifest';

describe('parseManifest', () => {
  it('reads version and both dependency maps', () => {
    const manifest = parseManifest(
      JSON.stringify({ name: 'app', version: '1.0.0', dependencies: { a: '^1.0.0' }, devDependencies: { b: '~2.0.0' } }),
    );

    expect(manifest).toEqual({
      name: 'app',
      version: '1.0.0',
      dependencies: { a: '^1.0.0' },
      devDependencies: { b: '~2.0.0' },
      peerDependencies: {},
    });
  });

  it('reads malformed sections as empty and drops non-string ranges', () => {
    const manifest = parseManifest(JSON.stringify({ version: 1, dependencies: ['a'], devDependencies: { b: 2, c: '1' } }));

    expect(manifest).toEqual({ version: undefined, dependencies: {}, devDependencies: { c: '1' }, peerDependencies: {} });
  });

  it('names a body that does not parse', () => {
    expect(() => parseManifest('{ "name": ')).toThrow(/^package\.json is not valid JSON: .+\.$/);
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

describe('readOwnName', () => {
  let pkg: string;

  beforeEach(() => {
    pkg = mkdtempSync(join(tmpdir(), 'cngx-own-name-'));
    mkdirSync(join(pkg, 'schematics', 'ng-add'), { recursive: true });
  });

  afterEach(() => {
    rmSync(pkg, { recursive: true, force: true });
  });

  it('reads the name of the package two folders above the bundle', () => {
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: '@cngx/forms', version: '0.1.0' }));

    expect(readOwnName(join(pkg, 'schematics', 'ng-add'))).toBe('@cngx/forms');
  });

  it('fails loudly when the manifest has no name', () => {
    writeFileSync(join(pkg, 'package.json'), '{}');

    expect(() => readOwnName(join(pkg, 'schematics', 'ng-add'))).toThrow(/No name in/);
  });
});

describe('readOwnPeerRange', () => {
  let pkg: string;

  beforeEach(() => {
    pkg = mkdtempSync(join(tmpdir(), 'cngx-own-peer-'));
    mkdirSync(join(pkg, 'schematics', 'ng-add'), { recursive: true });
  });

  afterEach(() => {
    rmSync(pkg, { recursive: true, force: true });
  });

  it('reads the peer range of the package two folders above the bundle', () => {
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ peerDependencies: { '@angular/core': '^21.2.0' } }));

    expect(readOwnPeerRange(join(pkg, 'schematics', 'ng-add'), '@angular/core')).toBe('^21.2.0');
  });

  it('fails loudly when the peer is not declared', () => {
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({}));

    expect(() => readOwnPeerRange(join(pkg, 'schematics', 'ng-add'), '@angular/core')).toThrow(
      'No @angular/core peer in',
    );
  });
});

describe('parseVersion', () => {
  it('reads a version and the first version of a plain range', () => {
    expect(parseVersion('21.2.5')).toEqual({ major: 21, minor: 2, patch: 5, prerelease: [] });
    expect(parseVersion('^21.2.0')).toMatchObject({ major: 21, minor: 2, patch: 0 });
    expect(parseVersion('~21')).toMatchObject({ major: 21, minor: 0, patch: 0 });
    expect(parseVersion('0.1.0-rc.8')).toEqual({ major: 0, minor: 1, patch: 0, prerelease: ['rc', 8] });
  });

  it.each(['catalog:', 'workspace:*', 'latest', '', undefined])('reads no version from %s', (text) => {
    expect(parseVersion(text)).toBeUndefined();
  });
});

describe('compareVersions', () => {
  it.each([
    ['0.1.0', '0.2.0'],
    ['0.2.0', '0.10.0'],
    ['0.2.0-rc.1', '0.2.0'],
    ['0.2.0-rc.9', '0.2.0-rc.10'],
    ['0.2.0-rc', '0.2.0-rc.1'],
    ['0.2.0-0', '0.2.0-rc.1'],
    ['0.1.0', '1.0.0-rc.0'],
  ])('orders %s below %s', (older, newer) => {
    expect(compareVersions(older, newer)).toBeLessThan(0);
    expect(compareVersions(newer, older)).toBeGreaterThan(0);
  });

  it('reads equal versions as 0 and an unreadable one as undefined', () => {
    expect(compareVersions('0.2.0', '0.2.0')).toBe(0);
    expect(compareVersions('0.2.0-rc.1', '0.2.0-rc.1')).toBe(0);
    expect(compareVersions('latest', '0.2.0')).toBeUndefined();
  });
});

describe('installedVersion', () => {
  it('reads the version the package manager placed', () => {
    const tree = createMemoryTree({ 'node_modules/@cngx/core/package.json': '{ "name": "@cngx/core", "version": "0.1.0-rc.8" }' });

    expect(installedVersion(tree, '@cngx/core')).toBe('0.1.0-rc.8');
  });

  it('reads nothing for a missing or broken manifest', () => {
    expect(installedVersion(createMemoryTree({}), '@cngx/core')).toBeUndefined();
    expect(installedVersion(createMemoryTree({ 'node_modules/@cngx/core/package.json': '{ not json' }), '@cngx/core')).toBeUndefined();
  });
});
