import { signal, untracked, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type { CngxSelectCommitAction, CngxSelectCommitMode } from '../commit-action.types';
import type { CngxCommitController } from '../commit-controller.token';
import type { CngxSelectOptionDef } from '../option.model';

/**
 * Kind of a commit the ledger records. Retry replays the recorded kind,
 * never the kind some handler saw last.
 *
 * @internal
 */
export type CommitKind = 'select' | 'toggle' | 'clear' | 'reorder' | 'tree';

/**
 * Read model of the last commit begun through the ledger.
 *
 * @internal
 */
export interface CommitRecord<TCommit, TOption = unknown> {
  readonly kind: CommitKind;
  readonly intended: TCommit | undefined;
  readonly previous: TCommit | undefined;
  /** Option the commit belongs to; `null` for clear and tree commits. */
  readonly option: CngxSelectOptionDef<TOption> | null;
  /** Kind-specific detail (`{ fromIndex, toIndex }` for a reorder). */
  readonly meta: unknown;
}

/**
 * One begin through the ledger. `V` is the model type the commit writes
 * (`T[]` for the member kinds, `T | undefined` for a scalar).
 *
 * The caller performs the optimistic write of the first begin itself; the
 * ledger re-applies `next` only when a retry replays the commit.
 *
 * @internal
 */
export interface CommitLedgerRequest<TCommit, V extends TCommit | undefined, TOption = unknown> {
  readonly kind: CommitKind;
  readonly next: V;
  readonly previous: V;
  readonly option?: CngxSelectOptionDef<TOption> | null;
  readonly meta?: unknown;
  /** Action of this begin. A retry reads `commitAction` again. */
  readonly action: CngxSelectCommitAction<TCommit>;
  readonly commitAction: Signal<CngxSelectCommitAction<TCommit> | null>;
  readonly value: WritableSignal<V>;
  /** Reconcile and rollback-guard equality of the model. */
  readonly same: (a: V, b: V) => boolean;
  /** Copy written into `value`; members pass a spread so the model never aliases a record. */
  readonly copy?: (v: V) => V;
  readonly commitMode: Signal<CngxSelectCommitMode>;
  readonly onStateChange?: (status: AsyncStatus) => void;
  /** Runs when a retry replays this commit, after the optimistic re-write. */
  readonly onReplay?: () => void;
  /** `previous` is the rollback target the ledger used, the confirmed value for a superseding commit. */
  readonly onSuccess: (final: V, previous: V) => void;
  /** Fires before the rollback. */
  readonly onError?: (err: unknown) => void;
  /** Fires after the ledger restored the rollback target. */
  readonly onRollback?: (restored: V) => void;
  /**
   * Speaks the failure; fires after the rollback. `rolledBack` is `true` only
   * when the ledger restored the rollback target (optimistic mode, no
   * external write during the pending window).
   */
  readonly announceError?: (err: unknown, rolledBack: boolean) => void;
}

/** @internal */
export type CommitLedgerMembersRequest<
  TCommit,
  V extends TCommit | undefined,
  TOption = unknown,
> = CommitLedgerRequest<TCommit, V, TOption> & {
  readonly kind: Exclude<CommitKind, 'select'>;
};

/** @internal */
export type CommitLedgerScalarRequest<
  TCommit,
  V extends TCommit | undefined,
  TOption = unknown,
> = CommitLedgerRequest<TCommit, V, TOption> & {
  readonly kind: 'select' | 'clear';
};

/**
 * The one begin / reconcile / guarded rollback / announce / retry state
 * machine of the select family, layered over whatever
 * `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` returned.
 *
 * @internal
 */
export interface CommitLedger<TCommit, TOption = unknown> {
  /**
   * Last commit begun while it has not succeeded; a superseded commit's
   * record is replaced, a successful one's dropped.
   */
  readonly last: Signal<CommitRecord<TCommit, TOption> | null>;
  /**
   * `current` while nothing is in flight, else the confirmed value: the last
   * model value no pending commit wrote (a success's final value, or the
   * `previous` of a begin with nothing in flight). Never an unconfirmed
   * optimistic value, so a commit that supersedes a pending one rolls back
   * to it.
   */
  baseline<V extends TCommit | undefined>(current: V): V;
  beginMembers<V extends TCommit | undefined>(
    request: CommitLedgerMembersRequest<TCommit, V, TOption>,
  ): void;
  beginScalar<V extends TCommit | undefined>(
    request: CommitLedgerScalarRequest<TCommit, V, TOption>,
  ): void;
  /**
   * Replays the last failed commit through its own request. No-op without
   * one, once it succeeded, or without a bound action.
   */
  retry(): void;
  /**
   * Drops the record without touching the replay. Called when another commit
   * source claims the next commit, which may not run through the ledger.
   */
  release(): void;
}

function sameRecord<TCommit, TOption>(
  a: CommitRecord<TCommit, TOption> | null,
  b: CommitRecord<TCommit, TOption> | null,
): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    a.kind === b.kind &&
    Object.is(a.intended, b.intended) &&
    Object.is(a.previous, b.previous) &&
    Object.is(a.option, b.option) &&
    Object.is(a.meta, b.meta)
  );
}

/**
 * Builds a ledger over `controller`. The controller keeps the async-state
 * slot and the supersede id; the ledger owns the commit record and the
 * model-side reconcile, rollback and retry. Prefer {@link commitLedgerFor}
 * so every handler on one controller shares one ledger.
 *
 * @internal
 */
export function createCommitLedger<TCommit, TOption = unknown>(
  controller: CngxCommitController<TCommit>,
): CommitLedger<TCommit, TOption> {
  const last = signal<CommitRecord<TCommit, TOption> | null>(null, {
    equal: sameRecord,
    ...(typeof ngDevMode !== 'undefined' && ngDevMode ? { debugName: 'commitLedger.last' } : {}),
  });
  // Plain state: only `baseline` reads it, imperatively.
  let confirmed: TCommit | undefined;
  // `confirmed` alone cannot tell "confirmed undefined" from "never settled".
  let settled = false;
  let replayLast: (() => void) | null = null;

  const settle = (value: TCommit | undefined): void => {
    settled = true;
    confirmed = value;
  };

  const baseline = <V extends TCommit | undefined>(current: V): V =>
    settled && untracked(controller.isCommitting) ? (confirmed as V) : current;

  const run = <V extends TCommit | undefined>(
    req: CommitLedgerRequest<TCommit, V, TOption>,
    action: CngxSelectCommitAction<TCommit>,
    replay: boolean,
  ): void => {
    const copy = req.copy ?? ((v: V) => v);
    const reconcile = (target: V): void => {
      if (!req.same(req.value(), target)) {
        req.value.set(copy(target));
      }
    };
    const { next } = req;
    // A superseded commit never confirmed its value: roll back past it.
    const previous = baseline(req.previous);
    if (!untracked(controller.isCommitting)) {
      settle(previous);
    }
    const mode = req.commitMode();
    if (replay) {
      if (mode === 'optimistic') {
        reconcile(next);
      }
      req.onReplay?.();
    }
    last.set({
      kind: req.kind,
      intended: next,
      previous,
      option: req.option ?? null,
      meta: req.meta,
    });
    const record = untracked(last);
    const replayCommit = (): void => {
      const current = untracked(req.commitAction);
      if (current) {
        run({ ...req, previous }, current, true);
      }
    };
    replayLast = replayCommit;
    req.onStateChange?.('pending');
    controller.begin(action, next, previous, {
      onSuccess: (committed) => {
        // A confirmed commit has nothing to retry; a later begin owns the slot.
        if (replayLast === replayCommit) {
          replayLast = null;
        }
        if (untracked(last) === record) {
          last.set(null);
        }
        req.onStateChange?.('success');
        // `null` is a legitimate server result (a `??` would drop it); only a
        // missing one falls back to the intended value.
        const hasResult = committed !== undefined;
        const final = (hasResult ? committed : next) as V;
        reconcile(final);
        settle(final);
        req.onSuccess(final, previous);
      },
      onError: (err, rollbackTo) => {
        req.onStateChange?.('error');
        req.onError?.(err);
        // An external write during the pending window wins over the stale
        // rollback snapshot: roll back only while the model still holds the
        // optimistic value this commit wrote.
        const rollBack = mode === 'optimistic' && req.same(req.value(), next);
        if (rollBack) {
          const restored = (rollbackTo ?? previous) as V;
          reconcile(restored);
          req.onRollback?.(restored);
        }
        req.announceError?.(err, rollBack);
      },
    });
  };

  return {
    last: last.asReadonly(),
    baseline,
    beginMembers: (request) => run(request, request.action, false),
    beginScalar: (request) => run(request, request.action, false),
    retry: () => replayLast?.(),
    release: () => last.set(null),
  };
}

const LEDGERS = new WeakMap<object, CommitLedger<unknown, unknown>>();

/**
 * The ledger bound to `controller`, created on first use. Handlers that only
 * receive the controller (the public reorder options) reach the same ledger
 * as the select core that built it.
 *
 * @internal
 */
export function commitLedgerFor<TCommit, TOption = unknown>(
  controller: CngxCommitController<TCommit>,
): CommitLedger<TCommit, TOption> {
  const existing = LEDGERS.get(controller);
  if (existing) {
    return existing as unknown as CommitLedger<TCommit, TOption>;
  }
  const ledger = createCommitLedger<TCommit, TOption>(controller);
  LEDGERS.set(controller, ledger as unknown as CommitLedger<unknown, unknown>);
  return ledger;
}
