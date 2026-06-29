import { InjectionToken, type Signal } from '@angular/core';

import type { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Scalar-commit failure announce policy.
 *
 * - `verbose` - error text verbatim into the live-region at the supplied
 *   severity. `CngxSelect` uses `assertive`.
 * - `soft` - generic "removed" via the configured announcer format,
 *   polite. `CngxTypeahead` uses this so the free-text flow isn't
 *   interrupted.
 *
 * @category forms/select/commit
 */
export type CngxCommitErrorAnnouncePolicy =
  | { readonly kind: 'verbose'; readonly severity: 'assertive' | 'polite' }
  | { readonly kind: 'soft' };

/**
 * Announcer surface for {@link createCommitErrorAnnouncer} - verbose path
 * through `announcer.announce`, soft path through `softAnnounce`.
 *
 * @category forms/select/commit
 */
export interface CngxCommitErrorAnnounceDeps {
  readonly announcer: CngxSelectAnnouncer;
  readonly commitErrorMessage: (err: unknown) => string;
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
 *   deps: { announcer, commitErrorMessage, softAnnounce },
 *   policy: signal({ kind: 'soft' } as const),
 * });
 * ```
 *
 * @category forms/select/commit
 */
export interface CngxCommitErrorAnnouncerOptions {
  readonly deps: CngxCommitErrorAnnounceDeps;
  readonly policy: Signal<CngxCommitErrorAnnouncePolicy>;
}

/**
 * Default factory for the scalar commit-error announcer. Dispatches
 * via `policy.kind`: `'verbose'` announces the formatted error message
 * at the configured severity; `'soft'` calls the soft-announce hook
 * (`CngxTypeahead` removal pattern).
 *
 * Override the {@link CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY} token to
 * swap in telemetry or locale-aware variants.
 *
 * @category forms/select/commit
 */
export function createCommitErrorAnnouncer(
  opts: CngxCommitErrorAnnouncerOptions,
): (err: unknown) => void {
  return (err: unknown): void => {
    const p = opts.policy();
    if (p.kind === 'verbose') {
      opts.deps.announcer.announce(opts.deps.commitErrorMessage(err), p.severity);
      return;
    }
    opts.deps.softAnnounce(null, 'removed', 0, false);
  };
}

/**
 * Factory signature for {@link CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY}.
 *
 * @category forms/select/commit
 */
export type CngxCommitErrorAnnouncerFactory = (
  options: CngxCommitErrorAnnouncerOptions,
) => (err: unknown) => void;

/**
 * Factory for the scalar-commit error-announce path - turns a failed commit
 * into a live-region message. Default `createCommitErrorAnnouncer`. Override
 * for telemetry, locale, or test doubles.
 *
 * @category forms/select/commit
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/commit-error-announcer.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CNGX_SCALAR_COMMIT_HANDLER_FACTORY
 */
export const CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY =
  new InjectionToken<CngxCommitErrorAnnouncerFactory>('CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY', {
    providedIn: 'root',
    factory: () => createCommitErrorAnnouncer,
  });
