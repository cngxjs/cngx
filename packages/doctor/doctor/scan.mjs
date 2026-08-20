/**
 * The project scanner for the `@cngx/doctor` CLI. Produces a plain snapshot the
 * checks read - no check re-walks the tree. The scan is a deterministic static
 * pass over `src/**` sources, `package.json`, and the resolved app style
 * entries; it is not type-aware. That is exactly the whole-project view ESLint's
 * per-file scope cannot see.
 *
 * `scan(dir)` does a full walk. `scan(dir, { prior, changedFile })` returns a
 * snapshot updated for one changed file only, re-reading `package.json` and the
 * style entries just when their mtime moved - the hook's incremental path.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SOURCE_EXTENSIONS = ['.ts', '.html'];
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.angular', '.git']);
const STYLE_CANDIDATES = ['src/styles.css', 'src/styles.scss', 'src/styles.sass', 'src/styles.less'];

/**
 * @typedef {object} StyleEntry
 * @property {string} path   relative to the project root
 * @property {string} text
 * @property {number} mtimeMs
 *
 * @typedef {object} Snapshot
 * @property {string} projectDir
 * @property {Record<string, string>} dependencies  merged deps + devDeps
 * @property {number | null} packageMtimeMs
 * @property {number | null} angularMtimeMs
 * @property {Record<string, string>} sources        relative path -> file text
 * @property {StyleEntry[]} styleEntries
 */

function isSourceFile(name) {
  return SOURCE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function walkSources(rootDir) {
  /** @type {Record<string, string>} */
  const sources = {};
  const stack = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          stack.push(join(dir, entry.name));
        }
        continue;
      }
      if (entry.isFile() && isSourceFile(entry.name)) {
        const abs = join(dir, entry.name);
        try {
          sources[relative(rootDir, abs)] = readFileSync(abs, 'utf8');
        } catch {
          /* unreadable file - skip */
        }
      }
    }
  }
  return sources;
}

function readPackageJson(projectDir) {
  const path = join(projectDir, 'package.json');
  if (!existsSync(path)) {
    return { dependencies: {}, packageMtimeMs: null };
  }
  let dependencies = {};
  try {
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    /* malformed package.json - treat as no declared deps */
  }
  return { dependencies, packageMtimeMs: safeMtime(path) };
}

function safeMtime(path) {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return null;
  }
}

// Resolve the app's global style entries: the angular.json `styles` arrays when
// present, plus the conventional src/styles.* defaults. The Track-B check reads
// their text to see whether @cngx/themes/cngx.css is imported anywhere.
function resolveStyleEntries(projectDir) {
  const candidates = new Set(STYLE_CANDIDATES);
  const angularJson = join(projectDir, 'angular.json');
  if (existsSync(angularJson)) {
    try {
      const config = JSON.parse(readFileSync(angularJson, 'utf8'));
      for (const project of Object.values(config.projects ?? {})) {
        const styles = project?.architect?.build?.options?.styles ?? [];
        for (const style of styles) {
          const path = typeof style === 'string' ? style : style?.input;
          if (typeof path === 'string') {
            candidates.add(path);
          }
        }
      }
    } catch {
      /* malformed angular.json - fall back to conventional defaults */
    }
  }

  /** @type {StyleEntry[]} */
  const entries = [];
  for (const relPath of candidates) {
    const abs = join(projectDir, relPath);
    if (existsSync(abs)) {
      try {
        entries.push({ path: relPath, text: readFileSync(abs, 'utf8'), mtimeMs: safeMtime(abs) });
      } catch {
        /* unreadable style file - skip */
      }
    }
  }
  return entries;
}

/** @returns {Snapshot} */
function fullScan(projectDir) {
  const root = resolve(projectDir);
  const srcDir = join(root, 'src');
  const walkRoot = existsSync(srcDir) ? srcDir : root;
  const sourcesAbs = walkSources(walkRoot);
  // Re-key relative to the project root so finding.file reads naturally.
  /** @type {Record<string, string>} */
  const sources = {};
  for (const [rel, text] of Object.entries(sourcesAbs)) {
    sources[relative(root, join(walkRoot, rel))] = text;
  }
  const { dependencies, packageMtimeMs } = readPackageJson(root);
  return {
    projectDir: root,
    dependencies,
    packageMtimeMs,
    angularMtimeMs: safeMtime(join(root, 'angular.json')),
    sources,
    styleEntries: resolveStyleEntries(root),
  };
}

/** @returns {Snapshot} */
function incrementalScan(prior, projectDir, changedFile) {
  const root = resolve(projectDir);
  const sources = { ...prior.sources };
  const changedAbs = resolve(changedFile);
  const rel = relative(root, changedAbs);
  if (isSourceFile(changedAbs) && !rel.startsWith('..')) {
    if (existsSync(changedAbs)) {
      try {
        sources[rel] = readFileSync(changedAbs, 'utf8');
      } catch {
        delete sources[rel];
      }
    } else {
      delete sources[rel];
    }
  }

  // package.json and style entries are re-read only when their mtime moved.
  const pkgMtime = safeMtime(join(root, 'package.json'));
  let { dependencies, packageMtimeMs } = prior;
  if (pkgMtime !== prior.packageMtimeMs) {
    ({ dependencies, packageMtimeMs } = readPackageJson(root));
  }

  // Re-resolve the style entries when a tracked entry moved, when angular.json
  // moved (it may declare new global styles), or when a conventional stylesheet
  // that was absent at cold-walk time now exists - a consumer following the
  // Track-B fixHint by adding the import must clear the finding on the warm path.
  const angularMtimeMs = safeMtime(join(root, 'angular.json'));
  const priorStyleDrifted = prior.styleEntries.some((e) => safeMtime(join(root, e.path)) !== e.mtimeMs);
  const angularDrifted = angularMtimeMs !== (prior.angularMtimeMs ?? null);
  const newCandidateAppeared = STYLE_CANDIDATES.some(
    (rel) => existsSync(join(root, rel)) && !prior.styleEntries.some((e) => e.path === rel),
  );
  const styleEntries =
    priorStyleDrifted || angularDrifted || newCandidateAppeared ? resolveStyleEntries(root) : prior.styleEntries;

  return { projectDir: root, dependencies, packageMtimeMs, angularMtimeMs, sources, styleEntries };
}

/**
 * @param {string} projectDir
 * @param {{ prior?: Snapshot, changedFile?: string }} [options]
 * @returns {Snapshot}
 */
export function scan(projectDir, options = {}) {
  const { prior, changedFile } = options;
  if (prior && changedFile) {
    return incrementalScan(prior, projectDir, changedFile);
  }
  return fullScan(projectDir);
}
