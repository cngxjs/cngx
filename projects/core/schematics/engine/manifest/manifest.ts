import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type NgAddPreset = 'minimal' | 'recommended' | 'full';

/** The options every `ng add @cngx/<lib>` forwards to the core onboarding. */
export interface NgAddOptions {
  readonly project?: string;
  readonly preset?: NgAddPreset;
}

export interface PackageManifest {
  readonly version?: string;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringEntries(value: unknown): Readonly<Record<string, string>> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

/** Parses a `package.json` body; malformed sections read as empty. */
export function parseManifest(content: string): PackageManifest {
  const parsed: unknown = JSON.parse(content);
  if (!isRecord(parsed)) {
    throw new Error('package.json is not a JSON object.');
  }
  return {
    version: typeof parsed['version'] === 'string' ? parsed['version'] : undefined,
    dependencies: stringEntries(parsed['dependencies']),
    devDependencies: stringEntries(parsed['devDependencies']),
  };
}

/**
 * The release version of the package this bundle ships in. Every entry is
 * bundled to `dist/<lib>/schematics/<entry>/index.js`, so the package
 * manifest sits two folders up.
 */
export function readOwnVersion(bundleDir: string): string {
  const { version } = parseManifest(readFileSync(join(bundleDir, '..', '..', 'package.json'), 'utf8'));
  if (version === undefined) {
    throw new Error(`No version in ${join(bundleDir, '..', '..', 'package.json')}.`);
  }
  return version;
}

/** The version range the app already declares for `name`, if any. */
export function declaredRange(manifest: PackageManifest, name: string): string | undefined {
  return manifest.dependencies[name] ?? manifest.devDependencies[name];
}
