import { InjectionToken, type Signal } from '@angular/core';

import type { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectOptionDef } from './option.model';

/**
 * Policy tag describing how a scalar-commit failure should be announced.
 *
 * - `{ kind: 'verbose', severity }` — pushes the full error message verbatim
 *   into the announcer's live region with the supplied severity. Used by
 *   `CngxSelect` (single-select) where the error text is user-meaningful
 *   and the assertive read is essential for blocking interactions.
 * - `{ kind: 'soft' }` — announces a generic "selection removed" via the
 *   configured announcer format (polite, count-aware). Used by
 *   `CngxTypeahead` where a failing commit simply rolls back the input
 *   text and the user's free-text flow shouldn't be interrupted by a
 *   loud error read.
 *
 * @category interactive
 */
export type CngxCommitErrorAnnouncePolicy =
  | { readonly kind: 'verbose'; readonly severity: 'assertive' | 'polite' }
  | { readonly kind: 'soft' };

/**
 * Minimal announcer-surface consumed by {@link createCommitErrorAnnouncer}.
 *
 * Mirrors the two shapes available in `CngxSelectCore` / `CngxSelectAnnouncer`
 * so both the verbose verbatim path and the soft "removed"-format path
 * can be dispatched through the same mini-factory without pulling the
 * whole `core` surface into the contract.
 *
 * @category interactive
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
 * Build the scalar-commit error-announce callback from a policy signal.
 *
 * **Why a mini-factory.** The two scalar-commit variants (`CngxSelect`
 * and `CngxTypeahead`) each previously inlined their own error-announce
 * decision — assertive-verbose vs soft-removed. That inline split was
 * the only truly divergent decision line in their commit flows; the
 * rest of `beginCommit` is shared with `createCommitController`. Pulling
 * this one decision into a declarative policy-signal lets each variant
 * state its announce intent as data and share the resolved callback via
 * `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY` for telemetry / locale / testing
 * overrides.
 *
 * **What stays inline.** Popover-close timing is NOT harmonised here:
 * the two variants diverge legitimately (single owns the popover, so
 * closes it inside `beginCommit`; typeahead delegates close-timing to
 * the AD-dispatcher via `closeOnSelect: true`). Extracting that into
 * another factory would require a breadth of callbacks that exceeds
 * its shared-logic weight — documented as accepted divergence in
 * `.internal/architektur/select-family-accepted-debt.md`.
 *
 * @example
 * ```ts
 * // CngxSelect (verbose, assertive)
 * private readonly announceCommitError = createCommitErrorAnnouncer({
 *   deps: { announcer, commitErrorMessage: core.commitErrorMessage, softAnnounce: core.announce },
 *   policy: signal({ kind: 'verbose', severity: 'assertive' } as const),
 * });
 *
 * // CngxTypeahead (soft, polite)
 * private readonly announceCommitError = createCommitErrorAnnouncer({
 *   deps: { announcer, commitErrorMessage: core.commitErrorMessage, softAnnounce: core.announce },
 *   policy: signal({ kind: 'soft' } as const),
 * });
 *
 * // Inside onError:
 * // this.announceCommitError(err);
 * ```
 *
 * @category interactive
 */
export interface CngxCommitErrorAnnouncerOptions {
  readonly deps: CngxCommitErrorAnnounceDeps;
  readonly policy: Signal<CngxCommitErrorAnnouncePolicy>;
}

export function createCommitErrorAnnouncer(
  opts: CngxCommitErrorAnnouncerOptions,
): (err: unknown) => void {
  return (err: unknown): void => {
    const p = opts.policy();
    if (p.kind === 'verbose') {
      opts.deps.announcer.announce(opts.deps.commitErrorMessage(err), p.severity);
      return;
    }
    // soft: announce null/removed via configured formatter — stays polite.
    opts.deps.softAnnounce(null, 'removed', 0, false);
  };
}

/**
 * Factory-signature matching {@link createCommitErrorAnnouncer} — used
 * by {@link CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY} for DI-swappable
 * error-announce implementations (telemetry probes, locale wrapping,
 * test doubles).
 *
 * @category interactive
 */
export type CngxCommitErrorAnnouncerFactory = (
  options: CngxCommitErrorAnnouncerOptions,
) => (err: unknown) => void;

/**
 * Override-capable factory for the scalar-commit error-announce path.
 * Defaults to {@link createCommitErrorAnnouncer}. Override via
 * `providers` / `viewProviders` to layer telemetry, locale injection,
 * or test doubles without forking the variant components.
 *
 * Symmetrical to the other select-family factory tokens
 * (`CNGX_SELECTION_CONTROLLER_FACTORY`, `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`,
 * `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`, `CNGX_DISPLAY_BINDING_FACTORY`,
 * `CNGX_TEMPLATE_REGISTRY_FACTORY`).
 *
 * @category interactive
 */
export const CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY =
  new InjectionToken<CngxCommitErrorAnnouncerFactory>(
    'CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY',
    { providedIn: 'root', factory: () => createCommitErrorAnnouncer },
  );
