import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import {
  MatStepperModule,
  MatStepper,
  MatStepperIcon,
  type MatStepperIconContext,
} from '@angular/material/stepper';

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
  // Host ChangeDetectorRef. Used after the `_iconOverrides` patch
  // lands to nudge Angular into re-running the host view's CD pass —
  // which re-evaluates the `<mat-stepper>` bindings, including the
  // per-header `[iconOverrides]` propagation that picks up the freshly
  // patched `_iconOverrides` map. Replaces a prior
  // `stepper.selectedIndex = stepper.selectedIndex` self-write that
  // relied on Material's undocumented same-value setter coercion to
  // avoid emitting `selectedIndexChange` and echoing through
  // `createMaterialBidirectionalSync` back into `presenter.select(0)`.
  // `markForCheck` is documented public API; the no-echo contract is
  // unconditional because Material's setter is never touched.
  private readonly hostCdr = inject(ChangeDetectorRef);

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;
  private readonly stepDirectives = contentChildren(CngxStep, { descendants: true });

  /**
   * Consumer-projected `<ng-template matStepperIcon="<state>">`
   * directives — captured here as content children of
   * `<cngx-mat-stepper>` and forwarded into `<mat-stepper>`'s own
   * `_iconOverrides` slot via the `afterNextRender` patch in the
   * constructor. Direct `<ng-content>` projection of these templates
   * does NOT reach Material's `@ContentChildren(MatStepperIcon)`
   * query because Angular's content-init lifecycle resolves the inner
   * component's queries before the wrapper's projection lands; the
   * programmatic forward sidesteps that ordering. Tracked-debt entry
   * folds into `tabs-accepted-debt §5` (Material-internal slot
   * coupling — `_iconOverrides` is underscore-prefixed and thus
   * stability-unguaranteed across Material upgrades).
   */
  private readonly stepperIcons = contentChildren(MatStepperIcon);

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
  // Material's `<ng-template matStepperIcon>` projected directly
  // into `<cngx-mat-stepper>` (the template forwards them through
  // an `<ng-content select="ng-template[matStepperIcon]">` outlet
  // inside `<mat-stepper>`). Closes `stepper-accepted-debt §4`.
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

      // Forward consumer-projected matStepperIcon templates into
      // Material's MatStepper. Direct `<ng-content>` projection
      // does not reach Material's `@ContentChildren(MatStepperIcon)`
      // query because the inner component's content-init resolves
      // before the wrapper's projection lands. We capture the
      // directives via our own `contentChildren` query and patch
      // `_iconOverrides` here, then re-render so the per-header
      // bindings flow. Reaches into Material's underscore-prefixed
      // slot — same accepted-debt class as `tabs-accepted-debt §5`.
      // Dev-mode existence guard: a Material upgrade that renames or
      // removes the `_iconOverrides` slot would otherwise silently
      // no-op the forwarding; the guard surfaces the breakage early
      // with an actionable message.
      const stepperRef = stepper as unknown as {
        _iconOverrides?: Record<string, TemplateRef<MatStepperIconContext>>;
      };
      const iconList = this.stepperIcons();
      if (!stepperRef._iconOverrides) {
        if (typeof ngDevMode !== 'undefined' && ngDevMode && iconList.length) {
          console.warn(
            '[CngxMatStepper] MatStepper._iconOverrides is missing — ' +
              'consumer-projected <ng-template matStepperIcon> templates ' +
              'will not flow through to Material. Likely cause: a ' +
              'Material upgrade renamed or removed the internal slot. ' +
              'See stepper-accepted-debt §4 for the closure mechanism.',
          );
        }
        return;
      }
      for (const icon of iconList) {
        stepperRef._iconOverrides[icon.name] = icon.templateRef;
      }
      // Material reads `_iconOverrides` into per-header bindings on
      // the next CD pass. Mark the host view dirty so Angular re-runs
      // CD over `<mat-stepper>` and re-propagates its bindings —
      // documented public API replacing a prior
      // `stepper.selectedIndex = stepper.selectedIndex` self-write
      // nudge that depended on Material's undocumented same-value
      // setter coercion (no patch-version-stable spec) to avoid
      // emitting `selectedIndexChange`. With `markForCheck`, Material's
      // setter is never touched, so no spurious echo can reach
      // `createMaterialBidirectionalSync`. Spec axis pins this contract
      // (see mat-stepper.component.spec.ts 'matStepperIcon forwarding
      // nudge').
      this.hostCdr.markForCheck();
    });
  }
}
