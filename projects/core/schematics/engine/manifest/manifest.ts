import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SchematicsException } from '@angular-devkit/schematics';

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
