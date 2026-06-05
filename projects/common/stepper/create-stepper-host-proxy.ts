import { computed } from '@angular/core';

import { buildAsyncStateView, type StatusTransition } from '@cngx/core/utils';

import type { CngxStepNode, CngxStepRegistration, CngxStepperHost } from './stepper-host.token';

const EMPTY_NODES: readonly CngxStepNode[] = Object.freeze([]);

/**
 * Builds a live delegating {@link CngxStepperHost} proxy over a supplier
 * signal. Every signal member is a `computed()` reading
 * `supplier()?.<member>()`, every method forwards to
 * `supplier()?.<method>(...)`. This is the spelled-out shape for
 * re-providing an input-derived host through DI - you cannot
 * `useExisting` an `input()` value, so the footer provides this proxy
 * once and it tracks whichever host the supplier currently resolves.
 *
 * **Null-supplier neutral set (the disabled-by-default contract).** When
 * the supplier resolves `null` (a standalone footer with neither `[host]`
 * nor an ambient stepper), every navigation affordance must render
 * *inert*, never falsely enabled: `canGoPrevious` / `canGoNext` collapse
 * to `false` so Back / Next render disabled, and every method is a no-op.
 *
 * `create*` pure factory - no injection context required (`computed()`
 * only). Single consumer (the footer); the surface is load-bearing, not
 * speculative.
 *
 * @category common/stepper
 * @since 0.1.0
 * @relatedTo CngxStepperFooter, CngxStepperHost
 */
export function createStepperHostProxy(supplier: () => CngxStepperHost | null): CngxStepperHost {
  return {
    // Core projection / state - empty / out-of-range when null. The array
    // fallbacks return the shared frozen EMPTY_NODES reference, so no `equal`
    // fn is needed: the output is reference-stable across reads (either the
    // supplier's own structural-equal signal value, or this one constant).
    stepTree: computed(() => supplier()?.stepTree() ?? EMPTY_NODES),
    flatSteps: computed(() => supplier()?.flatSteps() ?? EMPTY_NODES),
    stepsOnly: computed(() => supplier()?.stepsOnly() ?? EMPTY_NODES),
    activeStepIndex: computed(() => supplier()?.activeStepIndex() ?? -1),
    activeStepId: computed(() => supplier()?.activeStepId() ?? null),
    linear: computed(() => supplier()?.linear() ?? false),
    orientation: computed(() => supplier()?.orientation() ?? 'horizontal'),
    intendedStepIndex: computed(() => supplier()?.intendedStepIndex()),
    lastFailedIndex: computed(() => supplier()?.lastFailedIndex()),
    originIndexDuringCommit: computed(() => supplier()?.originIndexDuringCommit()),

    // Bounds + labels - the safety-critical canGo* pair collapses to
    // `false` so a null host yields disabled Back / Next, never clickable.
    stepCount: computed(() => supplier()?.stepCount() ?? 0),
    isFirstStep: computed(() => supplier()?.isFirstStep() ?? true),
    isLastStep: computed(() => supplier()?.isLastStep() ?? true),
    canGoPrevious: computed(() => supplier()?.canGoPrevious() ?? false),
    canGoNext: computed(() => supplier()?.canGoNext() ?? false),
    busy: computed(() => supplier()?.busy() ?? false),
    nextStepLabel: computed(() => supplier()?.nextStepLabel()),
    previousStepLabel: computed(() => supplier()?.previousStepLabel()),

    // Composite members delegate their sub-signals, idle when null. The
    // proxy only forwards - the real tracker is the presenter's, so build
    // the static neutral shape rather than calling createTransitionTracker.
    commitState: buildAsyncStateView<number | undefined>({
      status: computed(() => supplier()?.commitState.status() ?? 'idle'),
      data: computed(() => supplier()?.commitState.data()),
      error: computed(() => supplier()?.commitState.error()),
      lastUpdated: computed(() => supplier()?.commitState.lastUpdated()),
    }),
    commitTransition: {
      current: computed(() => supplier()?.commitTransition.current() ?? 'idle'),
      previous: computed(() => supplier()?.commitTransition.previous() ?? 'idle'),
    } satisfies StatusTransition,

    // Reachability predicate - neutral `false` when null so a header
    // over a missing host is never falsely navigable.
    canNavigateTo: (index: number) => supplier()?.canNavigateTo(index) ?? false,

    // Methods forward; no-op when null.
    select: (index: number) => supplier()?.select(index),
    selectNext: () => supplier()?.selectNext(),
    selectPrevious: () => supplier()?.selectPrevious(),
    selectById: (id: string) => supplier()?.selectById(id),
    reset: () => supplier()?.reset(),
    clearLastFailed: () => supplier()?.clearLastFailed(),
    register: (handle: CngxStepRegistration, parentId?: string | null) =>
      supplier()?.register(handle, parentId),
    unregister: (id: string) => supplier()?.unregister(id),
  };
}
