import { type CngxErrorCode, formatDiagnostic } from './dev-message';

declare const ngDevMode: boolean | undefined;

/**
 * Error thrown by cngx for a misuse or a broken precondition, carrying a
 * stable `code`. In development the message reads
 * `CNGXnnnn: <message> Find more at <url>`; in a production build it is the
 * bare code (`CNGXnnnn`), so the message text and the doc link never ship. A
 * check that sits in a dev-only branch is removed from production entirely.
 *
 * Branch on the class and the code, never on the message text:
 *
 * ```typescript
 * try {
 *   runTheCall();
 * } catch (err) {
 *   if (err instanceof CngxRuntimeError) {
 *     report(err.code); // the same in development and production
 *   }
 * }
 * ```
 *
 * Call-site contract: the code is a string literal in the lib's range, and the
 * message sits behind the inline guard, so the production build drops its
 * text: `throw new CngxRuntimeError('CNGXnnnn', typeof ngDevMode !==
 * 'undefined' && ngDevMode && 'message')`. A construction that already sits
 * in a dev-only branch may pass a plain message. Both rules are checked by
 * `scripts/__tests__/raw-throw-guard.test.mjs`.
 *
 * The constructor reads `ngDevMode` itself, so the formatter and the link
 * fold away in production even when a message reaches it. Without Angular,
 * `ngDevMode` is undefined and only the bare code is thrown.
 *
 * Pass `{ cause }` as the third argument when the error wraps a caught one,
 * so the original error stays reachable in both builds.
 *
 * @category utils
 * @since 0.1.0
 * @relatedTo CngxErrorCode
 */
export class CngxRuntimeError extends Error {
  override readonly name = 'CngxRuntimeError';
  readonly code: CngxErrorCode;

  constructor(code: CngxErrorCode, message?: string | false | null, options?: ErrorOptions) {
    super(
      typeof ngDevMode !== 'undefined' && ngDevMode && message
        ? formatDiagnostic(code, message)
        : code,
      options,
    );
    this.code = code;
  }
}
