// Which cngx release a project uses, read from a working directory. Installed
// packages win: `createRequire` resolves `@cngx/<lib>/package.json` the way Node
// does from that directory, which covers a flat npm tree, pnpm's symlinks,
// hoisting to a workspace root and an active Yarn PnP runtime. With nothing
// installed, the nearest ancestor `package.json` that declares an `@cngx/*`
// package is read, and only an exact version pins; a range or any other
// specifier answers from the bundled snapshot and says why. Every outcome
// carries the lines the caller prints to stderr; nothing here throws.

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { normalizeReleaseVersion } from './diff/snapshot-fetch.js';

/** The `@cngx/*` packages in the order a version is taken from when `@cngx/core` is absent. */
export const CNGX_PACKAGES = ['core', 'common', 'forms', 'ui', 'data-display', 'interop', 'utils', 'themes'].map(
  (lib) => `@cngx/${lib}`,
);

export interface InstalledVersion {
  /** The release to answer for, or null for the bundled snapshot. */
  readonly version: string | null;
  readonly source: 'installed' | 'declared' | 'none';
  /** One stderr line each, without a prefix. */
  readonly notes: readonly string[];
  /** Installed versions, or declared specifiers, per package name. */
  readonly packages: Readonly<Record<string, string>>;
}

export interface InstalledVersionDeps {
  /** The resolved `package.json` of `name` as seen from `cwd`, or null. */
  resolvePackageJson(cwd: string, name: string): string | null;
  readFile(path: string): string;
  exists(path: string): boolean;
}

const defaultDeps: InstalledVersionDeps = {
  resolvePackageJson(cwd, name) {
    try {
      return createRequire(join(cwd, 'package.json')).resolve(`${name}/package.json`);
    } catch {
      return null;
    }
  },
  readFile: (path) => readFileSync(path, 'utf8'),
  exists: existsSync,
};

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** The anchor package: `@cngx/core` when present, else the first in {@link CNGX_PACKAGES}. */
function anchorOf(packages: Readonly<Record<string, string>>): string | undefined {
  return CNGX_PACKAGES.find((name) => name in packages);
}

export function resolveInstalledCngxVersion(cwd: string, deps: InstalledVersionDeps = defaultDeps): InstalledVersion {
  const notes: string[] = [];
  const installed = readInstalled(cwd, deps, notes);
  if (installed) {
    return installed;
  }

  const walk = findDeclared(cwd, deps, notes);
  if (walk.pnp) {
    notes.push('Yarn PnP detected, run `yarn cngx` for the installed version.');
  }
  if (!walk.declared) {
    notes.push('no @cngx package found; answering from the bundled snapshot.');
    return { version: null, source: 'none', notes, packages: {} };
  }

  const anchor = anchorOf(walk.declared.packages)!;
  const specifier = walk.declared.packages[anchor];
  const exact = exactVersion(specifier);
  if (exact === null) {
    notes.push(`${anchor} is declared as "${specifier}" in ${walk.declared.file}, not an exact version, and not installed; answering from the bundled snapshot.`);
    return { version: null, source: 'declared', notes, packages: walk.declared.packages };
  }
  notes.push(`${anchor} not installed, using declared ${exact}.`);
  return { version: exact, source: 'declared', notes, packages: walk.declared.packages };
}

/** The installed versions; a manifest it cannot read is noted in `notes`, which the declared fallback keeps. */
function readInstalled(cwd: string, deps: InstalledVersionDeps, notes: string[]): InstalledVersion | null {
  const packages: Record<string, string> = {};
  for (const name of CNGX_PACKAGES) {
    const manifest = deps.resolvePackageJson(cwd, name);
    if (manifest === null) {
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(deps.readFile(manifest));
      const version = isRecord(parsed) ? parsed.version : undefined;
      const normalized = typeof version === 'string' ? normalizeReleaseVersion(version) : undefined;
      if (normalized?.ok) {
        packages[name] = normalized.version;
      } else {
        notes.push(`skipped ${manifest}: no release version.`);
      }
    } catch (error) {
      notes.push(`skipped ${manifest}: ${errorMessage(error)}`);
    }
  }

  const anchor = anchorOf(packages);
  if (anchor === undefined) {
    return null;
  }
  const version = packages[anchor];
  if (anchor !== '@cngx/core') {
    notes.push(`@cngx/core is not installed; using ${anchor} ${version}.`);
  }
  const disagreeing = Object.entries(packages).filter(([, v]) => v !== version);
  if (disagreeing.length > 0) {
    notes.push(
      `installed @cngx packages disagree (${disagreeing.map(([name, v]) => `${name} ${v}`).join(', ')}); using ${anchor} ${version}.`,
    );
  }
  return { version, source: 'installed', notes, packages };
}

interface DeclaredWalk {
  readonly declared: { readonly file: string; readonly packages: Record<string, string> } | null;
  readonly pnp: boolean;
}

/** The nearest ancestor `package.json` that declares an `@cngx/*` package; a malformed one is skipped with a note. */
function findDeclared(cwd: string, deps: InstalledVersionDeps, notes: string[]): DeclaredWalk {
  let pnp = false;
  for (let dir = cwd; ; dir = dirname(dir)) {
    pnp ||= deps.exists(join(dir, '.pnp.cjs'));
    const file = join(dir, 'package.json');
    if (deps.exists(file)) {
      const packages = declaredIn(file, deps, notes);
      if (packages !== null) {
        // A workspace package declares @cngx below the root that holds .pnp.cjs.
        return { declared: { file, packages }, pnp: pnp || pnpAbove(dir, deps) };
      }
    }
    if (dirname(dir) === dir) {
      return { declared: null, pnp };
    }
  }
}

function pnpAbove(dir: string, deps: InstalledVersionDeps): boolean {
  for (let at = dirname(dir); ; at = dirname(at)) {
    if (deps.exists(join(at, '.pnp.cjs'))) {
      return true;
    }
    if (dirname(at) === at) {
      return false;
    }
  }
}

function declaredIn(file: string, deps: InstalledVersionDeps, notes: string[]): Record<string, string> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(deps.readFile(file));
  } catch (error) {
    notes.push(`skipped malformed ${file}: ${errorMessage(error)}`);
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  const packages: Record<string, string> = {};
  for (const field of DEPENDENCY_FIELDS) {
    const block = parsed[field];
    if (!isRecord(block)) {
      continue;
    }
    for (const [name, specifier] of Object.entries(block)) {
      if (CNGX_PACKAGES.includes(name) && typeof specifier === 'string' && !(name in packages)) {
        packages[name] = specifier;
      }
    }
  }
  return Object.keys(packages).length > 0 ? packages : null;
}

/** The release an exact specifier names (`0.2.0`, `=0.2.0`, `v0.2.0`, `npm:@cngx/core@0.2.0`), else null. */
function exactVersion(specifier: string): string | null {
  const alias = /^npm:@cngx\/[^@]+@(.+)$/.exec(specifier.trim());
  const bare = (alias ? alias[1] : specifier).trim().replace(/^=/, '');
  const normalized = normalizeReleaseVersion(bare);
  return normalized.ok ? normalized.version : null;
}
