import type { WritableSignal } from '@angular/core';

import type { CngxCommitController } from './commit-controller.token';
import type { CngxSelectOptionDef } from './option.model';

/**
 * The part of a select composite's core that a commit handler reads: the
 * commit controller, the row marker of the option being committed, option
 * lookup and the live-region announce. `ArrayCommitHandlerOptions.core` and
 * `ScalarCommitHandlerOptions.core` are typed to it, so a handler from
 * `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` or `CNGX_SCALAR_COMMIT_HANDLER_FACTORY`
 * compiles against exactly what the default handlers use.
 *
 * Retry routing and the commit record above the controller stay internal;
 * swap `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` to change how a commit runs.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/commit-handler-core.ts
 * @since 0.1.0
 * @relatedTo CNGX_ARRAY_COMMIT_HANDLER_FACTORY, CNGX_SCALAR_COMMIT_HANDLER_FACTORY, CNGX_SELECT_COMMIT_CONTROLLER_FACTORY
 */
export interface CngxCommitHandlerCore<T, TCommit> {
  /** Commit state machine of the composite, from `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`. */
  readonly commitController: CngxCommitController<TCommit>;
  /**
   * Option whose commit is pending; drives the row spinner and names the
   * option in the commit-error slot. Set it before a begin, `null` it on
   * success.
   */
  readonly togglingOption: WritableSignal<CngxSelectOptionDef<T> | null>;
  /** Option for `value` among the merged options, `null` when none matches. */
  findOption(value: T): CngxSelectOptionDef<T> | null;
  /**
   * Announce a selection change via the live region. Cascade:
   * per-instance > config > default. `'reordered'` accepts
   * `fromIndex`/`toIndex`; `'created'` is fired by action organisms.
   */
  announce(
    option: CngxSelectOptionDef<T> | null,
    action: 'added' | 'removed' | 'reordered' | 'created',
    count: number,
    multi: boolean,
    fromIndex?: number,
    toIndex?: number,
  ): void;
}
