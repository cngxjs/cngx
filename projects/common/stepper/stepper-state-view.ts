import { computed, type Signal } from '@angular/core';

import type { CngxStepperI18n } from './i18n/stepper-i18n';
import type { CngxStepNode, CngxStepperHost, CngxStepStatus } from './stepper-host.token';

/**
 * Per-step + aggregate state derivations shared by every stepper skin.
 *
 * The classic organism historically derived "is this step errored / busy /
 * rejected" inline in {@link createStepperSlotContextBuilders}; the dot,
 * text, and progress-bar variants derived nothing, so a step error (per-step
 * `state`, an error aggregator, or a commit rejection) was structurally
 * invisible in those three. This view is the single source those four skins
 * read from - "Ableitung statt Verwaltung" - so the error contract can never
 * drift between them.
 *
 * @internal
 */
export interface CngxStepperStateView {
  /** Raw step status. Group nodes still report their own `state()`. */
  readonly statusOf: (node: CngxStepNode) => CngxStepStatus;

  /**
   * `true` while a commit is in flight AND targets this step. Mirrors the
   * classic `isStepBusy` predicate.
   */
  readonly isBusy: (node: CngxStepNode) => boolean;

  /**
   * `true` when this step is the one a commit just rejected
   * (`flatIndex === lastFailedIndex`). The commit-rejection arm your
   * pessimistic / optimistic flows hit.
   */
  readonly isRejected: (node: CngxStepNode) => boolean;

  /**
   * Badge-level error: per-step `state === 'error'` OR the bound error
   * aggregator's `shouldShow()`. Deliberately excludes commit rejection -
   * the classic skin renders rejection through its own dedicated slot, so
   * folding it in here would double-render the icon.
   */
  readonly hasErrorBadge: (node: CngxStepNode) => boolean;

  /**
   * Unified error predicate - the contract the minimal skins (dot / text /
   * progress-bar) read. `true` when ANY of the three error sources fires:
   * {@link hasErrorBadge} OR a commit rejection ({@link isRejected}). Those
   * skins have no separate rejection slot, so they treat every error source
   * as one "errored" state.
   */
  readonly hasError: (node: CngxStepNode) => boolean;

  /** Count of step-only nodes where {@link hasError} is `true`. */
  readonly errorCount: Signal<number>;

  /** Flat index of the first errored step, or `-1` when none. */
  readonly firstErrorIndex: Signal<number>;

  /** `true` when `errorCount() > 0`. Drives skin-level `aria-invalid`. */
  readonly hasAnyError: Signal<boolean>;
}

/**
 * Build the shared {@link CngxStepperStateView} over a presenter host and its
 * step-only projection. Pure factory - `computed()` only, no injection
 * context required, so any skin can allocate it in a field initializer.
 *
 * @category common/stepper
 * @since 0.1.0
 * @relatedTo CngxStepperHost, createStepperSlotContextBuilders
 */
export function createStepperStateView(inputs: {
  presenter: CngxStepperHost;
  stepsOnly: Signal<readonly CngxStepNode[]>;
}): CngxStepperStateView {
  const { presenter, stepsOnly } = inputs;

  const statusOf = (node: CngxStepNode): CngxStepStatus => node.state();

  const isBusy = (node: CngxStepNode): boolean =>
    node.kind === 'step' &&
    presenter.commitState.status() === 'pending' &&
    presenter.intendedStepIndex() === node.flatIndex;

  const isRejected = (node: CngxStepNode): boolean =>
    node.kind === 'step' && node.flatIndex >= 0 && node.flatIndex === presenter.lastFailedIndex();

  const hasErrorBadge = (node: CngxStepNode): boolean => {
    if (node.kind !== 'step') {
      return false;
    }
    if (node.state() === 'error') {
      return true;
    }
    return !!node.errorAggregator?.()?.shouldShow?.();
  };

  const hasError = (node: CngxStepNode): boolean => hasErrorBadge(node) || isRejected(node);

  const erroredSteps = computed<readonly CngxStepNode[]>(() =>
    stepsOnly().filter((node) => hasError(node)),
  );

  const errorCount = computed<number>(() => erroredSteps().length);

  const firstErrorIndex = computed<number>(() => erroredSteps()[0]?.flatIndex ?? -1);

  const hasAnyError = computed<boolean>(() => errorCount() > 0);

  return {
    statusOf,
    isBusy,
    isRejected,
    hasErrorBadge,
    hasError,
    errorCount,
    firstErrorIndex,
    hasAnyError,
  };
}

/**
 * Aggregate error phrase shared by the minimal skins (text / progress-bar)
 * and the classic mobile-collapse text branch. A single errored step names
 * itself (`"Payment: Errored"`); several collapse to the i18n count phrase
 * (`"2 errors"`). Returns `''` when no step errored - callers gate on
 * `view.hasAnyError()` so the empty string never reaches the DOM.
 *
 * Pure helper - reads signals at call time, intended to be wrapped in the
 * caller's `computed()`.
 *
 * @category common/stepper
 * @since 0.1.0
 */
export function resolveStepperErrorSummary(
  view: Pick<CngxStepperStateView, 'errorCount' | 'firstErrorIndex'>,
  stepsOnly: Signal<readonly CngxStepNode[]>,
  i18n: CngxStepperI18n,
): string {
  const count = view.errorCount();
  if (count === 0) {
    return '';
  }
  if (count === 1) {
    const node = stepsOnly()[view.firstErrorIndex()];
    const label = node?.label();
    return label ? `${label}: ${i18n.statusLabels.errored}` : i18n.statusLabels.errored;
  }
  return i18n.stepHasErrors(count);
}
