/**
 * Shape of a cngx diagnostic code: `CNGX` plus four digits, for example
 * `CNGX0901`. One type for both channels: the console diagnostics written by
 * `cngxDevWarn` / `cngxDevError` and the `code` of a thrown
 * `CngxRuntimeError`. The shape is typed here; existence, uniqueness and the
 * lib range are checked by `scripts/__tests__/raw-console-guard.test.mjs` and
 * `scripts/__tests__/raw-throw-guard.test.mjs`.
 *
 * @category utils
 * @since 0.1.0
 * @relatedTo CngxRuntimeError
 */
export type CngxErrorCode = `CNGX${number}`;

/**
 * Base URL of the per-code doc pages. A code's page is
 * `${CNGX_ERROR_DOCS_URL}cngx<nnnn>.html`.
 *
 * @internal
 * @category utils
 */
export const CNGX_ERROR_DOCS_URL =
  'https://cngxjs.github.io/cngx/additional-documentation/error-codes/';

/**
 * Formats a coded diagnostic as `CNGXnnnn: <message> Find more at <url>`.
 * Shared by the console helpers and `CngxRuntimeError`; not published from
 * the barrel.
 *
 * @internal
 */
export function formatDiagnostic(code: CngxErrorCode, message: string): string {
  return `${code}: ${message} Find more at ${CNGX_ERROR_DOCS_URL}${code.toLowerCase()}.html`;
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
 * @category utils
 */
export function cngxDevWarn(code: CngxErrorCode, message: string, ...context: unknown[]): void {
  console.warn(formatDiagnostic(code, message), ...context);
}

/**
 * Same contract as {@link cngxDevWarn}, written to `console.error`. Use it for
 * a misconfiguration that leaves the feature non-functional.
 *
 * @internal
 * @category utils
 */
export function cngxDevError(code: CngxErrorCode, message: string, ...context: unknown[]): void {
  console.error(formatDiagnostic(code, message), ...context);
}
