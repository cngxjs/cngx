import { resolve } from 'node:path';

import { compileString } from 'sass';

// The runner cwd is the repo root. `__dirname` is not usable here: the
// builder hoists this module into a shared chunk whose directory varies.
const REPO_ROOT = process.cwd();
const LOAD_PATHS = [resolve(REPO_ROOT, 'node_modules'), resolve(REPO_ROOT, 'projects/themes')];

/**
 * Compiles a Sass entry string against the repo's `node_modules` and
 * `projects/themes`, so `@use '@angular/material'` and
 * `@use 'material/<bridge>'` resolve the way they do for a consumer.
 * Dependency deprecation warnings are silenced; the output style is expanded.
 */
export function compileThemeEntry(entry: string): string {
  return compileString(entry, { loadPaths: LOAD_PATHS, style: 'expanded', quietDeps: true }).css;
}

/**
 * Every `--cngx-*` custom property declared in `css`, de-duplicated and
 * sorted. Matches declarations only (`--cngx-x:`), not `var(--cngx-x)` reads.
 */
export function emittedTokenNames(css: string): readonly string[] {
  return [...new Set([...css.matchAll(/--cngx-[a-z0-9-]+(?=:)/g)].map((m) => m[0]))].sort();
}
