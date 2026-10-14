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
 * Example code under `projects/<lib>/<entry>/examples/` is demo material, not
 * reachable from any `public-api.ts`. The guards and the error-code manifest
 * read library sources only, so they agree on one file set.
 *
 * @param {string} relPath repo-relative file path, posix separators
 * @returns {boolean}
 */
export function isExampleSource(relPath) {
  return relPath.includes('/examples/');
}
