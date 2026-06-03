import { computed, type Signal } from '@angular/core';

import type { CngxStepperI18n } from './i18n/stepper-i18n';
import type { CngxStepNode, CngxStepperHost } from './stepper-host.token';

/**
 * Input bundle for {@link createStepperAnnouncementBuilders}. The presenter
 * surface (commit transition + failed-index signals), the step-only flat
 * projection, and the resolved i18n strings.
 *
 * @internal
 */
export interface CngxStepperAnnouncementBuildersInputs {
  readonly presenter: CngxStepperHost;
  readonly stepsOnly: Signal<readonly CngxStepNode[]>;
  readonly i18n: CngxStepperI18n;
}

/**
 * Reactive SR-announcement surface for the stepper organism: the
 * `aria-live` content for commit lifecycle transitions, the per-step
 * descriptor phrase including the rejected-suffix, and the group rollup
 * phrase. Bundles three small functions the organism's template binds
 * against.
 *
 * @internal
 */
export interface CngxStepperAnnouncementBuilders {
  /**
   * Live-region content driven by the commit transition tracker.
   * Empty string between transitions keeps the region quiet on no-op
   * CD ticks. Error-arm priority: `commitRolledBackTo(originLabel)` when
   * both `lastFailedIndex` and a resolvable origin label exist; otherwise
   * `commitFailedRetry`.
   */
  readonly liveAnnouncement: Signal<string>;
  /**
   * SR descriptor phrase. Aggregator-announced or "Step N of M: <label>";
   * appends `stepRolledBackSuffix` on the rejected row.
   */
  readonly statusPhrase: (node: CngxStepNode) => string;
  /** Group descriptor - rolls up children's aggregated status. */
  readonly groupStatusPhrase: (node: CngxStepNode) => string;
}

/**
 * Build the reactive SR-announcement surface for `<cngx-stepper>`.
 * Lives at Level 2 so the Level-4 organism stays a thin shell per
 * `reference_atomic_decompose`.
 *
 * @internal
 */
export function createStepperAnnouncementBuilders(
  inputs: CngxStepperAnnouncementBuildersInputs,
): CngxStepperAnnouncementBuilders {
  const { presenter, stepsOnly, i18n } = inputs;

  const liveAnnouncement = computed<string>(() => {
    const current = presenter.commitTransition.current();
    if (current === 'pending') {
      return i18n.commitInFlight;
    }
    if (current === 'error') {
      // Sync commit-handler errors collapse pending -> error in one signal
      // flush; tracker sees `previous === 'idle'`. Guard stays loose so
      // sync-rejection (`commitAction = () => false`) still announces.
      const failedIdx = presenter.lastFailedIndex();
      const originIdx = presenter.originIndexDuringCommit();
      if (failedIdx !== undefined && originIdx !== undefined) {
        const originLabel = stepsOnly()[originIdx]?.label();
        if (originLabel) {
          return i18n.commitRolledBackTo(originLabel);
        }
      }
      return i18n.commitFailedRetry;
    }
    return '';
  });

  const statusPhrase = (node: CngxStepNode): string => {
    const aggregator = node.errorAggregator?.();
    let base = aggregator?.shouldShow?.() ? (aggregator.announcement?.() ?? '') : '';
    if (!base && node.kind === 'step') {
      const idx = node.flatIndex;
      if (idx >= 0) {
        base = i18n.selectedStep(node.label(), idx + 1, stepsOnly().length);
      }
    }
    if (!base) {
      return '';
    }
    return node.kind === 'step' && node.flatIndex === presenter.lastFailedIndex()
      ? `${base} ${i18n.stepRolledBackSuffix}`
      : base;
  };

  const groupStatusPhrase = (node: CngxStepNode): string => {
    const status = node.state();
    if (status === 'error') {
      return i18n.stepErrored;
    }
    if (status === 'success') {
      return i18n.stepCompleted;
    }
    return '';
  };

  return { liveAnnouncement, statusPhrase, groupStatusPhrase };
}
