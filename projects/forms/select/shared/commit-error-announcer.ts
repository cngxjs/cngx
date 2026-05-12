import { InjectionToken, type Signal } from '@angular/core';

import type { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Scalar-commit failure announce policy.
 *
 * - `verbose` — error text verbatim into the live-region at the supplied
 *   severity. `CngxSelect` uses `assertive`.
 * - `soft` — generic "removed" via the configured announcer format,
 *   polite. `CngxTypeahead` uses this so the free-text flow isn't
 *   interrupted.
 */
export type CngxCommitErrorAnnouncePolicy =
  | { readonly kind: 'verbose'; readonly severity: 'assertive' | 'polite' }
  | { readonly kind: 'soft' };

/**
 * Announcer surface for {@link createCommitErrorAnnouncer} — verbose path
 * through `announcer.announce`, soft path through `softAnnounce`.
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
 * Popover-close timing stays inline per variant — see
 * `select-family-accepted-debt §2`.
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
 */
export type CngxCommitErrorAnnouncerFactory = (
  options: CngxCommitErrorAnnouncerOptions,
) => (err: unknown) => void;

/**
 * Factory token for the scalar-commit error-announce path. Default
 * {@link createCommitErrorAnnouncer}. Override for telemetry, locale,
 * or test doubles.
 */
export const CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY =
  new InjectionToken<CngxCommitErrorAnnouncerFactory>(
    'CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY',
    { providedIn: 'root', factory: () => createCommitErrorAnnouncer },
  );
