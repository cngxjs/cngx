// The rules the migrations-well-formed guard applies to every `ng update`
// migration: the key, the factory source, the spec and the fixture pair.
// Pure, so the rules run against synthetic inputs as well as the real
// collection (which may hold no hand-written entry at all).

// `migration-v<version>` for a release's first migration; a later breaking
// change in the same release adds `migration-v<version>-<slug>`, so every
// breaking PR brings its own key. The version comes from the entry, not from
// the key, so a slug is never read as a prerelease. The folder is the key
// without the prefix.
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;
const SLUG = /^[a-z][a-z0-9-]*$/;

// A spec case that runs the migration: an `it(` and a call through the
// factory or `createMigration`, not a placeholder.
const RUNS_MIGRATION = /\bit\(/;
const NAMES_MIGRATION = /\b(migrate|createMigration)\b/;

const PLACEHOLDER = '.gitkeep';

/** The migration folder a key points at. */
export function folderOf(key) {
  return key.slice('migration-v'.length);
}

/** What is wrong with one `migrations.json` entry; empty when it is well formed. */
export function keyProblems(key, entry) {
  const version = entry?.version;
  if (typeof version !== 'string' || !VERSION.test(version)) {
    return [`${key} declares no semver version (${version})`];
  }
  const release = `migration-v${version}`;
  const slug = key.startsWith(`${release}-`) ? key.slice(release.length + 1) : undefined;
  if (key !== release && (slug === undefined || !SLUG.test(slug))) {
    return [`${key} is not ${release} or ${release}-<slug>`];
  }
  const problems = [];
  if (typeof entry?.description !== 'string') {
    problems.push(`${key} has no description`);
  }
  const factory = `./${folderOf(key)}/index#migrate`;
  if (entry?.factory !== factory) {
    problems.push(`${key} points at ${entry?.factory}, expected ${factory}`);
  }
  return problems;
}

/** What is wrong with a migration's `index.ts`; `undefined` when the file is missing. */
export function factoryProblems(source) {
  if (source === undefined) {
    return ['index.ts is missing'];
  }
  return /export function migrate\(/.test(source) ? [] : ['index.ts exports no migrate factory'];
}

/** What is wrong with a migration's `index.spec.ts`; `undefined` when the file is missing. */
export function specProblems(source) {
  if (source === undefined) {
    return ['index.spec.ts is missing'];
  }
  return RUNS_MIGRATION.test(source) && NAMES_MIGRATION.test(source)
    ? []
    : ['index.spec.ts has no case that runs migrate or createMigration'];
}

/**
 * What is wrong with a fixture pair. Each side maps a path inside the
 * folder to its content, or is `undefined` when the folder is missing.
 */
export function fixtureProblems(before, after) {
  const problems = [];
  for (const [side, files] of [
    ['before', before],
    ['after', after],
  ]) {
    if (realFiles(files).length === 0) {
      problems.push(`fixtures/${side} holds no file but ${PLACEHOLDER}`);
    }
  }
  if (problems.length === 0 && sameFiles(before, after)) {
    problems.push('fixtures/after equals fixtures/before');
  }
  return problems;
}

function realFiles(files) {
  return Object.keys(files ?? {}).filter((path) => path.split(/[\\/]/).pop() !== PLACEHOLDER);
}

function sameFiles(before, after) {
  const paths = realFiles(before);
  return paths.length === realFiles(after).length && paths.every((path) => after[path] === before[path]);
}
