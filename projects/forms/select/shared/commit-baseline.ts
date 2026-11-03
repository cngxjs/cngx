import type { CngxCommitController } from './commit-controller.token';
import { commitLedgerFor } from './internal/commit-ledger';

/**
 * The confirmed value of a select's commits, shared by every commit handler
 * on one commit controller: the last model value no pending commit wrote.
 * A commit that supersedes a pending one rolls back to it, and reports it as
 * `previous`, instead of the unconfirmed optimistic value in between.
 *
 * The default handlers (`createArrayCommitHandler`, `createScalarCommitHandler`,
 * `createReorderCommitHandler`) already run through it. A
 * full replacement from `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`,
 * `CNGX_SCALAR_COMMIT_HANDLER_FACTORY` or `CNGX_REORDER_COMMIT_HANDLER_FACTORY`
 * that calls the controller's `begin` itself reports its commits here, so
 * its rollback target and the default handlers' agree:
 *
 * ```ts
 * const baseline = createCommitBaseline(opts.core.commitController);
 * const rollbackTo = baseline.begin(previous);
 * controller.begin(action, next, rollbackTo, {
 *   onSuccess: (committed) => {
 *     const final = committed ?? next;
 *     baseline.confirm(final);
 *     opts.onToggleFinalize(option, isNowSelected(final), rollbackTo);
 *   },
 *   onError: (err, restoreTo) => opts.values.set([...(restoreTo ?? rollbackTo)]),
 * });
 * ```
 *
 * It records values only, not the commit itself: Retry routing for a commit
 * that bypasses the default handlers stays with the replacement.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/commit-baseline.ts
 * @since 0.1.0
 * @relatedTo createCommitBaseline, CNGX_ARRAY_COMMIT_HANDLER_FACTORY, CNGX_SCALAR_COMMIT_HANDLER_FACTORY, CNGX_REORDER_COMMIT_HANDLER_FACTORY
 */
export interface CngxCommitBaseline<TCommit> {
  /**
   * Call once per commit, before the controller's `begin`, with the value the
   * commit replaces. Returns the rollback target: the confirmed value while
   * another commit is in flight, else `previous`, which becomes the confirmed
   * value.
   */
  begin<V extends TCommit | undefined>(previous: V): V;
  /** Call from the commit's success with its final value. */
  confirm(value: TCommit | undefined): void;
}

/**
 * The {@link CngxCommitBaseline} of `controller`. Every call with the same
 * controller returns a view on the same state, which the default commit
 * handlers on that controller share, so a replacement handler and the default
 * ones next to it (a reorderable select's toggle and reorder, an action
 * select's pick and create) agree on the confirmed value. No injection context
 * needed.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/commit-baseline.ts
 * @since 0.1.0
 * @relatedTo CngxCommitBaseline, CngxCommitHandlerCore
 */
export function createCommitBaseline<TCommit>(
  controller: CngxCommitController<TCommit>,
): CngxCommitBaseline<TCommit> {
  const ledger = commitLedgerFor<TCommit>(controller);
  return {
    begin: (previous) => ledger.track(previous),
    confirm: (value) => ledger.confirm(value),
  };
}
