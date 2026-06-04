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
 * Wrap a `(node) => TContext` builder so identical results return the
 * same reference. Keyed by the node object via `WeakMap`, so step-list
 * re-emits drop stale entries automatically. The structural comparison
 * is shallow because every context shape is a flat object.
 *
 * @internal
 */
function memoizeByNode<TContext extends object>(
  build: (node: CngxStepNode) => TContext,
): (node: CngxStepNode) => TContext {
  const cache = new WeakMap<CngxStepNode, TContext>();
  return (node) => {
    const next = build(node);
    const prev = cache.get(node);
    if (prev !== undefined && shallowEqual(prev, next)) {
      return prev;
    }
    cache.set(node, next);
    return next;
  };
}

/** @internal */
function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) {
    return true;
  }
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) {
    return false;
  }
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  for (const k of keysA) {
    if (ra[k] !== rb[k]) {
      return false;
    }
  }
  return true;
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

  // Memoize per-node so identical contexts return the same reference.
  // *ngTemplateOutlet pays an ngOnChanges shallow comparison on its
  // `context:` binding every CD pass; without this cache the outlet
  // sees a fresh literal each tick and re-pushes context to the
  // embedded view even when no source signal changed. Cache keys are
  // the node objects themselves so the WeakMap evicts naturally with
  // step-list re-emits.
  const indicatorContextFor = memoizeByNode<CngxStepIndicatorContext>((node) => {
    const position = node.flatIndex + 1;
    return {
      $implicit: position,
      position,
      node,
      active: isActive(node),
      status: node.state(),
      busy: isStepBusy(node),
    };
  });

  const badgeContextFor = memoizeByNode<CngxStepBadgeContext>((node) => {
    const aggregator = node.errorAggregator?.();
    const count = aggregator?.errorCount() ?? 0;
    return { count, node };
  });

  const busySpinnerContextFor = memoizeByNode<CngxStepBusySpinnerContext>((node) => ({ node }));

  const rejectionContextFor = memoizeByNode<CngxStepRejectionContext>((node) => {
    const failedIndex = node.flatIndex;
    const originIdx = presenter.originIndexDuringCommit();
    const originLabel = originIdx !== undefined ? stepsOnly()[originIdx]?.label() : undefined;
    return { failedIndex, originLabel, node };
  });

  const groupHeaderContextFor = memoizeByNode<CngxStepGroupHeaderContext>((node) => ({
    group: node,
    expanded: true,
    status: node.state(),
  }));

  const stepLabelContextFor = memoizeByNode<CngxStepLabelContext>((node) => ({
    node,
    index: node.flatIndex + 1,
    active: isActive(node),
    busy: isStepBusy(node),
    disabled: node.disabled(),
  }));

  // Independent builder + independent cache: content + label contexts
  // share a shape today but the slot directives are separate contracts
  // (CngxStepContentContext vs CngxStepLabelContext) and will diverge
  // when one side gains a field. Aliasing the function would couple
  // both call sites to that future divergence.
  const stepContentContextFor = memoizeByNode<CngxStepContentContext>((node) => ({
    node,
    index: node.flatIndex + 1,
    active: isActive(node),
    busy: isStepBusy(node),
    disabled: node.disabled(),
  }));

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
