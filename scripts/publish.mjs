#!/usr/bin/env node
// Usage:
//   node scripts/publish.mjs --bump patch              # all libs, bump patch
//   node scripts/publish.mjs --bump minor              # all libs, bump minor
//   node scripts/publish.mjs --version 1.2.3           # all libs, explicit version
//   node scripts/publish.mjs --lib core --bump patch   # refused: every lib releases together
//   node scripts/publish.mjs --dry-run --bump patch    # preview without publishing
//   node scripts/publish.mjs --tag next --bump major   # force a dist-tag (default: derived, see resolveDistTag)
//   node scripts/publish.mjs --skip-git-tag --bump patch  # do not tag/push git
//   node scripts/publish.mjs --registry <url> ...      # override npm registry
//
// Every run releases the libs, @cngx/mcp and @cngx/cli at one version
// (LOCKSTEP_PACKAGES in cngx-libs.mjs): mcp and cli first, then the libs.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PACKED_LIBS, TOOLING_PACKAGES } from './cngx-libs.mjs';
import { bumpMcpPin } from './plugin-release.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

// CSS-only libs that don't have an angular.json build target - built via
// a dedicated node script that copies sources to dist/<lib>/.
const CSS_ONLY_LIBS = new Set(['themes']);
const PLACEHOLDER = '0.0.0-PLACEHOLDER';
const SOURCE_MIGRATIONS = join(ROOT, 'projects', 'core', 'schematics', 'migrations', 'migrations.json');

function readRootPkg() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
}

function writeRootPkg(pkg) {
  writeFileSync(join(ROOT, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
}

function bumpVersion(version, type) {
  // Split base from a prerelease suffix: "0.1.0-rc.2" -> base "0.1.0", pre "rc.2".
  const [base, pre] = version.split('-');
  const [major, minor, patch] = base.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    case 'prerelease': {
      if (!pre) {
        throw new Error(
          `Current version "${version}" has no prerelease suffix. ` +
          `Start a new prerelease line explicitly, e.g. ` +
          `--version ${major}.${minor + 1}.0-rc.0; ` +
          `--bump prerelease then increments it.`,
        );
      }
      const match = pre.match(/^(.*?)(\d+)$/);
      if (!match) {
        throw new Error(`Cannot increment prerelease suffix "${pre}". Pass --version explicitly.`);
      }
      return `${base}-${match[1]}${Number(match[2]) + 1}`;
    }
    default: throw new Error(`Unknown bump type: ${type}. Use patch, minor, major, or prerelease.`);
  }
}

/**
 * Picks the npm dist-tag for a release when `--tag` is not given.
 *
 * - A stable version always goes to `latest`.
 * - A prerelease goes to `latest` while the lib has no stable release on the
 *   registry yet: before 1.0 the newest rc is the best version a plain
 *   `npm i @cngx/<lib>` can get, and leaving `latest` on an old rc hands
 *   every new consumer stale code.
 * - Once a stable release exists, a prerelease goes to `next`, so an rc never
 *   displaces the stable line.
 *
 * The rule is derived from the registry, so the switch at 1.0 needs no edit.
 * An explicit `--tag` always wins.
 */
export function resolveDistTag({ nextVersion, explicitTag, hasStableRelease }) {
  if (explicitTag) return explicitTag;
  if (!nextVersion.includes('-')) return 'latest';
  return hasStableRelease ? 'next' : 'latest';
}

/** Whether `versions` (as listed by `npm view <pkg> versions`) holds a stable release. */
export function containsStableRelease(versions) {
  return versions.some((v) => !v.includes('-'));
}

function publishedVersions(lib, registryFlag) {
  try {
    const raw = execSync(`npm view @cngx/${lib} versions --json${registryFlag}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Not published yet (E404) or registry unreachable: treat as no stable release.
    return [];
  }
}

// Files that may carry the version placeholder: JS everywhere, plus the
// JSON under dist/<lib>/schematics the schematics read at runtime.
function walkVersioned(dir, schematicsDir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkVersioned(full, schematicsDir));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) files.push(full);
    else if (entry.name.endsWith('.json') && full.startsWith(schematicsDir + sep)) files.push(full);
  }
  return files;
}

// Workspace convention: every publishable lib declares its cross-@cngx
// runtime imports as PLACEHOLDER peers. Rewriting them in place makes the
// published package lock to the wave it ships with, which keeps the
// cross-package version graph consistent. Mutates and returns `distPkg`.
export function stampManifest(distPkg, nextVersion) {
  distPkg.version = nextVersion;
  for (const dep of Object.keys(distPkg.peerDependencies ?? {})) {
    if (distPkg.peerDependencies[dep] === PLACEHOLDER) {
      distPkg.peerDependencies[dep] = nextVersion;
    }
  }
  return distPkg;
}

// The release version written into a tooling package's source manifest and
// its lockfile root; dependencies stay as they are. Returns new objects, the
// inputs left as they are.
export function stampToolingManifest(pkg, lock, nextVersion) {
  const root = lock.packages?.[''];
  return {
    pkg: { ...pkg, version: nextVersion },
    lock: {
      ...lock,
      version: nextVersion,
      ...(root ? { packages: { ...lock.packages, '': { ...root, version: nextVersion } } } : {}),
    },
  };
}

// The tooling build of a release: `build:mcp` and `build:cli` with the
// release stamp instead of the root version, the llm dump required, and the
// bundle checks in package mode (the root is bumped only after publishing),
// then the dist freshness gate of both packages. Run from the repo root.
export function toolingBuildSteps(nextVersion) {
  return [
    'npm run docs:json',
    'npm run docs:llm',
    `node scripts/mcp-snapshot.mjs --cngx-version=${nextVersion} --require-llm-dump`,
    ...TOOLING_PACKAGES.flatMap((name) => [`rm -rf packages/${name}/dist`, `npx tsc -p packages/${name}`]),
    'node scripts/mcp-bundle-check.mjs --expect=package',
    'node scripts/mcp-bundle-check.mjs --data-dir=packages/cli/data --expect=package',
    ...TOOLING_PACKAGES.map((name) => `node scripts/package-dist-check.mjs --package-dir=packages/${name}`),
  ];
}

const toolingFiles = (root) =>
  TOOLING_PACKAGES.flatMap((name) => [
    join(root, 'packages', name, 'package.json'),
    join(root, 'packages', name, 'package-lock.json'),
  ]);

// Stamps both tooling manifests and lockfiles with the release version, then
// runs the tooling build. The originals stay in memory and are written back
// byte for byte when a step fails, and after success unless `keepStamped`
// (a real run, whose publish loop and release commit need the stamp). A
// failure is thrown, never a process exit, so the restore always runs. The
// returned `restore` writes the same originals back, for a publish loop that
// fails before anything reached the registry.
export function runToolingSection({ root, nextVersion, run: runStep, keepStamped, read = readFileSync, write = writeFileSync }) {
  const originals = toolingFiles(root).map((file) => [file, read(file)]);
  const restore = () => {
    for (const [file, bytes] of originals) {
      write(file, bytes);
    }
  };
  let built = false;
  try {
    for (const name of TOOLING_PACKAGES) {
      const pkgPath = join(root, 'packages', name, 'package.json');
      const lockPath = join(root, 'packages', name, 'package-lock.json');
      const stamped = stampToolingManifest(
        JSON.parse(read(pkgPath, 'utf8')),
        JSON.parse(read(lockPath, 'utf8')),
        nextVersion,
      );
      write(pkgPath, JSON.stringify(stamped.pkg, null, 2) + '\n');
      write(lockPath, JSON.stringify(stamped.lock, null, 2) + '\n');
    }
    for (const step of toolingBuildSteps(nextVersion)) {
      try {
        runStep(step);
      } catch (error) {
        throw new Error(`tooling build step failed (${step}): ${error.message}`);
      }
    }
    built = true;
  } finally {
    if (!built || !keepStamped) {
      restore();
    }
  }
  return { restore };
}

// What a failed `npm publish` leaves behind. Before any package reached the
// registry the tooling stamp is undone, so the same --version can run again.
// Once one is on npm the version is taken: the stamp stays and the message
// names what is on npm, what is not, and how to finish by hand.
export function publishFailurePlan({ published, remaining, nextVersion, error }) {
  const failed = remaining[0];
  const cause = `npm publish of @cngx/${failed} failed: ${error.message}`;
  if (published.length === 0) {
    return {
      restore: true,
      message: `${cause}. Nothing is on npm; the tooling manifests and lockfiles are restored. Retry with --version ${nextVersion}.`,
    };
  }
  const tooling = remaining.filter((name) => TOOLING_PACKAGES.includes(name));
  const libs = remaining.filter((name) => !TOOLING_PACKAGES.includes(name));
  const from = [
    ...tooling.map((name) => `@cngx/${name} from packages/${name} (stamped)`),
    ...(libs.length > 0
      ? [`the libs from dist/<lib>, once each manifest and bundle carries ${nextVersion} (a run stamps a lib's dist only right before its own publish)`]
      : []),
  ];
  return {
    restore: false,
    message: [
      `${cause}.`,
      `On npm at ${nextVersion}: ${published.map((name) => `@cngx/${name}`).join(', ')}.`,
      `Not published: ${remaining.map((name) => `@cngx/${name}`).join(', ')}.`,
      `The stamp stays; --version must stay ${nextVersion} (it is taken on npm).`,
      `Publish the remaining packages by hand: ${from.join('; ')}.`,
      `Then bring the release files to ${nextVersion} (root version, changelogs, plugin @cngx/mcp pin) and commit them: ${releaseCommitFiles().join(', ')}.`,
    ].join('\n'),
  };
}

// What a release publishes, in order: the tooling packages first, because
// @cngx/core ships versions.json pinning @cngx/mcp at the release version,
// then the libs in build order.
export function publishOrder(libs) {
  return [...TOOLING_PACKAGES.map((name) => ({ name, tooling: true })), ...libs.map((name) => ({ name, tooling: false }))];
}

export const LOCKSTEP_NO_CHANGES = 'Released in lockstep with the cngx libraries; no changes in this package.';

// Stamps a tooling CHANGELOG for the release: `## Unreleased` becomes
// `## <version> - <date>`; an empty Unreleased section gets the lockstep
// line, and a file without one gets a new section with it above the newest
// release (below the header paragraph). Every other section stays as it is.
export function stampToolingChangelog(text, version, date) {
  const heading = `## ${version} - ${date}`;
  const lines = text.split('\n');
  const unreleased = lines.findIndex((line) => line.trim() === '## Unreleased');
  if (unreleased !== -1) {
    const next = lines.findIndex((line, i) => i > unreleased && line.startsWith('## '));
    const body = lines.slice(unreleased + 1, next === -1 ? lines.length : next);
    if (body.some((line) => line.trim() !== '')) {
      lines[unreleased] = heading;
      return lines.join('\n');
    }
    const rest = next === -1 ? [] : lines.slice(next);
    return [...lines.slice(0, unreleased), heading, '', LOCKSTEP_NO_CHANGES, '', ...rest].join('\n');
  }
  const firstRelease = lines.findIndex((line) => line.startsWith('## '));
  if (firstRelease === -1) {
    const trimmed = text.replace(/\n*$/, '');
    return `${trimmed}\n\n${heading}\n\n${LOCKSTEP_NO_CHANGES}\n`;
  }
  return [...lines.slice(0, firstRelease), heading, '', LOCKSTEP_NO_CHANGES, '', ...lines.slice(firstRelease)].join('\n');
}

// Every file a real release run leaves changed, relative to the repo root:
// the root version and changelog, both tooling manifests, lockfiles and
// changelogs, and the plugin's @cngx/mcp pin.
export function releaseCommitFiles() {
  return [
    'package.json',
    'CHANGELOG.md',
    ...TOOLING_PACKAGES.flatMap((name) => [
      `packages/${name}/package.json`,
      `packages/${name}/package-lock.json`,
      `packages/${name}/CHANGELOG.md`,
    ]),
    'packages/plugin/.mcp.json',
  ];
}

// What a --skip-git-tag run leaves to the releaser. The root changelog is
// regenerated only on the tagging path, so this path names it as stale.
export function skipGitTagNote() {
  return (
    'Note: CHANGELOG.md is not regenerated with --skip-git-tag; refresh it with `npm run changelog` before committing.\n' +
    `Commit the release files yourself: ${releaseCommitFiles().join(', ')}.`
  );
}

// The pins a release writes into versions.json: @cngx/mcp is published in the
// same run, so its pin is the release version.
export function releasePins({ nextVersion, eslintPluginVersion }) {
  return { nextVersion, mcpVersion: nextVersion, eslintPluginVersion };
}

// A tarball that still names the placeholder cannot be installed: the version
// or a cross-@cngx peer would resolve to nothing. Checked on the rewritten
// manifest, before anything is written or published.
export function findPlaceholders(distPkg) {
  return Object.entries(distPkg)
    .filter(([, value]) => JSON.stringify(value).includes(PLACEHOLDER))
    .map(([key]) => key);
}

export function replaceVersionInDist(distDir, nextVersion) {
  for (const file of walkVersioned(distDir, join(distDir, 'schematics'))) {
    const content = readFileSync(file, 'utf8');
    if (content.includes(PLACEHOLDER)) {
      writeFileSync(file, content.replaceAll(PLACEHOLDER, nextVersion));
    }
  }
}

// What `ng add` pins: the cngx release it ships with, the @cngx/mcp server
// and @cngx/eslint-plugin compatible with it, and the Angular range
// @cngx/core peers on.
export function createSchematicsVersions({ nextVersion, mcpVersion, eslintPluginVersion, angularRange }) {
  return { cngx: nextVersion, mcp: mcpVersion, eslintPlugin: eslintPluginVersion, angular: angularRange };
}

// The factory every release without a migration of its own runs on
// `ng update`, relative to dist/core/schematics/migrations/.
export const REFRESH_FACTORY = './refresh/index#migrate';

export function refreshMigrationKey(version) {
  return `migration-v${version}-refresh`;
}

// The Angular CLI runs the entries whose version lies in (from, to], so a
// core release reaches every updating app only through an entry keyed to it.
// A release that brings its own migration keeps its collection as it is (the
// same object comes back); any other gets the refresh entry in a new
// collection, the input left as it is. A collection without a `schematics`
// map is not one the CLI can load.
export function stampRefreshMigration(collection, nextVersion) {
  const schematics = collection?.schematics;
  if (typeof schematics !== 'object' || schematics === null || Array.isArray(schematics)) {
    throw new Error('the ng update collection has no schematics map');
  }
  if (Object.values(schematics).some((entry) => entry.version === nextVersion)) {
    return collection;
  }
  return {
    ...collection,
    schematics: {
      ...schematics,
      [refreshMigrationKey(nextVersion)]: {
        version: nextVersion,
        description: `Re-runs the recorded install steps and records cngx ${nextVersion} in .cngx/install.json.`,
        factory: REFRESH_FACTORY,
      },
    },
  };
}

/** The keys of the entries keyed to the release. */
export function releaseMigrationKeys(collection, nextVersion) {
  return Object.entries(collection.schematics)
    .filter(([, entry]) => entry.version === nextVersion)
    .map(([key]) => key);
}

// Every entry keyed to the release must name a factory module that exists:
// `moduleExists` gets the factory path without `#export`, relative to the
// collection. An entry pointing at nothing would fail every `ng update`.
// That an entry exists at all is the stamp's guarantee, not checked here.
export function assertReleaseMigration(collection, nextVersion, moduleExists) {
  const unresolved = releaseMigrationKeys(collection, nextVersion).filter((key) => {
    const { factory } = collection.schematics[key];
    return typeof factory !== 'string' || !moduleExists(factory.split('#')[0]);
  });
  if (unresolved.length > 0) {
    throw new Error(`the ng update migration ${unresolved.join(', ')} for ${nextVersion} names no factory module`);
  }
}

// Reads a migrations collection, stamps the release and checks it; a module
// exists when `<path><extension>` is a file next to the collection.
export function checkReleaseMigrations(collectionPath, nextVersion, extension, read = readFileSync, exists = existsSync) {
  const stamped = stampRefreshMigration(JSON.parse(read(collectionPath, 'utf8')), nextVersion);
  assertReleaseMigration(stamped, nextVersion, (module) => exists(join(dirname(collectionPath), `${module}${extension}`)));
  return stamped;
}

// The two files a release adds to dist/core/schematics: versions.json (what
// `ng add` pins) and the migrations collection with the release stamped in.
// Planning checks every release entry, so nothing is written for a release
// whose factory is missing; publish plans every lib before the first
// `npm publish` and writes after, pack-libs does both at once.
export function planSchematicsStamp({ schematicsDir, nextVersion, mcpVersion, eslintPluginVersion, angularRange }) {
  const migrationsPath = join(schematicsDir, 'migrations', 'migrations.json');
  const migrations = checkReleaseMigrations(migrationsPath, nextVersion, '.js');
  return {
    schematicsDir,
    versions: createSchematicsVersions({ nextVersion, mcpVersion, eslintPluginVersion, angularRange }),
    migrations,
    migrationsPath,
    addsRefresh: refreshMigrationKey(nextVersion) in migrations.schematics,
  };
}

export function writeSchematicsStamp({ schematicsDir, versions, migrations, migrationsPath, addsRefresh }) {
  writeFileSync(join(schematicsDir, 'versions.json'), JSON.stringify(versions, null, 2) + '\n');
  if (addsRefresh) {
    writeFileSync(migrationsPath, JSON.stringify(migrations, null, 2) + '\n');
  }
}

export function stampSchematicsDist(options) {
  const stamp = planSchematicsStamp(options);
  writeSchematicsStamp(stamp);
  return stamp;
}

// `npm view <name>@<version> version` exits 1 with E404 for a version the
// registry does not list; that is an answer, so it reads as nothing printed.
// Any other failure keeps only npm's error code, not its stderr.
export function npmViewVersion(spec, registryFlag = '', exec = execSync) {
  try {
    return exec(`npm view ${spec} version${registryFlag}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const code = /npm error code (\S+)/.exec(String(error.stderr ?? ''))?.[1];
    if (code === 'E404') {
      return '';
    }
    throw new Error(code ?? `npm view exited with ${error.status ?? 'no status'}`);
  }
}

// Every pin createSchematicsVersions writes must resolve on the registry, or
// `ng add` installs a version that does not exist. `view` returns what
// `npm view` prints, empty for an unlisted version; a lookup that throws
// fails closed, since an unreachable registry proves nothing. The @cngx/mcp
// pin is the release version itself: mcp is published in the same run,
// before @cngx/core, so only the eslint-plugin pin is looked up here.
export function assertPinsPublished({ eslintPluginVersion }, view) {
  const pins = [['@cngx/eslint-plugin', eslintPluginVersion]];
  for (const [name, version] of pins) {
    let found;
    try {
      found = view(`${name}@${version}`);
    } catch (error) {
      throw new Error(`could not look up ${name}@${version} on npm: ${error.message}`);
    }
    if (found?.trim() !== version) {
      throw new Error(`${name}@${version} is not on npm; publish it first`);
    }
  }
}

// Semver precedence of two release versions: negative when `a` sorts below
// `b`, 0 when equal, positive above. A prerelease sorts below its release
// (0.1.0-rc.9 < 0.1.0), numeric identifiers compare as numbers (rc.9 < rc.10),
// a numeric identifier sorts below an alphanumeric one, and a shorter
// identifier list below a longer one with the same prefix. Build metadata is
// not used by cngx releases and is not handled.
export function compareReleaseVersions(a, b) {
  const [baseA, preA] = splitVersion(a);
  const [baseB, preB] = splitVersion(b);
  for (let i = 0; i < 3; i++) {
    if (baseA[i] !== baseB[i]) {
      return baseA[i] - baseB[i];
    }
  }
  if (preA.length === 0 || preB.length === 0) {
    return preB.length - preA.length;
  }
  for (let i = 0; i < Math.min(preA.length, preB.length); i++) {
    const order = compareIdentifiers(preA[i], preB[i]);
    if (order !== 0) {
      return order;
    }
  }
  return preA.length - preB.length;
}

function splitVersion(version) {
  const at = version.indexOf('-');
  const base = at === -1 ? version : version.slice(0, at);
  const pre = at === -1 ? '' : version.slice(at + 1);
  const numbers = base.split('.').map(Number);
  if (numbers.length !== 3 || numbers.some((n) => !Number.isInteger(n))) {
    throw new Error(`"${version}" is not a release version (x.y.z or x.y.z-pre)`);
  }
  return [numbers, pre === '' ? [] : pre.split('.')];
}

function compareIdentifiers(a, b) {
  const numericA = /^\d+$/.test(a);
  const numericB = /^\d+$/.test(b);
  if (numericA && numericB) {
    return Number(a) - Number(b);
  }
  if (numericA !== numericB) {
    return numericA ? -1 : 1;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

// The libs, @cngx/mcp and @cngx/cli release at one version, so the release
// version must lie above every member's current version: one at or above it
// would be moved backwards or republished. `current` maps a member name to
// its version; the message names every member in the way and a version that
// clears them all.
export function assertVersionAdvances({ nextVersion, current }) {
  const blocking = Object.entries(current).filter(([, version]) => compareReleaseVersions(version, nextVersion) >= 0);
  if (blocking.length === 0) {
    return;
  }
  const highest = Object.values(current).reduce((max, v) => (compareReleaseVersions(v, max) > 0 ? v : max));
  const [[major, minor]] = splitVersion(highest);
  const named = blocking.map(([name, version]) => `${name} ${version}`).join(', ');
  throw new Error(
    `${nextVersion} does not advance ${named}; every lockstep member releases at one higher version. ` +
      `Pass --version ${major}.${minor + 1}.0 or above.`,
  );
}

// A dependency range a tooling package ships must match at least one version
// on the registry, or installing the package fails. `view` returns what
// `npm view <name>@<range> version` prints, empty when nothing matches; a
// lookup that throws fails closed, like assertPinsPublished.
export function assertDependencyResolvable(name, range, view) {
  let found;
  try {
    found = view(`${name}@${range}`);
  } catch (error) {
    throw new Error(`could not look up ${name}@${range} on npm: ${error.message}`);
  }
  if (!found?.trim()) {
    throw new Error(`${name}@${range} matches no version on npm; publish it first`);
  }
}

// The build of one lib without its schematics: those follow only through the
// declaresSchematics gate below. `npm run build:<lib>` would bundle them
// unconditionally.
export function libBuildCommand(lib) {
  return CSS_ONLY_LIBS.has(lib) ? 'node scripts/build-themes.mjs' : `npx ng build ${lib}`;
}

// A lib ships its schematics only once its source manifest declares the
// collection. Until then the bundle stays out of the tarball: the CLI cannot
// reach a collection the manifest does not name.
export function declaresSchematics(sourcePkg) {
  return typeof sourcePkg.schematics === 'string' && sourcePkg.schematics.length > 0;
}

function readSourcePkg(lib) {
  return JSON.parse(readFileSync(join(ROOT, 'projects', lib, 'package.json'), 'utf8'));
}

function shipsSchematics(lib) {
  return existsSync(join(ROOT, 'projects', lib, 'schematics')) && declaresSchematics(readSourcePkg(lib));
}

function readPackageManifest(name) {
  return JSON.parse(readFileSync(join(ROOT, 'packages', name, 'package.json'), 'utf8'));
}

export function readPackageVersion(name) {
  return readPackageManifest(name).version;
}

function run(cmd, cwd = ROOT) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function capture(cmd, cwd = ROOT) {
  return execSync(cmd, { cwd, encoding: 'utf8' }).trim();
}

function assertCleanWorktree() {
  const status = capture('git status --porcelain');
  if (status.length > 0) {
    console.error('Refusing to publish: working tree is dirty.');
    console.error('Commit or stash changes first, then re-run.');
    console.error('\n--- git status ---');
    console.error(status);
    process.exit(1);
  }
}

function assertTagAvailable(tagName) {
  const existing = capture(`git tag --list ${tagName}`);
  if (existing) {
    console.error(`Refusing to publish: git tag "${tagName}" already exists.`);
    console.error('Bump to a different version or delete the tag first.');
    process.exit(1);
  }
}

function createAndPushGitTag(version) {
  const tagName = `v${version}`;
  run(`git tag ${tagName} -m "Release ${tagName}"`);
  run(`git push origin ${tagName}`);
  console.log(`  Pushed git tag ${tagName}`);
}

// Regenerate CHANGELOG.md with the about-to-be-cut tag attributed to the
// currently-unreleased commits. git-cliff's --tag labels the unreleased
// section as this version even though the tag does not exist yet, so the tag
// and its changelog section agree once committed.
function regenerateChangelog(tagName) {
  run(`npx git-cliff --tag ${tagName} -o CHANGELOG.md`);
  console.log(`  Regenerated CHANGELOG.md for ${tagName}`);
}

// Every @cngx/* package peers on the others at the exact release and the
// ng update package group moves them together, so a release names every
// member or the published graph splits across two versions.
export function assertWholeGroup(libs) {
  const missing = PACKED_LIBS.filter((lib) => !libs.includes(lib));
  if (missing.length > 0) {
    throw new Error(
      `@cngx/* releases in lockstep; --lib ${libs.join(' --lib ')} leaves out ${missing.join(', ')}. Publish every package, or none.`,
    );
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    libs: [],
    version: null,
    bump: null,
    dryRun: false,
    tag: null,
    registry: null,
    skipGitTag: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lib':          result.libs.push(args[++i]); break;
      case '--version':      result.version = args[++i]; break;
      case '--bump':         result.bump = args[++i]; break;
      case '--tag':          result.tag = args[++i]; break;
      case '--registry':     result.registry = args[++i]; break;
      case '--dry-run':      result.dryRun = true; break;
      case '--skip-git-tag': result.skipGitTag = true; break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  // Default to all libs when none specified
  if (!result.libs.length) result.libs = [...PACKED_LIBS];

  return result;
}

function main() {
  const { libs, version, bump, dryRun, tag, registry, skipGitTag } = parseArgs();

  if (!version && !bump) {
    console.error('Specify --version <x.y.z> or --bump patch|minor|major');
    process.exit(1);
  }

  for (const lib of libs) {
    if (!PACKED_LIBS.includes(lib)) {
      console.error(`Unknown lib "${lib}". Available: ${PACKED_LIBS.join(', ')}`);
      process.exit(1);
    }
  }
  try {
    assertWholeGroup(libs);
  } catch (error) {
    console.error(`Refusing to publish: ${error.message}`);
    process.exit(1);
  }

  const rootPkg = readRootPkg();
  const currentVersion = rootPkg.version;
  const nextVersion = version ?? bumpVersion(currentVersion, bump);
  const gitTagName = `v${nextVersion}`;

  try {
    assertVersionAdvances({
      nextVersion,
      current: {
        'the libs (root package.json)': currentVersion,
        '@cngx/mcp': readPackageVersion('mcp'),
        '@cngx/cli': readPackageVersion('cli'),
      },
    });
  } catch (error) {
    console.error(`Refusing to publish: ${error.message}`);
    process.exit(1);
  }

  // Pre-flight: clean worktree + tag availability when going for real
  if (!dryRun) {
    assertCleanWorktree();
    if (!skipGitTag) assertTagAvailable(gitTagName);
  }

  console.log(`\nVersion:  ${currentVersion} -> ${nextVersion}${dryRun ? ' (dry run)' : ''}`);
  console.log(`Libs:     ${libs.join(', ')}`);
  console.log(`Tooling:  ${TOOLING_PACKAGES.join(', ')} (published first)`);
  console.log(`Tag:      ${tag ?? 'derived per lib (see resolveDistTag)'}`);
  if (registry) console.log(`Registry: ${registry}`);
  console.log(`Git tag:  ${skipGitTag ? 'skipped' : gitTagName}\n`);

  const registryFlag = registry ? ` --registry ${registry}` : '';

  // Tooling pre-flight: the cli core must be a current copy of the mcp core,
  // and the @cngx/doctor range the cli ships must resolve on the registry.
  try {
    run('npm run cli:copy-check');
    assertDependencyResolvable('@cngx/doctor', readPackageManifest('cli').dependencies['@cngx/doctor'], (spec) =>
      npmViewVersion(spec, registryFlag),
    );
  } catch (error) {
    console.error(`Refusing to publish: ${error.message}`);
    process.exit(1);
  }

  if (libs.includes('core') && shipsSchematics('core')) {
    try {
      assertPinsPublished({ eslintPluginVersion: readPackageVersion('eslint-plugin') }, (spec) =>
        npmViewVersion(spec, registryFlag),
      );
      // The build copies migrations.json and bundles every migrations/<folder>/index.ts,
      // so a source collection that checks out here builds one that does too.
      const checked = checkReleaseMigrations(SOURCE_MIGRATIONS, nextVersion, '.ts');
      console.log(`ng update: ${releaseMigrationKeys(checked, nextVersion).join(', ')} (factory checked)`);
    } catch (error) {
      console.error(`Refusing to publish: ${error.message}`);
      process.exit(1);
    }
  }

  // Every lib is built and checked before the first `npm publish`, so a
  // refusal never leaves part of the lockstep release on the registry.
  const releases = [];
  for (const lib of libs) {
    console.log(`\n[${lib}]`);

    console.log('  Building...');
    run(libBuildCommand(lib));
    const libShipsSchematics = shipsSchematics(lib);
    if (libShipsSchematics) {
      run(`node scripts/build-schematics.mjs ${lib}`);
    }

    const distPkgPath = join(ROOT, 'dist', lib, 'package.json');
    const distPkg = JSON.parse(readFileSync(distPkgPath, 'utf8'));

    if (distPkg.version !== PLACEHOLDER) {
      console.warn(`  Warning: expected "${PLACEHOLDER}", found "${distPkg.version}"`);
    }

    stampManifest(distPkg, nextVersion);

    const leftover = findPlaceholders(distPkg);
    if (leftover.length > 0) {
      console.error(`  Refusing to publish @cngx/${lib}: ${PLACEHOLDER} left in package.json field(s) ${leftover.join(', ')}`);
      process.exit(1);
    }

    let stamp = null;
    if (lib === 'core' && libShipsSchematics) {
      // The source passed the pre-flight; a failure here is a build that
      // dropped the collection or a bundle.
      try {
        stamp = planSchematicsStamp({
          schematicsDir: join(ROOT, 'dist', lib, 'schematics'),
          ...releasePins({ nextVersion, eslintPluginVersion: readPackageVersion('eslint-plugin') }),
          angularRange: distPkg.peerDependencies['@angular/core'],
        });
      } catch (error) {
        console.error(`  Refusing to publish @cngx/${lib}: ${error.message}`);
        process.exit(1);
      }
    }

    const distTag = resolveDistTag({
      nextVersion,
      explicitTag: tag,
      hasStableRelease: tag ? false : containsStableRelease(publishedVersions(lib, registryFlag)),
    });

    releases.push({ lib, distPkg, distPkgPath, stamp, distTag });
  }

  // The tooling packages are built and checked after the libs and before the
  // first `npm publish`, with the release version stamped into their source
  // manifests (the bundle and dist checks read them from disk). A dry run
  // and a failure leave the manifests as they were.
  console.log('\n[mcp, cli]');
  let tooling;
  try {
    tooling = runToolingSection({ root: ROOT, nextVersion, run, keepStamped: !dryRun });
  } catch (error) {
    console.error(`  Refusing to publish: ${error.message}`);
    process.exit(1);
  }
  const toolingDistTags = new Map(
    TOOLING_PACKAGES.map((name) => [
      name,
      resolveDistTag({
        nextVersion,
        explicitTag: tag,
        hasStableRelease: tag ? false : containsStableRelease(publishedVersions(name, registryFlag)),
      }),
    ]),
  );

  const libReleases = new Map(releases.map((release) => [release.lib, release]));
  const order = publishOrder(libs);
  const published = [];
  for (const [index, entry] of order.entries()) {
    try {
      publishEntry(entry);
    } catch (error) {
      const plan = publishFailurePlan({
        published,
        remaining: order.slice(index).map(({ name }) => name),
        nextVersion,
        error,
      });
      if (plan.restore) {
        tooling.restore();
      }
      console.error(`\nRelease stopped: ${plan.message}`);
      process.exit(1);
    }
    if (!dryRun) {
      published.push(entry.name);
    }
  }

  function publishEntry({ name, tooling: isTooling }) {
    if (isTooling) {
      const distTag = toolingDistTags.get(name);
      console.log(`\n[${name}]`);
      if (!dryRun) {
        run(`npm publish --access public --tag ${distTag}${registryFlag}`, join(ROOT, 'packages', name));
        console.log(`  Published @cngx/${name}@${nextVersion} (dist-tag ${distTag})`);
      } else {
        console.log(`  Would publish @cngx/${name}@${nextVersion} (packages/${name}, dist-tag ${distTag})`);
      }
      return;
    }
    const { lib, distPkg, distPkgPath, stamp, distTag } = libReleases.get(name);
    console.log(`\n[${lib}]`);
    const migrationsFile = `dist/${lib}/schematics/migrations/migrations.json`;
    const refreshKey = refreshMigrationKey(nextVersion);

    if (!dryRun) {
      writeFileSync(distPkgPath, JSON.stringify(distPkg, null, 2) + '\n');
      if (stamp) {
        writeSchematicsStamp(stamp);
        if (stamp.addsRefresh) {
          console.log(`  Added ${refreshKey} to ${migrationsFile}`);
        }
      }
      replaceVersionInDist(join(ROOT, 'dist', lib), nextVersion);
      run(`npm publish --access public --tag ${distTag}${registryFlag}`, join(ROOT, 'dist', lib));
      console.log(`  Published @cngx/${lib}@${nextVersion} (dist-tag ${distTag})`);
    } else {
      console.log(`  Would publish @cngx/${lib}@${nextVersion} (dist/${lib}, dist-tag ${distTag})`);
      if (stamp) {
        console.log(`  Would write dist/${lib}/schematics/versions.json ${JSON.stringify(stamp.versions)}`);
        if (stamp.addsRefresh) {
          console.log(`  Would add ${refreshKey} to ${migrationsFile}`);
        } else {
          console.log(`  Keeps the migration of ${nextVersion} in ${migrationsFile}`);
        }
      }
    }
  }

  // Update root version after all libs published successfully
  if (!dryRun) {
    rootPkg.version = nextVersion;
    writeRootPkg(rootPkg);
    console.log(`\nRoot package.json updated to ${nextVersion}`);

    // Both paths write the same files: the tooling changelogs get their
    // release section and the plugin runs the @cngx/mcp just published
    // (plugin-release.test.mjs pins it to packages/mcp/package.json).
    const releaseDate = new Date().toISOString().slice(0, 10);
    for (const name of TOOLING_PACKAGES) {
      const changelogPath = join(ROOT, 'packages', name, 'CHANGELOG.md');
      writeFileSync(changelogPath, stampToolingChangelog(readFileSync(changelogPath, 'utf8'), nextVersion, releaseDate));
    }
    const pluginMcpPath = join(ROOT, 'packages', 'plugin', '.mcp.json');
    const pluginMcp = bumpMcpPin(JSON.parse(readFileSync(pluginMcpPath, 'utf8')), nextVersion);
    writeFileSync(pluginMcpPath, JSON.stringify(pluginMcp, null, 2) + '\n');
    console.log(`Tooling changelogs and the plugin @cngx/mcp pin updated to ${nextVersion}`);

    if (skipGitTag) {
      console.log('\nGit tagging skipped (--skip-git-tag).');
      console.log(skipGitTagNote());
    } else {
      console.log('\nCreating git tag...');
      // Refresh the changelog for this version, then commit it together with
      // every other release file so the tag points at a commit that already
      // carries its own changelog section.
      regenerateChangelog(gitTagName);
      run(`git add ${releaseCommitFiles().join(' ')}`);
      run(`git commit -m "chore(release): ${nextVersion}"`);
      createAndPushGitTag(nextVersion);
      run(`git push origin HEAD`);
    }
  }

  console.log('\nDone.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
