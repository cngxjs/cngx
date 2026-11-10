import { VERSION } from './version';

/** @internal */
type CngxDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/**
 * Shape of a cngx diagnostic code: `CNGX` plus exactly four digits, for example
 * [`CNGX0901`](/error-codes/cngx0901.md). One type for both channels: the console diagnostics written by
 * `cngxDevWarn` / `cngxDevError` and the `code` of a thrown
 * `CngxRuntimeError`. The shape is typed here. That every call site passes a
 * literal code in its lib range is checked by
 * `scripts/__tests__/raw-console-guard.test.mjs` and
 * `scripts/__tests__/raw-throw-guard.test.mjs`; that every code has its page,
 * one severity and one lib is checked by `scripts/error-codes-manifest.mjs`.
 *
 * @since 0.1.0
 * @relatedTo CngxRuntimeError
 */
export type CngxErrorCode = `CNGX${CngxDigit}${CngxDigit}${CngxDigit}${CngxDigit}`;

/**
 * Base URL of the per-code doc pages in the docs of `main`. A diagnostic links
 * through {@link errorDocsUrl}, which swaps in the installed release.
 *
 * @internal
 */
export const CNGX_ERROR_DOCS_URL =
  'https://cngxjs.github.io/cngx/main/additional-documentation/error-codes/';

/**
 * Base URL of the per-code doc pages for `version`. A final release links to
 * its own docs (`/cngx/v<version>/`); a prerelease and the unpublished
 * placeholder have none and link to `main`. The check is the `-`, never the
 * placeholder string: the release rewrites every placeholder occurrence.
 *
 * @internal
 */
export function errorDocsUrl(version: string = VERSION.full): string {
  return version.includes('-')
    ? CNGX_ERROR_DOCS_URL
    : CNGX_ERROR_DOCS_URL.replace('/main/', `/v${version}/`);
}

/**
 * Formats a coded diagnostic as `CNGXnnnn: <message> Find more at <url>`.
 * Shared by the console helpers and `CngxRuntimeError`; not published from
 * the barrel.
 *
 * @internal
 */
export function formatDiagnostic(code: CngxErrorCode, message: string): string {
  return `${code}: ${message} Find more at ${errorDocsUrl()}${code.toLowerCase()}.html`;
}

/**
 * Writes a coded developer diagnostic to `console.warn`, followed by the link
 * to the code's doc page. `context` values (an element, an offending value)
 * are forwarded to the console after the message.
 *
 * Every call must sit behind the inline guard
 * `typeof ngDevMode !== 'undefined' && ngDevMode`, written at the call site
 * (an `if`, the leftmost `&&` operand, a ternary's true branch, or an early
 * `if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) { return; }`). Only
 * the inline global read folds away in a production build; `isDevMode()` or a
 * guard inside a called function does not, and the message text would ship.
 * A local function that wraps this call must start with that early return,
 * and each of its callers must be guarded the same way, so the caller's
 * arguments strip as well.
 *
 * The code is a string literal (`'CNGX0901'`), never a variable, so the
 * manifest and the production-bundle check can derive it from source.
 *
 * @internal
 */
export function cngxDevWarn(code: CngxErrorCode, message: string, ...context: unknown[]): void {
  console.warn(formatDiagnostic(code, message), ...context);
}

/**
 * Same contract as {@link cngxDevWarn}, written to `console.error`. Use it for
 * a misconfiguration that leaves the feature non-functional.
 *
 * @internal
 */
export function cngxDevError(code: CngxErrorCode, message: string, ...context: unknown[]): void {
  console.error(formatDiagnostic(code, message), ...context);
}
