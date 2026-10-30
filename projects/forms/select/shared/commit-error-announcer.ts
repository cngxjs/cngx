import { InjectionToken, untracked, type Signal } from '@angular/core';

import type { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Scalar-commit failure announce policy.
 *
 * - `verbose` - error text verbatim into the live-region at the supplied
 *   severity. `CngxSelect` uses `assertive`.
 * - `soft` - the `commitFailedSoft` copy ("Save failed, previous value
 *   restored"), polite. `CngxTypeahead` uses this so the free-text flow
 *   isn't interrupted.
 */
export type CngxCommitErrorAnnouncePolicy =
  | { readonly kind: 'verbose'; readonly severity: 'assertive' | 'polite' }
  | { readonly kind: 'soft' };

/**
 * Announcer surface for {@link createCommitErrorAnnouncer} - verbose path
 * through `announcer.announce`, soft path through `softAnnounce`.
 */
export interface CngxCommitErrorAnnounceDeps {
  readonly announcer: CngxSelectAnnouncer;
  readonly commitErrorMessage: (err: unknown) => string;
  /**
   * The polite sentence the `soft` policy speaks for a failed commit. Read
   * untracked. Without it the default factory announces nothing on the soft
   * path; it never speaks the "selection cleared" phrase for a failure.
   */
  readonly softFailureMessage?: () => string;
  /**
   * Selection announce hook. The default factory no longer calls it on a
   * failed commit; kept for custom factories that announce through the
   * selection format.
   */
  readonly softAnnounce: (
    option: CngxSelectOptionDef<unknown> | null,
    action: 'added' | 'removed',
    count: number,
    multi: boolean,
  ) => void;
}

/**
 * Builds the scalar-commit error-announce callback from a policy signal.
 *
 * Popover-close timing stays inline per variant.
 *
 * ```ts
 * // CngxSelect (verbose, assertive)
 * private readonly announceCommitError = createCommitErrorAnnouncer({
 *   deps: { announcer, commitErrorMessage, softAnnounce },
 *   policy: signal({ kind: 'verbose', severity: 'assertive' } as const),
 * });
 *
 * // CngxTypeahead (soft, polite)
 * private readonly announceCommitError = createCommitErrorAnnouncer({
 *   deps: { announcer, commitErrorMessage, softAnnounce, softFailureMessage },
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
 * politely (nothing when the dep is absent).
 *
 * Override the {@link CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY} token to
 * swap in telemetry or locale-aware variants.
 */
export function createCommitErrorAnnouncer(
  opts: CngxCommitErrorAnnouncerOptions,
): (err: unknown) => void {
  return (err: unknown): void => {
    const p = opts.policy();
    if (p.kind === 'verbose') {
      // The message reads copy; untracked so a language flip never re-runs
      // an effect that announced it.
      const message = untracked(() => opts.deps.commitErrorMessage(err));
      opts.deps.announcer.announce(message, p.severity);
      return;
    }
    const soft = opts.deps.softFailureMessage;
    if (!soft) {
      return;
    }
    opts.deps.announcer.announce(untracked(soft), 'polite');
  };
}

/**
 * Factory signature for {@link CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY}.
 */
export type CngxCommitErrorAnnouncerFactory = (
  options: CngxCommitErrorAnnouncerOptions,
) => (err: unknown) => void;

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
