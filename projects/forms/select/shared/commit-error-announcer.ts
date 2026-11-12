import { InjectionToken, untracked, type Signal } from '@angular/core';

import type { CngxSelectAnnouncer } from './announcer';

/**
 * Scalar-commit failure announce policy.
 *
 * - `verbose` - error text verbatim into the live-region at the supplied
 *   severity. `CngxSelect` uses `assertive`.
 * - `soft` - polite. After a real rollback it speaks the `commitFailedSoft`
 *   copy ("Save failed, previous value restored"); when nothing was restored
 *   (pessimistic mode, an external write won) it speaks the regular
 *   commit-failed sentence. `CngxTypeahead` uses this so the free-text flow
 *   isn't interrupted.
 */
export type CngxCommitErrorAnnouncePolicy =
  | { readonly kind: 'verbose'; readonly severity: 'assertive' | 'polite' }
  | { readonly kind: 'soft' };

/**
 * Announcer and copy the select core hands to the commit-error announcer.
 *
 * The core passes the composite's `CngxSelectAnnouncer`, the commit-error
 * message formatter and the soft-failure sentence from the select copy. Both
 * policies speak through `announcer.announce`, so a replacement that keeps
 * this call reaches the same live region as every other select announcement.
 */
export interface CngxCommitErrorAnnounceDeps {
  readonly announcer: CngxSelectAnnouncer;
  readonly commitErrorMessage: (err: unknown) => string;
  /**
   * The polite sentence the `soft` policy speaks for a failed commit whose
   * previous value was restored. Read untracked. Without it the soft path
   * speaks `commitErrorMessage` politely; it never speaks the "selection
   * cleared" phrase for a failure.
   */
  readonly softFailureMessage?: () => string;
}

/**
 * Builds the scalar-commit error-announce callback from a policy signal.
 *
 * Popover-close timing stays inline per variant.
 *
 * ```ts
 * // CngxSelect (verbose, assertive)
 * private readonly announceCommitError = createCommitErrorAnnouncer({
 *   deps: { announcer, commitErrorMessage },
 *   policy: signal({ kind: 'verbose', severity: 'assertive' } as const),
 * });
 *
 * // CngxTypeahead (soft, polite)
 * private readonly announceCommitError = createCommitErrorAnnouncer({
 *   deps: { announcer, commitErrorMessage, softFailureMessage },
 *   policy: signal({ kind: 'soft' } as const),
 * });
 * ```
 */
export interface CngxCommitErrorAnnouncerOptions {
  readonly deps: CngxCommitErrorAnnounceDeps;
  readonly policy: Signal<CngxCommitErrorAnnouncePolicy>;
}

/**
 * Default factory for the scalar commit-error announcer. Dispatches
 * via `policy.kind`: `'verbose'` announces the formatted error message
 * at the configured severity; `'soft'` announces `softFailureMessage`
 * politely after a real rollback, else the formatted error message politely.
 * The returned callback takes `rolledBack`, `true` when the commit handler
 * restored the previous value before the call; callers that cannot tell
 * omit it.
 *
 * Override the {@link CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY} token to
 * swap in telemetry or locale-aware variants.
 */
export function createCommitErrorAnnouncer(
  opts: CngxCommitErrorAnnouncerOptions,
): (err: unknown, rolledBack?: boolean) => void {
  // Copy is read untracked so a language flip never re-runs an effect that
  // announced it.
  const regular = (err: unknown): string => untracked(() => opts.deps.commitErrorMessage(err));
  return (err: unknown, rolledBack?: boolean): void => {
    const p = opts.policy();
    if (p.kind === 'verbose') {
      opts.deps.announcer.announce(regular(err), p.severity);
      return;
    }
    const soft = opts.deps.softFailureMessage;
    // "Previous value restored" is only true after a real rollback.
    const message = rolledBack === true && soft ? untracked(soft) : regular(err);
    opts.deps.announcer.announce(message, 'polite');
  };
}

/**
 * Function shape a replacement commit-error announcer must have.
 *
 * The select core calls it in every composite to build the callback its
 * commit handlers receive as `announceError` or `onCommitError`. A
 * replacement that drops the announce leaves screen-reader users with only
 * the visual error surface. Provide it through
 * {@link CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY}.
 */
export type CngxCommitErrorAnnouncerFactory = (
  options: CngxCommitErrorAnnouncerOptions,
) => (err: unknown, rolledBack?: boolean) => void;

/**
 * Factory for the scalar-commit error-announce path - turns a failed commit
 * into a live-region message. Default `createCommitErrorAnnouncer`. Override
 * for telemetry, locale, or test doubles.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/commit-error-announcer.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CNGX_SCALAR_COMMIT_HANDLER_FACTORY
 */
export const CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY =
  new InjectionToken<CngxCommitErrorAnnouncerFactory>('CngxCommitErrorAnnouncerFactory', {
    providedIn: 'root',
    factory: () => createCommitErrorAnnouncer,
  });
