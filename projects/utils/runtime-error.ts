import { type CngxErrorCode, formatDiagnostic } from './dev-message';

declare const ngDevMode: boolean | undefined;

/**
 * Error thrown by cngx for a misuse or a broken precondition, carrying a
 * stable `code`. In development the message reads
 * `CNGXnnnn: <message> Find more at <url>`; in a production build it is the
 * bare code (`CNGX1045`), so the message text and the doc link never ship.
 *
 * Branch on the class and the code, never on the message text:
 *
 * ```typescript
 * try {
 *   state.updateAtPath(path, node);
 * } catch (err) {
 *   if (err instanceof CngxRuntimeError && err.code === 'CNGX2010') {
 *     // handle the stale path
 *   }
 * }
 * ```
 *
 * Call-site contract: the code is a string literal in the lib's range, and the
 * message sits behind the inline guard, so the production build drops its
 * text: `throw new CngxRuntimeError('CNGX1045', typeof ngDevMode !==
 * 'undefined' && ngDevMode && 'message')`. A construction that already sits
 * in a dev-only branch may pass a plain message. Both rules are checked by
 * `scripts/__tests__/raw-throw-guard.test.mjs`.
 *
 * The constructor reads `ngDevMode` itself, so the formatter and the link
 * fold away in production even when a message reaches it. Without Angular,
 * `ngDevMode` is undefined and only the bare code is thrown.
 *
 * @category utils
 * @since 0.1.0
 * @relatedTo CngxErrorCode
 */
export class CngxRuntimeError extends Error {
  override readonly name = 'CngxRuntimeError';
  readonly code: CngxErrorCode;

  constructor(code: CngxErrorCode, message?: string | false | null) {
    super(
      typeof ngDevMode !== 'undefined' && ngDevMode && message
        ? formatDiagnostic(code, message)
        : code,
    );
    this.code = code;
  }
}
