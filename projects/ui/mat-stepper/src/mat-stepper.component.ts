import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  inject,
  Injector,
  type Signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import {
  CNGX_STEP_PANEL_HOST,
  CngxStep,
  type CngxStepContentContext,
  type CngxStepLabelContext,
  CngxStepperPresenter,
  CNGX_STEPPER_HOST,
  flatStepsEqual,
  type CngxStepNode,
  type CngxStepPanelHost,
} from '@cngx/common/stepper';
import { CNGX_DIRECTIVE_BY_ID_MAP_FACTORY } from '@cngx/common/tabs';

/**
 * Material-twin stepper organism. Wraps `<mat-stepper>` while sharing
 * the same `CngxStepperPresenter` brain as `<cngx-stepper>`. Material
 * consumers gain commit-action lifecycle, router sync, and error
 * aggregation for free.
 *
 * The presenter owns `activeStepIndex`, `linear`, `orientation`,
 * `commitAction`, `commitMode`; the organism forwards them through
 * `hostDirectives.inputs`. Bidirectional sync between the presenter
 * and Material's own `selectedIndex` runs in a single `effect()` whose
 * writes to `MatStepper.selectedIndex` are wrapped in `untracked()` so
 * neither direction tracks the other's signals — no reactivity loop.
 *
 * Material owns its own keyboard nav (`MatStepperHeader` ARIA) and
 * focus management, so this organism deliberately does NOT compose
 * `CngxRovingTabindex` / `CngxFocusRestore`. Group nodes flatten —
 * `<mat-stepper>` does not support nested steppers — with the depth
 * preserved as a `data-step-depth` hint on the rendered label.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-mat-stepper',
  exportAs: 'cngxMatStepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatStepperModule],
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear', 'orientation', 'commitAction', 'commitMode'],
      outputs: ['activeStepIndexChange'],
    },
  ],
  providers: [{ provide: CNGX_STEP_PANEL_HOST, useExisting: CngxMatStepper }],
  templateUrl: './mat-stepper.component.html',
})
export class CngxMatStepper implements CngxStepPanelHost {
  protected readonly presenter = inject(CNGX_STEPPER_HOST);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  protected readonly matStepper = viewChild.required(MatStepper);

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;
  private readonly stepDirectives = contentChildren(CngxStep, { descendants: true });

  /**
   * Pre-built `Map<id, CngxStep>` so `labelTemplateFor` /
   * `contentTemplateFor` are O(1) per call. Structural `equal`
   * keyed on the id-set + per-id directive identity prevents the
   * map from cascading downstream when `contentChildren` re-emits
   * with an unchanged child set.
   */
  private readonly stepDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.stepDirectives,
  });

  /**
   * Step-only flat projection. Material's `<mat-step>` does not
   * support nesting, so groups flatten into the same level — the
   * presenter's `flatIndex` already gives the linear position.
   * Memoised behind `flatStepsEqual` so downstream consumers
   * (`stepLabel`, panel `@for`, `stepLabelContextFor`) don't
   * re-walk the array on shape-stable re-emits of `flatSteps()`.
   * Sibling-symmetric with `CngxStepper.stepsOnly`
   * (`projects/ui/stepper/src/stepper.component.ts:210-213`) and
   * the presenter's private twin
   * (`projects/common/stepper/src/presenter.directive.ts:186-188`).
   */
  protected readonly stepsOnly: Signal<readonly CngxStepNode[]> = computed(
    () => this.presenter.flatSteps().filter((n) => n.kind === 'step'),
    { equal: flatStepsEqual },
  );

  /** Material orientation literal — narrows our `'horizontal'|'vertical'` to its own union. */
  protected readonly matOrientation = computed<'horizontal' | 'vertical'>(
    () => (this.presenter.orientation() === 'vertical' ? 'vertical' : 'horizontal'),
  );

  protected stepIndexOf(node: CngxStepNode): number {
    return node.flatIndex;
  }

  /** Editability rule — non-linear lets every step click; linear only past completed. */
  protected isEditable(node: CngxStepNode): boolean {
    return !this.presenter.linear() || node.state() === 'success';
  }

  protected hasError(node: CngxStepNode): boolean {
    return node.state() === 'error';
  }

  protected isCompleted(node: CngxStepNode): boolean {
    return node.state() === 'success';
  }

  protected stepLabel(node: CngxStepNode): string {
    return node.label();
  }

  /** Group nodes carry a depth marker so the label can distinguish nested rows. */
  protected stepDepth(node: CngxStepNode): number {
    return node.depth;
  }

  // CngxStepPanelHost contract — O(1) via the pre-built map.
  // Note: only the *cngxStepLabel and *cngxStepContent slots are
  // honoured on this Material twin. The six Phase-3 slot directives
  // (`*cngxStepIndicator` / `*cngxStepBadge` / `*cngxStepBusySpinner`
  // / `*cngxStepRejection` / `*cngxStepGroupHeader` /
  // `*cngxStepperEmpty`) are silently dropped here — Material owns
  // the indicator/badge/busy chrome via `<mat-stepper>`'s own
  // template, and the proper override path on this variant is
  // Material's `<ng-template matStepperIcon>`. See
  // `stepper-accepted-debt.md` §4 for the closure trigger
  // (Phase 5 of `tabs-stepper-cleanup-plan` adds matStepperIcon
  // forwarding).
  labelTemplateFor(id: string): TemplateRef<CngxStepLabelContext> | null {
    return this.stepDirectiveById().get(id)?.labelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<CngxStepContentContext> | null {
    return this.stepDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null;
  }

  /** Build the {@link CngxStepLabelContext} for the projected label template. */
  protected stepLabelContextFor(node: CngxStepNode): CngxStepLabelContext {
    const flatStep = node.flatIndex;
    return {
      node,
      index: flatStep + 1,
      active: node.id === this.presenter.activeStepId(),
      busy:
        this.presenter.commitState.status() === 'pending' &&
        this.presenter.intendedStepIndex() === flatStep,
      disabled: node.disabled(),
    };
  }

  /** Build the {@link CngxStepContentContext} for the projected content template. */
  protected stepContentContextFor(node: CngxStepNode): CngxStepContentContext {
    return this.stepLabelContextFor(node);
  }

  constructor() {
    // Bidirectional sync between `presenter.activeStepIndex` and
    // `MatStepper.selectedIndex`. Delegated to the shared
    // `createMaterialBidirectionalSync` factory in `@cngx/common/data`
    // — same primitive that drives `[cngxMatStepper]` and
    // `[cngxMatTabs]` instrumentation directives. `afterNextRender`
    // is required because the `MatStepper` viewChild isn't resolved
    // until the view commits; the factory installs its `effect()`
    // inside `runInInjectionContext` so the sub-call runs in this
    // organism's injector.
    afterNextRender(() => {
      const stepper = this.matStepper();
      createMaterialBidirectionalSync({
        presenterIndex: this.presenter.activeStepIndex,
        readSelectedIndex: () => stepper.selectedIndex,
        writeSelectedIndex: (i) => {
          stepper.selectedIndex = i;
        },
        selectionChange$: stepper.selectedIndexChange.asObservable(),
        onMaterialSelection: (i) => this.presenter.select(i),
        injector: this.injector,
        destroyRef: this.destroyRef,
      });
    });
  }
}
