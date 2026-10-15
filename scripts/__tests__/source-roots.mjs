/**
 * Folders under `projects/` that hold build-time tooling, not shipped library
 * code. Every guard that walks `projects/` skips them: prompt labels and
 * terminal summaries are developer-facing CLI text, not app copy, and must not
 * enter the user-facing string ratchet.
 *
 * Each lib's `schematics/` folder (the `@cngx/core` collection and the thin
 * `ng-add` shims of the other libs) is tooling.
 */
const TOOLING_ROOT = /^projects\/[^/]+\/schematics$/;

/**
 * @param {string} relDir repo-relative directory, posix separators
 * @returns {boolean}
 */
export function isToolingRoot(relDir) {
  return TOOLING_ROOT.test(relDir);
}

/**
 * A library source file under `projects/`: not a spec, not the unpublished
 * `projects/testing` helpers, not example code under
 * `projects/<lib>/<entry>/examples/` (demo material, not reachable from any
 * `public-api.ts`). The raw-throw guard, the error-code manifest and the
 * prod-strip needle derivation all read this one file set.
 *
 * @param {string} relPath file path, posix separators
 * @returns {boolean}
 */
export function isLibrarySource(relPath) {
  return (
    !relPath.endsWith('.spec.ts') &&
    !/(^|\/)projects\/testing\//.test(relPath) &&
    !relPath.includes('/examples/')
  );
}
