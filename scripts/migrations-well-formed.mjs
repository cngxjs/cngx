// The rules the migrations-well-formed guard applies to every `ng update`
// migration: the key, the factory source, the spec and the fixture pair.
// Pure, so the rules run against synthetic inputs as well as the real
// collection (which may hold no hand-written entry at all).

// `migration-v<version>` for a release's first migration; a later breaking
// change in the same release adds `migration-v<version>-<slug>`, so every
// breaking PR brings its own key. The folder is the key without the prefix.
const KEY = /^migration-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)(-[a-z][a-z0-9-]*)?$/;

/** The migration folder a key points at. */
export function folderOf(key) {
  return key.slice('migration-v'.length);
}

/** What is wrong with one `migrations.json` entry; empty when it is well formed. */
export function keyProblems(key, entry) {
  const match = KEY.exec(key);
  if (match === null) {
    return [`${key} is not migration-v<version>[-<slug>]`];
  }
  const problems = [];
  if (entry?.version !== match[1]) {
    problems.push(`${key} declares version ${entry?.version}, its key says ${match[1]}`);
  }
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
  return source === undefined ? ['index.spec.ts is missing'] : [];
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
    if (files === undefined || Object.keys(files).length === 0) {
      problems.push(`fixtures/${side} is empty`);
    }
  }
  return problems;
}
