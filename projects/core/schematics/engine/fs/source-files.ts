// What counts as app source, shared by the component count of `ng add` and
// the rename walk of `ng update`, so both read the same files.

/** Installed packages and tool state: never app source, at any depth. */
export const NON_SOURCE_DIRS: ReadonlySet<string> = new Set(['node_modules', '.angular', '.git', '.cngx']);

/**
 * Build output names, skipped directly under the walked root only: below it
 * a folder with the same name (`src/app/dist/`) is source.
 */
export const BUILD_OUTPUT_DIRS: ReadonlySet<string> = new Set(['dist', 'out-tsc', 'coverage']);

/** A TypeScript file of the app itself: no spec, no declaration file. */
export function isAppSource(path: string): boolean {
  return path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.endsWith('.d.ts');
}

/** A file a rename can touch: a template, or TypeScript other than a declaration file. */
export function isRenameTarget(path: string): boolean {
  return path.endsWith('.html') || (path.endsWith('.ts') && !path.endsWith('.d.ts'));
}
