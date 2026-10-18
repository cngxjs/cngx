import { computed, untracked, type Signal } from '@angular/core';

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
   * (`flatIndex === lastFailedIndex`), refused or failed alike. The
   * commit-rejection marker your pessimistic / optimistic flows hit.
   */
  readonly isRejected: (node: CngxStepNode) => boolean;

  /**
   * `true` when this step carries the rejection marker AND the commit
   * action refused it (`lastOutcome().kind === 'refused'`). A refusal is
   * not an error: it marks the step but never sets `aria-invalid` or
   * counts towards {@link errorCount}.
   */
  readonly isRefused: (node: CngxStepNode) => boolean;

  /**
   * Badge-level error: per-step `state === 'error'` OR the bound error
   * aggregator's `shouldShow()`. Deliberately excludes commit rejection -
   * the classic skin renders rejection through its own dedicated slot, so
   * folding it in here would double-render the icon.
   */
  readonly hasErrorBadge: (node: CngxStepNode) => boolean;

  /**
   * Visual marker predicate - the hook the minimal skins (dot / text /
   * progress-bar) and the mobile dots paint (`data-state="error"`,
   * `--error`). `true` when {@link hasErrorBadge} fires OR the step carries
   * a commit rejection of either kind ({@link isRejected}). Those skins have
   * no separate rejection slot, so every marker shares one visual state.
   */
  readonly hasErrorMarker: (node: CngxStepNode) => boolean;

  /**
   * Semantic error predicate - what `aria-invalid`, the errored status word
   * and {@link errorCount} read. `true` when {@link hasErrorBadge} fires OR
   * a commit failed on this step. A refused step is marked
   * ({@link hasErrorMarker}) but not in error.
   */
  readonly hasError: (node: CngxStepNode) => boolean;

  /** Count of step-only nodes where {@link hasError} is `true`. */
  readonly errorCount: Signal<number>;

  /** Flat index of the first errored step, or `-1` when none. */
  readonly firstErrorIndex: Signal<number>;

  /** `true` when `errorCount() > 0`. Drives skin-level `aria-invalid`. */
  readonly hasAnyError: Signal<boolean>;

  /** Count of step-only nodes where {@link hasErrorMarker} is `true`. */
  readonly errorMarkerCount: Signal<number>;

  /** Flat index of the first marked step, or `-1` when none. */
  readonly firstErrorMarkerIndex: Signal<number>;

  /**
   * `true` when `errorMarkerCount() > 0`. Drives skin-level visual hooks
   * (`data-state="error"`); `aria-invalid` stays on {@link hasAnyError}.
   */
  readonly hasAnyErrorMarker: Signal<boolean>;
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

  const isRefused = (node: CngxStepNode): boolean =>
    isRejected(node) && presenter.lastOutcome()?.kind === 'refused';

  const hasErrorMarker = (node: CngxStepNode): boolean => hasErrorBadge(node) || isRejected(node);

  const hasError = (node: CngxStepNode): boolean =>
    hasErrorBadge(node) || (isRejected(node) && !isRefused(node));

  const erroredSteps = computed<readonly CngxStepNode[]>(() =>
    stepsOnly().filter((node) => hasError(node)),
  );

  const errorCount = computed<number>(() => erroredSteps().length);

  const firstErrorIndex = computed<number>(() => erroredSteps()[0]?.flatIndex ?? -1);

  const hasAnyError = computed<boolean>(() => errorCount() > 0);

  const markedSteps = computed<readonly CngxStepNode[]>(() =>
    stepsOnly().filter((node) => hasErrorMarker(node)),
  );

  const errorMarkerCount = computed<number>(() => markedSteps().length);

  const firstErrorMarkerIndex = computed<number>(() => markedSteps()[0]?.flatIndex ?? -1);

  const hasAnyErrorMarker = computed<boolean>(() => errorMarkerCount() > 0);

  return {
    statusOf,
    isBusy,
    isRejected,
    isRefused,
    hasErrorBadge,
    hasErrorMarker,
    hasError,
    errorCount,
    firstErrorIndex,
    hasAnyError,
    errorMarkerCount,
    firstErrorMarkerIndex,
    hasAnyErrorMarker,
  };
}

/**
 * Aggregate error phrase shared by the minimal skins (text / progress-bar)
 * and the classic mobile-collapse text branch. Walks the marked steps
 * ({@link CngxStepperStateView.hasErrorMarker}). A single marked step names
 * itself with the word of its kind: `"Payment: Errored"` (or the custom
 * reason) for an error, `"Payment: Not allowed"` for a refused step change;
 * several collapse to the i18n count phrase (`"2 errors"`). Returns `''`
 * when no step is marked, so the error line stays quiet.
 *
 * The optional `messageOf` resolver lets callers surface a per-step
 * reason (a direct `[error]` string or the first aggregator label) in the
 * single-error case instead of the generic `errored` status word. The
 * reason is still prefixed with the step label (`"Payment: Card declined"`),
 * because the summary line stays visible while another step is active and
 * a bare reason would read as belonging to the active step. When
 * omitted - or when it returns `undefined`/`''` - the helper produces
 * byte-identical output to the no-resolver form, so existing callers
 * (the classic mobile-collapse summary) are a guaranteed no-op.
 *
 * Pure helper - reads signals at call time, intended to be wrapped in the
 * caller's `computed()`. The phrase feeds live regions, so the step label
 * is read untracked: a label that follows a language switch must not
 * re-announce the line. Pass the i18n bundle as an untracked snapshot for
 * the same reason.
 *
 * @category common/stepper
 * @since 0.1.0
 */
export function resolveStepperErrorSummary(
  view: Pick<
    CngxStepperStateView,
    'errorMarkerCount' | 'firstErrorMarkerIndex' | 'isRefused' | 'hasErrorBadge'
  >,
  stepsOnly: Signal<readonly CngxStepNode[]>,
  i18n: CngxStepperI18n,
  messageOf?: (node: CngxStepNode) => string | undefined,
): string {
  const count = view.errorMarkerCount();
  if (count === 0) {
    return '';
  }
  if (count === 1) {
    const node = stepsOnly()[view.firstErrorMarkerIndex()];
    const detail = node ? summaryDetail(view, node, i18n, messageOf) : i18n.statusLabels.errored;
    const label = node ? untracked(node.label) : undefined;
    return label ? i18n.stepWithDetail(label, detail) : detail;
  }
  return i18n.stepHasErrors(count);
}

/**
 * @internal The word for one marked step: a validation error keeps its
 * reason, a refused-only step reads the refused word.
 */
function summaryDetail(
  view: Pick<CngxStepperStateView, 'isRefused' | 'hasErrorBadge'>,
  node: CngxStepNode,
  i18n: CngxStepperI18n,
  messageOf?: (node: CngxStepNode) => string | undefined,
): string {
  const refusedOnly = view.isRefused(node) && !view.hasErrorBadge(node);
  if (refusedOnly) {
    return i18n.statusLabels.refused;
  }
  const custom = messageOf?.(node);
  return custom !== undefined && custom !== '' ? custom : i18n.statusLabels.errored;
}
