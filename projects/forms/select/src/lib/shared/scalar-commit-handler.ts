import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { AsyncStatus } from '@cngx/core/utils';

import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn, CngxSelectCore } from './select-core';

/**
 * Configuration for {@link createScalarCommitHandler}.
 *
 * @category interactive
 */
export interface ScalarCommitHandlerOptions<T> {
  /** Component's primary scalar value signal. */
  readonly value: WritableSignal<T | undefined>;
  /** Scalar equality used for value reconciliation + rollback suppression. */
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  /** Optimistic vs pessimistic commit UX. */
  readonly commitMode: Signal<CngxSelectCommitMode>;
  /**
   * Select-core handle — factory reads `commitController`, `togglingOption`,
   * and `findOption` from it. Keeps the factory value-shape-agnostic
   * beyond the single-`T` scalar commitment.
   */
  readonly core: CngxSelectCore<T, T>;
  /** Current commit action. Used by `retryLast` to replay. */
  readonly commitAction: Signal<CngxSelectCommitAction<T> | null>;
  /**
   * Last successfully committed snapshot. Consumer owns this field and
   * updates it *before* invoking `beginCommit` so `retryLast` can replay
   * against the correct rollback target.
   */
  readonly getLastCommitted: () => T | undefined;
  /**
   * Called after a successful commit OR after a `finalizeSelection`
   * (non-commit path). Consumer emits the variant's change-event
   * payload (`selectionChange`, `created`, …) + announcer-added there
   * — the factory stays agnostic to both shapes so `CngxSelect`,
   * `CngxTypeahead`, and `CngxActionSelect` can share this factory
   * without harmonising their change-event interfaces.
   */
  readonly onCommitFinalize: (
    option: CngxSelectOptionDef<T>,
    finalValue: T,
    previousValue: T | undefined,
  ) => void;
  /**
   * Called on error after rollback. Consumer routes through the
   * variant's commit-error announcer — `CngxSelect` uses assertive
   * verbose policy, `CngxTypeahead` uses soft-polite. The factory
   * doesn't care which one; it just calls this hook.
   */
  readonly onCommitError: (err: unknown) => void;
  /** State-transition hook for the consumer's `stateChange` output. */
  readonly onStateChange: (status: AsyncStatus) => void;
  /** Error-forward hook for the consumer's `commitError` output. */
  readonly onError: (err: unknown) => void;
  /**
   * Optional — mirror the committed value into an `<input>` element
   * for variants that combine scalar selection with live input text
   * (`CngxTypeahead`, `CngxActionSelect`). Called on success AND on
   * rollback (with `undefined` when rolling back to empty). Button-
   * trigger variants (`CngxSelect`) leave this undefined.
   */
  readonly onValueWrite?: (value: T | undefined) => void;
}

/**
 * API returned from {@link createScalarCommitHandler}.
 *
 * @category interactive
 */
export interface ScalarCommitHandler<T> {
  /**
   * Start a commit for a scalar pick. The handler drives the
   * pending/success/error state-machine, value reconciliation on
   * success, rollback on error in optimistic mode, and the
   * finalize-callback dispatch. The consumer is responsible for the
   * optimistic `value.set(intended)` + `togglingOption.set(option)`
   * *before* calling this (matches the multi-select array handler's
   * responsibility split).
   */
  beginCommit(
    intended: T,
    previous: T | undefined,
    action: CngxSelectCommitAction<T>,
  ): void;
  /**
   * Finalize a non-commit selection (no `commitAction` bound). Writes
   * the component's primary value, mirrors into input text when
   * `onValueWrite` is wired, then invokes `onCommitFinalize` for the
   * variant's change-event emission. Equivalent to the previously
   * inline `finalizeSelection` method on `CngxActionSelect` /
   * `CngxTypeahead` / `CngxSelect`.
   */
  finalizeSelection(
    intended: T,
    option: CngxSelectOptionDef<T>,
    previousValue: T | undefined,
  ): void;
  /**
   * Replay the last failed commit. Reads `commitController.intendedValue()`
   * + `commitAction()` + `getLastCommitted()`. No-op when the
   * preconditions are unmet (no action bound, nothing intended).
   */
  retryLast(): void;
}

/**
 * Factory for the scalar-shape commit flow shared by `CngxActionSelect`
 * (initial consumer) and — as follow-up migrations — `CngxSelect` /
 * `CngxTypeahead`. Absorbs the bit-identical `beginCommit` +
 * `finalizeSelection` + `retryCommit` triad those variants carry inline
 * (~60 LOC per component).
 *
 * **Why a scalar twin now.** The earlier array-commit-handler note
 * recorded that a scalar twin had been considered and rejected on the
 * grounds of per-variant divergence (popover-close timing, announcer
 * severity, input-text mirroring). Two developments tipped that call:
 *   - `CngxActionSelect` added a third scalar consumer with the exact
 *     same triad, so the cost of the duplication is no longer 2× but
 *     3× and growing.
 *   - The three points of divergence are trivially handled by callbacks
 *     (`onCommitError` for announcer severity, `onValueWrite` for input
 *     mirroring) OR kept at the call site (popover-close timing is
 *     consumer-driven — the handler never closes anything).
 *
 * **Responsibility split.** Handler owns the commit-controller lifecycle
 * (pending/success/error state emits, value reconciliation via the
 * compareWith guard, `togglingOption.set(null)` on success, rollback on
 * error in optimistic mode). Consumer owns value-shape emissions
 * (`selectionChange` payloads, `announcer.announce(...)`, popover close
 * decisions) through the finalize callbacks — keeps the family's
 * per-variant change-event interfaces out of shared code.
 *
 * **Scope today.** Only `CngxActionSelect` wires this factory. Follow-up
 * commits migrate `CngxSelect` and `CngxTypeahead` once the factory has
 * soaked in production. Both migrations are mechanical (replace inline
 * triad with DI-injected handler calls) — the only per-variant
 * divergence at the handler boundary is the `onCommitError` callback
 * routing, which each variant already owns today.
 *
 * @category interactive
 */
export function createScalarCommitHandler<T>(
  opts: ScalarCommitHandlerOptions<T>,
): ScalarCommitHandler<T> {
  const commitController = opts.core.commitController;
  const togglingOption = opts.core.togglingOption;

  const reconcileValue = (target: T | undefined): void => {
    const eq = opts.compareWith() as CngxSelectCompareFn<unknown>;
    if (!eq(opts.value(), target)) {
      opts.value.set(target);
    }
  };

  const mirrorWrite = (value: T | undefined): void => {
    opts.onValueWrite?.(value);
  };

  const finalizeSelection = (
    intended: T,
    option: CngxSelectOptionDef<T>,
    previousValue: T | undefined,
  ): void => {
    opts.value.set(intended);
    mirrorWrite(intended);
    opts.onCommitFinalize(option, intended, previousValue);
  };

  const beginCommit = (
    intended: T,
    previous: T | undefined,
    action: CngxSelectCommitAction<T>,
  ): void => {
    opts.onStateChange('pending');
    const mode = opts.commitMode();
    commitController.begin(action, intended, previous, {
      onSuccess: (committed) => {
        opts.onStateChange('success');
        const finalValue = committed ?? intended;
        reconcileValue(finalValue);
        togglingOption.set(null);
        mirrorWrite(finalValue);
        const opt = opts.core.findOption(finalValue);
        if (opt) {
          opts.onCommitFinalize(opt, finalValue, previous);
        }
      },
      onError: (err, rollbackTo) => {
        opts.onStateChange('error');
        opts.onError(err);
        if (mode === 'optimistic') {
          const rollback = (rollbackTo ?? undefined) as T | undefined;
          reconcileValue(rollback);
          mirrorWrite(rollback);
        }
        opts.onCommitError(err);
      },
    });
  };

  const retryLast = (): void => {
    const intendedNext = commitController.intendedValue();
    const action = opts.commitAction();
    if (!action || intendedNext === undefined) {
      return;
    }
    beginCommit(intendedNext as T, opts.getLastCommitted(), action);
  };

  return { beginCommit, finalizeSelection, retryLast };
}

/**
 * Factory-signature type — mirrors {@link createScalarCommitHandler} so
 * DI overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxScalarCommitHandlerFactory = <T>(
  opts: ScalarCommitHandlerOptions<T>,
) => ScalarCommitHandler<T>;

/**
 * DI token resolving the factory used to instantiate a
 * {@link ScalarCommitHandler}. Defaults to
 * {@link createScalarCommitHandler}; override app-wide via `providers:
 * [{ provide: CNGX_SCALAR_COMMIT_HANDLER_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to wrap the default with
 * retry-with-backoff, offline-queue persistence, audit logging or
 * telemetry — without forking any scalar select-family component.
 *
 * Symmetrical to `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` (sibling factory
 * covering the array-shape variants); one layer above
 * `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` (which controls the
 * lower-level state-machine this factory orchestrates).
 *
 * @category interactive
 */
export const CNGX_SCALAR_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxScalarCommitHandlerFactory>(
    'CngxScalarCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createScalarCommitHandler,
    },
  );
