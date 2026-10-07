/**
 * Manifests for `user-facing-string-coverage.test.mjs`.
 *
 * Kept beside the guard rather than inside it: the three lists are the
 * auditable artefact of the i18n coverage program, they change on a different
 * cadence than the scanner, and a reviewer should be able to read the ratchet
 * without paging past 200 lines of regex.
 *
 * A row is keyed by `file` + `value`, never by line - a string that moves
 * within its file is the same gap, and a ratchet keyed on line numbers would
 * fail on every unrelated edit above it.
 */

/**
 * One row of any of the three manifests.
 *
 * @typedef {object} StringManifestEntry
 * @property {string} file Repo-relative path, exactly as the scanner reports it.
 * @property {string} value The literal, verbatim.
 * @property {string} note Why this row exists. One clause, no prose.
 */

/**
 * The gap list: user-facing strings that ship with no app-wide override path.
 *
 * Empty, and asserted empty. A new gap is fixed at its source, not parked here.
 *
 * @type {readonly StringManifestEntry[]}
 */
export const RATCHET = [];

/**
 * Strings the scanner cannot prove are covered, but which are - the override
 * read happens through an indirection the scanner does not follow.
 *
 * Not a parking lot: every row names the token that overrides it.
 *
 * @type {readonly StringManifestEntry[]}
 */
export const ALREADY_COVERED = [];

/**
 * Deliberate non-hooks. Each row cites the accepted-debt entry or the design
 * reason that settled it, so the guard does not re-raise a closed decision on
 * every run.
 *
 * @type {readonly StringManifestEntry[]}
 */
export const EXCLUDED = [];

/**
 * The only `localeCompare` call sites the locale-source guard accepts. Empty:
 * the treetable sort, the last one, collates with an `Intl.Collator` of the
 * caller's locale.
 *
 * @type {readonly { file: string; note: string }[]}
 */
export const LOCALE_COMPARE_ALLOWED = [];
