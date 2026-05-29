import { computed, InjectionToken, signal, type Signal, type TemplateRef } from '@angular/core';
import type { MatStep } from '@angular/material/stepper';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';
import type { CngxStepRegistration, CngxStepStatus } from '@cngx/common/stepper';

/**
 * Shared `signal(undefined)` constant used as the `errorAggregator`
 * slot for every Material-instrumented step handle. The
 * instrumentation path does not bind cngx error-aggregation per
 * `MatStep` - Material's own visual error surface (driven by
 * `MatStep.hasError` / `MatStep.optional`) stays authoritative - so
 * per-step allocation of a writable signal would be dead capacity.
 *
 * @internal
 */
const NO_ERROR_AGGREGATOR: Signal<CngxErrorAggregatorContract | undefined> = signal<
  CngxErrorAggregatorContract | undefined
>(undefined).asReadonly();

/**
 * Wiring bundle returned from {@link createMatStepHandle}. The
 * instrumentation directive holds the bundle in a `Map<MatStep,
 * Setup>` for diff-only registry churn; only `handle` is exposed to
 * the presenter.
 */
export interface CngxMatStepHandleSetup {
  readonly handle: CngxStepRegistration;
}

/**
 * Best-effort static-text extraction from a `<ng-template matStepLabel>`
 * `TemplateRef`. Used as a label fallback when consumers project a
 * template label without setting `MatStep.label` or
 * `MatStep.ariaLabel` - without it the cngx-side label slot would
 * be empty, leaving aria-label phrases that include the step label
 * with a measurable gap on the Material variant. Static markup
 * (`<ng-template matStepLabel>Review</ng-template>`) extracts cleanly
 * via a detached embedded view; templates with dynamic interpolation
 * fall through (the detached view's CD has no consumer-context
 * bindings) and the caller's deterministic id-based fallback wins.
 *
 * Idempotent: never mutates the source template; the embedded view is
 * created and destroyed inside one frame's worth of synchronous work.
 *
 * @internal
 */
function readMatStepLabelTemplateText(template: TemplateRef<unknown>): string | undefined {
  try {
    const view = template.createEmbeddedView({});
    try {
      view.detectChanges();
      const text = view.rootNodes
        .map((node: Node) => node.textContent ?? '')
        .join('')
        .trim();
      return text || undefined;
    } finally {
      view.destroy();
    }
  } catch {
    return undefined;
  }
}

/**
 * Translates a Material `MatStep` into a cngx
 * {@link CngxStepRegistration}.
 *
 * - `id` - always a fresh `idSeed()` value. Mirrors the tabs
 *   instrumentation handle: a label-keyed id would collide when
 *   two steps share a label.
 * - `kind` - fixed at `'step'`. The instrumentation path does not
 *   project nested `<mat-step>` groups (Material's stepper has no
 *   group-of-steps concept; group-aware semantics belong to the
 *   `<cngx-stepper>` thin-wrapper organism).
 * - `label` - snapshot signal resolved through a four-tier fallback at
 *   registration time so cngx-side phrases (announcements,
 *   `aria-label` composition, telemetry) never read empty when
 *   Material consumers project a `<ng-template matStepLabel>`:
 *   1. `MatStep.label` when it is a plain string - the canonical
 *      shape and the only one that emits a runtime change Material
 *      itself observes.
 *   2. `MatStep.ariaLabel` when the consumer set the input -
 *      designed exactly as the substitute for template labels.
 *   3. Static-text read from `MatStep.stepLabel.template` via a
 *      throwaway detached `EmbeddedViewRef` ({@link readMatStepLabelTemplateText}).
 *      Captures literal `matStepLabel` markup; dynamic interpolation
 *      bails through to (4).
 *   4. `Step <id>` - deterministic, derived from the cngx handle
 *      id. Always non-empty.
 *   Documented limitation: runtime label changes do not propagate.
 *   CDK's `CdkStep` does not expose a `_stateChanges` Subject
 *   analogous to `MatTab._stateChanges`, so cngx cannot re-trigger
 *   the snapshot when Material flips the input later. Surface the
 *   same Material-internal coupling family typed in
 *   `MaterialPrivateSurfaces.CompletedOverrideSource`.
 * - `disabled` - fixed `false`. Material owns step gating via
 *   `linear` + `editable` + `completed`; surfacing a cngx-side
 *   `disabled` would duplicate Material's own click-time enforcement
 *   and is ignored by `<mat-stepper>` itself.
 * - `state` - `computed()` over `MatStep.hasError` / `MatStep.completed`.
 *   `CdkStep.completed`'s getter reads `_completedOverride()` - a
 *   `WritableSignal<boolean | null>` typed in
 *   `MaterialPrivateSurfaces.CompletedOverrideSource`. The cngx
 *   computed transitively tracks that signal through the getter and
 *   re-fires whenever Material flips completion. `hasError` is a
 *   plain property setter on `CdkStep`, NOT a Signal - a `hasError`
 *   write that is not paired with a `completed` change does not
 *   re-trigger this computed. In practice Material wizards write the
 *   two together (`step.hasError = true; step.completed = false` in
 *   error-handler patterns and inside Material's own error-state
 *   matchers) so the limitation is benign for the documented usage
 *   pattern.
 * - `errorAggregator` - points at the shared
 *   {@link NO_ERROR_AGGREGATOR} constant.
 *
 * @category ui/mat-stepper
 */
export function createMatStepHandle(
  matStep: MatStep,
  idSeed: () => string,
): CngxMatStepHandleSetup {
  const id = idSeed();
  const labelText = resolveStepLabel(matStep, id);
  const label = signal<string>(labelText).asReadonly();
  const disabled = signal<boolean>(false).asReadonly();
  const state = computed<CngxStepStatus>(() => {
    if (matStep.hasError) {
      return 'error';
    }
    if (matStep.completed) {
      return 'success';
    }
    return 'idle';
  });
  return {
    handle: {
      id,
      kind: 'step',
      label,
      disabled,
      state,
      errorAggregator: NO_ERROR_AGGREGATOR,
    },
  };
}

/**
 * Four-tier label fallback walked once at registration time. See the
 * {@link createMatStepHandle} JSDoc for the full ladder rationale.
 *
 * @internal
 */
function resolveStepLabel(matStep: MatStep, id: string): string {
  const labelInput = matStep.label;
  if (typeof labelInput === 'string' && labelInput.length > 0) {
    return labelInput;
  }
  const ariaLabel = matStep.ariaLabel;
  if (typeof ariaLabel === 'string' && ariaLabel.length > 0) {
    return ariaLabel;
  }
  const tpl = matStep.stepLabel?.template;
  if (tpl) {
    const text = readMatStepLabelTemplateText(tpl);
    if (text) {
      return text;
    }
  }
  return `Step ${id}`;
}

/**
 * Factory signature for {@link createMatStepHandle}. The DI token
 * {@link CNGX_MAT_STEP_HANDLE_FACTORY} resolves to a function with
 * this exact shape - overrides match it identically.
 *
 * @category ui/mat-stepper
 */
export type CngxMatStepHandleFactory = typeof createMatStepHandle;

/**
 * DI token fronting the per-step handle factory used by the
 * `[cngxMatStepper]` instrumentation directive. Default is
 * {@link createMatStepHandle}.
 *
 * Symmetric with the tabs sibling
 * `CNGX_MAT_TAB_HANDLE_FACTORY` and with `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY`
 * - every Material-bridge logic block ships the same swap surface so
 * consumers can layer telemetry, alternate id strategies, or
 * test-environment id keying via `providers` / `viewProviders`
 * without forking the directive.
 *
 * Override capability - the swap surface separates **handle shape**
 * (factory body) from **id keying** (the supplied `idSeed` closure).
 * The directive constructs `idSeed` as `() => nextUid('cngx-mat-step-')`
 * and hands it to the factory as a default suggestion; an override is
 * free to call it, ignore it, or replace it with a server-synced /
 * deterministic-test / consumer-domain id strategy. Both axes are
 * independently swappable from one DI seam.
 *
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_MAT_STEP_HANDLE_FACTORY,
 *     useValue: ((step, idSeed) => {
 *       const setup = createMatStepHandle(step, idSeed);
 *       reportStepRegistered(setup.handle.id);
 *       return setup;
 *     }) satisfies CngxMatStepHandleFactory,
 *   },
 * ]
 * ```
 *
 * @category ui/mat-stepper
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-stepper/material-bridge/handle.ts
 * @since 0.1.0
 */
export const CNGX_MAT_STEP_HANDLE_FACTORY = new InjectionToken<CngxMatStepHandleFactory>(
  'CNGX_MAT_STEP_HANDLE_FACTORY',
  {
    providedIn: 'root',
    factory: () => createMatStepHandle,
  },
);
