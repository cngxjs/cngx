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
 * @property {Record<string, number | null>} configFiles  style-config file -> mtime (angular.json + Nx project.json)
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

// Where Nx keeps per-project config. An Nx workspace has no angular.json; each
// app's `project.json` declares its own build styles under `targets` instead of
// `architect`. Scanning root + apps/* + libs/* covers the conventional layout
// without walking the whole tree for config files.
const NX_PROJECT_PARENT_DIRS = ['apps', 'libs'];

/**
 * The style-config files this scan honors, relative to the project root:
 * `angular.json` plus every conventional Nx `project.json`. The list doubles as
 * the incremental invalidation key - when any of these moves (or one appears),
 * the style entries are re-resolved.
 */
export function listStyleConfigFiles(projectDir) {
  const files = [];
  for (const rel of ['angular.json', 'project.json']) {
    if (existsSync(join(projectDir, rel))) {
      files.push(rel);
    }
  }
  for (const parent of NX_PROJECT_PARENT_DIRS) {
    let entries;
    try {
      entries = readdirSync(join(projectDir, parent), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const rel = join(parent, entry.name, 'project.json');
      if (entry.isDirectory() && existsSync(join(projectDir, rel))) {
        files.push(rel);
      }
    }
  }
  return files;
}

// Pull the declared style paths out of one parsed config. angular.json nests
// projects under `projects` and uses `architect`; an Nx project.json IS the
// project and uses `targets`. Both shapes funnel through the same walk.
function stylesFromConfig(config) {
  const projects = config?.projects ? Object.values(config.projects) : [config];
  const paths = [];
  for (const project of projects) {
    const targets = project?.architect ?? project?.targets ?? {};
    const styles = targets?.build?.options?.styles ?? [];
    for (const style of styles) {
      const path = typeof style === 'string' ? style : style?.input;
      if (typeof path === 'string') {
        paths.push(path);
      }
    }
  }
  return paths;
}

// Resolve the app's global style entries: the `styles` arrays of angular.json
// and any Nx project.json when present, plus the conventional src/styles.*
// defaults. The Track-B check reads their text (and path) to see whether
// @cngx/themes/cngx.css is wired anywhere.
function resolveStyleEntries(projectDir) {
  const candidates = new Set(STYLE_CANDIDATES);
  for (const configRel of listStyleConfigFiles(projectDir)) {
    try {
      const config = JSON.parse(readFileSync(join(projectDir, configRel), 'utf8'));
      for (const path of stylesFromConfig(config)) {
        candidates.add(path);
      }
    } catch {
      /* malformed config file - fall back to conventional defaults */
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
    configFiles: readConfigMtimes(root),
    sources,
    styleEntries: resolveStyleEntries(root),
  };
}

/** The current style-config files and their mtimes - the invalidation key. */
function readConfigMtimes(root) {
  /** @type {Record<string, number | null>} */
  const mtimes = {};
  for (const rel of listStyleConfigFiles(root)) {
    mtimes[rel] = safeMtime(join(root, rel));
  }
  return mtimes;
}

function configFilesDrifted(prior, current) {
  // A cached snapshot from before the configFiles key (or a corrupt one)
  // cannot prove freshness - treat it as drifted and re-resolve.
  if (!prior || typeof prior !== 'object') {
    return true;
  }
  const priorKeys = Object.keys(prior);
  const currentKeys = Object.keys(current);
  if (priorKeys.length !== currentKeys.length) {
    return true;
  }
  return currentKeys.some((rel) => prior[rel] !== current[rel]);
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

  // Re-resolve the style entries when a tracked entry moved, when a style-config
  // file (angular.json or an Nx project.json) moved or appeared, or when a
  // conventional stylesheet that was absent at cold-walk time now exists - a
  // consumer following the Track-B fixHint by adding the import must clear the
  // finding on the warm path.
  const configFiles = readConfigMtimes(root);
  const priorStyleDrifted = prior.styleEntries.some((e) => safeMtime(join(root, e.path)) !== e.mtimeMs);
  const configDrifted = configFilesDrifted(prior.configFiles, configFiles);
  const newCandidateAppeared = STYLE_CANDIDATES.some(
    (rel) => existsSync(join(root, rel)) && !prior.styleEntries.some((e) => e.path === rel),
  );
  const styleEntries =
    priorStyleDrifted || configDrifted || newCandidateAppeared ? resolveStyleEntries(root) : prior.styleEntries;

  return { projectDir: root, dependencies, packageMtimeMs, configFiles, sources, styleEntries };
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
