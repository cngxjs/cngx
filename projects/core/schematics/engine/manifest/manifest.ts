import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SchematicsException, type Tree } from '@angular-devkit/schematics';

import { isRecord } from '../plan/text';

export interface PackageManifest {
  readonly name?: string;
  readonly version?: string;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
  readonly peerDependencies: Readonly<Record<string, string>>;
}


function stringEntries(value: unknown): Readonly<Record<string, string>> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new SchematicsException(`package.json is not valid JSON: ${message.replace(/\.$/, '')}.`);
  }
}

/** Parses a `package.json` body; malformed sections read as empty. */
export function parseManifest(content: string): PackageManifest {
  const parsed = parseJson(content);
  if (!isRecord(parsed)) {
    throw new SchematicsException('package.json is not a JSON object.');
  }
  return {
    name: typeof parsed['name'] === 'string' ? parsed['name'] : undefined,
    version: typeof parsed['version'] === 'string' ? parsed['version'] : undefined,
    dependencies: stringEntries(parsed['dependencies']),
    devDependencies: stringEntries(parsed['devDependencies']),
    peerDependencies: stringEntries(parsed['peerDependencies']),
  };
}

/**
 * The release version of the package this bundle ships in. Every entry is
 * bundled to `dist/<lib>/schematics/<entry>/index.js`, so the package
 * manifest sits two folders up.
 */
export function readOwnVersion(bundleDir: string): string {
  const { version } = parseManifest(readFileSync(ownManifestPath(bundleDir), 'utf8'));
  if (version === undefined) {
    throw new Error(`No version in ${ownManifestPath(bundleDir)}.`);
  }
  return version;
}

/** The name of the package this bundle ships in, e.g. `@cngx/forms`. */
export function readOwnName(bundleDir: string): string {
  const { name } = parseManifest(readFileSync(ownManifestPath(bundleDir), 'utf8'));
  if (name === undefined) {
    throw new Error(`No name in ${ownManifestPath(bundleDir)}.`);
  }
  return name;
}

/** The range the package's own manifest peers on for `name`. */
export function readOwnPeerRange(bundleDir: string, name: string): string {
  const range = parseManifest(readFileSync(ownManifestPath(bundleDir), 'utf8')).peerDependencies[name];
  if (range === undefined) {
    throw new Error(`No ${name} peer in ${ownManifestPath(bundleDir)}.`);
  }
  return range;
}

function ownManifestPath(bundleDir: string): string {
  return join(bundleDir, '..', '..', 'package.json');
}

/** The version range the app already declares for `name`, if any. */
export function declaredRange(manifest: PackageManifest, name: string): string | undefined {
  return manifest.dependencies[name] ?? manifest.devDependencies[name];
}

/** A version read as numbers; `prerelease` holds the dot-separated identifiers after `-`. */
export interface ParsedVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly (string | number)[];
}

// The first `major[.minor[.patch]][-prerelease]` of a version or a plain
// range (`^21.2.0`, `~21`, `>=21.2`); a missing minor or patch reads as 0.
const VERSION_PATTERN = /^[\s^~<>=v]*(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?/;

/** The one version reader of the schematics; `undefined` when the text carries no version. */
export function parseVersion(text: string | undefined): ParsedVersion | undefined {
  const match = VERSION_PATTERN.exec(text ?? '');
  if (match === null) {
    return undefined;
  }
  const [, major, minor = '0', patch = '0', prerelease] = match;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: prerelease === undefined ? [] : prerelease.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part)),
  };
}

function compareIdentifiers(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (typeof a === 'number') {
    return -1;
  }
  if (typeof b === 'number') {
    return 1;
  }
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/**
 * Semver order of two versions: negative when `a` is older, 0 when equal,
 * positive when newer; `undefined` when either carries no version. A
 * prerelease sorts below its release, `rc.10` above `rc.9`.
 */
export function compareVersions(a: string, b: string): number | undefined {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (left === undefined || right === undefined) {
    return undefined;
  }
  const core = left.major - right.major || left.minor - right.minor || left.patch - right.patch;
  if (core !== 0) {
    return core;
  }
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    return right.prerelease.length - left.prerelease.length;
  }
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index++) {
    const l = left.prerelease[index];
    const r = right.prerelease[index];
    if (l === undefined || r === undefined) {
      return l === undefined ? -1 : 1;
    }
    const order = compareIdentifiers(l, r);
    if (order !== 0) {
      return order;
    }
  }
  return 0;
}

/**
 * The version of `name` the package manager placed, read from
 * `node_modules/<name>/package.json` without loading anything from it;
 * `undefined` when it is missing or carries no readable version.
 */
export function installedVersion(tree: Tree, name: string): string | undefined {
  const content = tree.read(`node_modules/${name}/package.json`);
  if (content === null) {
    return undefined;
  }
  try {
    return parseManifest(content.toString('utf8')).version;
  } catch {
    return undefined;
  }
}
