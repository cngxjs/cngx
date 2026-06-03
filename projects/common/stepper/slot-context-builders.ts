import type { Signal } from '@angular/core';

import type { CngxStepBadgeContext } from './slots/step-badge.directive';
import type { CngxStepBusySpinnerContext } from './slots/step-busy-spinner.directive';
import type { CngxStepGroupHeaderContext } from './slots/step-group-header.directive';
import type { CngxStepIndicatorContext } from './slots/step-indicator.directive';
import type { CngxStepRejectionContext } from './slots/step-rejection.directive';
import type { CngxStepContentContext, CngxStepLabelContext } from './step-panel-host.token';
import type { CngxStepNode, CngxStepperHost } from './stepper-host.token';

/**
 * Input bundle for {@link createStepperSlotContextBuilders}: the presenter
 * surface and the step-only flat projection. Builders read both reactively
 * so the produced context objects always reflect current presenter state.
 *
 * @internal
 */
export interface CngxStepperSlotContextBuildersInputs {
  readonly presenter: CngxStepperHost;
  readonly stepsOnly: Signal<readonly CngxStepNode[]>;
}

/**
 * Per-step status / activity / rejection / labelling derivations shared by
 * every slot context shape. The organism reads these through the bundle
 * instead of duplicating the logic next to each `*ContextFor` builder.
 *
 * @internal
 */
export interface CngxStepperSlotContextBuilders {
  readonly isActive: (node: CngxStepNode) => boolean;
  readonly isStepBusy: (node: CngxStepNode) => boolean;
  readonly showRejection: (node: CngxStepNode) => boolean;
  readonly showErrorBadge: (node: CngxStepNode) => boolean;
  readonly indicatorContextFor: (node: CngxStepNode) => CngxStepIndicatorContext;
  readonly badgeContextFor: (node: CngxStepNode) => CngxStepBadgeContext;
  readonly busySpinnerContextFor: (node: CngxStepNode) => CngxStepBusySpinnerContext;
  readonly rejectionContextFor: (node: CngxStepNode) => CngxStepRejectionContext;
  readonly groupHeaderContextFor: (node: CngxStepNode) => CngxStepGroupHeaderContext;
  readonly stepLabelContextFor: (node: CngxStepNode) => CngxStepLabelContext;
  readonly stepContentContextFor: (node: CngxStepNode) => CngxStepContentContext;
}

/**
 * Bundle the six `*ContextFor` slot-context builders plus the small
 * `isActive` / `isStepBusy` / `showRejection` / `showErrorBadge` predicates
 * the organism's template reads. Lives at Level 2 so the `<cngx-stepper>`
 * organism stays a thin shell per `reference_atomic_decompose`.
 *
 * @internal
 */
export function createStepperSlotContextBuilders(
  inputs: CngxStepperSlotContextBuildersInputs,
): CngxStepperSlotContextBuilders {
  const { presenter, stepsOnly } = inputs;

  const isActive = (node: CngxStepNode): boolean =>
    node.kind === 'step' && node.id === presenter.activeStepId();

  const isStepBusy = (node: CngxStepNode): boolean =>
    node.kind === 'step' &&
    presenter.commitState.status() === 'pending' &&
    presenter.intendedStepIndex() === node.flatIndex;

  const showRejection = (node: CngxStepNode): boolean =>
    node.kind === 'step' &&
    node.flatIndex >= 0 &&
    node.flatIndex === presenter.lastFailedIndex();

  const showErrorBadge = (node: CngxStepNode): boolean => {
    if (node.kind !== 'step') {
      return false;
    }
    if (node.state() === 'error') {
      return true;
    }
    return !!node.errorAggregator?.()?.shouldShow?.();
  };

  const indicatorContextFor = (node: CngxStepNode): CngxStepIndicatorContext => {
    const position = node.flatIndex + 1;
    return {
      $implicit: position,
      position,
      node,
      active: isActive(node),
      status: node.state(),
      busy: isStepBusy(node),
    };
  };

  const badgeContextFor = (node: CngxStepNode): CngxStepBadgeContext => {
    const aggregator = node.errorAggregator?.();
    const count = aggregator?.errorCount() ?? 0;
    return { count, node };
  };

  const busySpinnerContextFor = (node: CngxStepNode): CngxStepBusySpinnerContext => ({ node });

  const rejectionContextFor = (node: CngxStepNode): CngxStepRejectionContext => {
    const failedIndex = node.flatIndex;
    const originIdx = presenter.originIndexDuringCommit();
    const originLabel = originIdx !== undefined ? stepsOnly()[originIdx]?.label() : undefined;
    return { failedIndex, originLabel, node };
  };

  const groupHeaderContextFor = (node: CngxStepNode): CngxStepGroupHeaderContext => ({
    group: node,
    expanded: true,
    status: node.state(),
  });

  const stepLabelContextFor = (node: CngxStepNode): CngxStepLabelContext => ({
    node,
    index: node.flatIndex + 1,
    active: isActive(node),
    busy: isStepBusy(node),
    disabled: node.disabled(),
  });

  // step-content context shape matches step-label by design - content
  // templates need the same disabled/busy derivations.
  const stepContentContextFor = stepLabelContextFor;

  return {
    isActive,
    isStepBusy,
    showRejection,
    showErrorBadge,
    indicatorContextFor,
    badgeContextFor,
    busySpinnerContextFor,
    rejectionContextFor,
    groupHeaderContextFor,
    stepLabelContextFor,
    stepContentContextFor,
  };
}
