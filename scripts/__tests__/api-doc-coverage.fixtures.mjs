/**
 * Manifests for `api-doc-coverage.test.mjs`.
 *
 * Kept beside the guard rather than inside it: the ratchet is the auditable
 * artefact of the doc coverage program, it changes on a different cadence than
 * the scanner, and a reviewer should be able to read it without paging past
 * the fixtures.
 *
 * A row is keyed by `entry` + `owner` + `kind` + `member`, never by line - a
 * member that moves within its file is the same gap, and a ratchet keyed on
 * line numbers would fail on every unrelated edit above it.
 *
 * Both lists are empty and the guard asserts they stay empty. A new gap is
 * fixed at its source with a JSDoc (or `@internal` when the member implements
 * an unexported contract or only the own template / class calls it), never
 * parked here.
 */

/**
 * One undocumented public API member.
 *
 * @typedef {object} ApiDocGap
 * @property {string} entry Entry point that exports the owner, e.g. `@cngx/forms/select`.
 * @property {string} owner Class, token or function name.
 * @property {'entry' | 'input' | 'output' | 'method' | 'accessor' | 'token' | 'function'} kind
 * @property {string} member Field or method name; the owner name for entry, token and function rows.
 * @property {string} [binding] Binding name when the input or output is aliased.
 */

/**
 * One binding field that still carries `@internal` (decision A: the field is
 * the binding and stays documented). Keyed by file + member.
 *
 * @typedef {object} InternalBinding
 * @property {string} file Repo-relative path.
 * @property {string} owner Class that declares the field.
 * @property {string} member Field name.
 */

/** @type {readonly InternalBinding[]} */
export const INTERNAL_BINDINGS = [];

/** Pinned to 0 by the guard. */
export const CEILING = 0;

/** @type {readonly ApiDocGap[]} */
// prettier-ignore
export const RATCHET = [
];
