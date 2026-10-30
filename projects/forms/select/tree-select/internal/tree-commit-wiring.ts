import { computed, type Signal, type WritableSignal } from '@angular/core';
import type { AsyncStatus } from '@cngx/core/utils';

import type { CngxArrayCommitHandlerFactory } from '../../shared/array-commit-handler';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from '../../shared/commit-action.types';
import type { CngxCommitErrorAnnouncePolicy } from '../../shared/commit-error-announcer';
import {
  cngxSelectDefaultCompare,
  type CngxSelectCompareFn,
  type CngxSelectCore,
} from '../../shared/internal/select-core';
import type { CngxSelectCommitErrorContext } from '../../shared/template-slots';
import type { CngxTreeSelectChange } from '../tree-select.component';
import {
  createTreeToggleDispatch,
  type TreeToggleDispatch,
  type TreeToggleDispatchOptions,
} from './tree-toggle-dispatch';

/**
 * Whether `fn` is a reference comparison, i.e. what the keyed selection
 * already does.
 *
 * @internal
 */
export function isReferenceCompare(fn: unknown): boolean {
  return fn === cngxSelectDefaultCompare || fn === Object.is;
}

/**
 * Inputs of {@link createTreeCommitWiring}. Signals, callbacks and the
 * resolved array handler factory, so the wiring needs no injection context.
 *
 * @internal
 */
export interface TreeCommitWiringOptions<T> {
  readonly values: WritableSignal<T[]>;
  readonly keyFn: Signal<((value: T) => unknown) | undefined>;
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  /** `[cascadeChildren]`. */
  readonly cascade: Signal<boolean>;
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  readonly commitMode: Signal<CngxSelectCommitMode>;
  readonly commitErrorAnnouncePolicy: Signal<CngxCommitErrorAnnouncePolicy>;
  readonly core: CngxSelectCore<T, T[]>;
  readonly treeController: TreeToggleDispatchOptions<T>['treeController'];
  /** Resolved `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`; owns the clear commit. */
  readonly arrayHandlerFactory: CngxArrayCommitHandlerFactory;
  readonly emitChange: (change: Omit<CngxTreeSelectChange<T>, 'source'>) => void;
  readonly emitCleared: () => void;
  readonly emitState: (status: AsyncStatus) => void;
  readonly emitCommitError: (err: unknown) => void;
  /** Runs before a commit-error Retry replays (focus restore). */
  readonly beforeRetry: () => void;
}

/**
 * Commit surface of `CngxTreeSelect`.
 *
 * @internal
 */
export interface TreeCommitWiring<T> {
  /**
   * Member identity: `keyFn` when set, else `compareWith`. Field sync,
   * commit reconcile, the selected-items equal and the active descendant
   * all read it, so no boundary can disagree with the keyed selection.
   */
  readonly memberEquality: Signal<(a: T, b: T) => boolean>;
  /** Toggle / cascade / remove / clear mutations with their commit paths. */
  readonly dispatch: TreeToggleDispatch<T>;
  /** Commit-error slot context; its Retry goes to the handler that started the failed commit. */
  readonly commitErrorContext: Signal<CngxSelectCommitErrorContext<T>>;
}

/**
 * Builds the tree-select commit wiring: the member identity, the
 * commit-error announcer, the array handler that owns the clear commit,
 * the toggle dispatch that owns the tree commits, and the Retry routed to
 * whichever of the two started the last commit.
 *
 * @internal
 */
export function createTreeCommitWiring<T>(opts: TreeCommitWiringOptions<T>): TreeCommitWiring<T> {
  const { core, values } = opts;

  const memberEquality = computed<(a: T, b: T) => boolean>(() => {
    const keyFn = opts.keyFn();
    const eq = opts.compareWith();
    return keyFn ? (a: T, b: T) => keyFn(a) === keyFn(b) : (a: T, b: T) => eq(a, b);
  });

  // `null` when only a custom `compareWith` can tell members apart.
  const memberKey = computed<((value: T) => unknown) | null>(() => {
    const keyFn = opts.keyFn();
    if (keyFn) {
      return keyFn;
    }
    return isReferenceCompare(opts.compareWith()) ? (v: T) => v : null;
  });

  const announceCommitError = core.createCommitErrorAnnouncer({
    policy: opts.commitErrorAnnouncePolicy,
  });

  const commitHandler = core.routeRetryThrough(
    opts.arrayHandlerFactory<T>({
      values,
      compareWith: opts.compareWith,
      commitMode: opts.commitMode,
      core,
      commitAction: opts.commitAction,
      // Tree commits finalize in the dispatch; this handler only clears.
      onToggleFinalize: () => undefined,
      onClearFinalize: (previous, finalValues) => {
        opts.emitCleared();
        opts.emitChange({
          values: finalValues,
          previousValues: previous,
          added: [],
          removed: previous,
          node: null,
          action: 'clear',
        });
      },
      onStateChange: opts.emitState,
      onError: opts.emitCommitError,
      announceError: announceCommitError,
    }),
    ['beginToggle', 'beginClear'],
  );

  const dispatch = createTreeToggleDispatch<T>({
    values,
    membersEqual: (a, b) => memberEquality()(a, b),
    memberKey,
    treeController: opts.treeController,
    cascade: opts.cascade,
    commitAction: opts.commitAction,
    commitMode: opts.commitMode,
    core,
    commitHandler: () => commitHandler,
    emitChange: opts.emitChange,
    emitCleared: opts.emitCleared,
    emitState: opts.emitState,
    emitCommitError: opts.emitCommitError,
    announceCommitError,
  });

  const commitErrorContext = core.bindCommitRetry(() => {
    opts.beforeRetry();
    core.retryLastCommit();
  });

  return { memberEquality, dispatch, commitErrorContext };
}
