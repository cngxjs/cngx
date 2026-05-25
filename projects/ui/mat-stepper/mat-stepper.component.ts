import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  inject,
  Injector,
  type Signal,
  type TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import {
  MatStepperModule,
  MatStepper,
  MatStepperIcon,
} from '@angular/material/stepper';

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

import { createMatStepperBidirectionalSync } from './material-bridge/bidirectional-sync';
import { CNGX_DIRECTIVE_BY_ID_MAP_FACTORY } from '@cngx/common/tabs';
import type { MaterialPrivateSurfaces } from '@cngx/ui/mat-tabs';

/**
 * Material-twin stepper organism. Wraps `<mat-stepper>` and shares
 * the `CngxStepperPresenter` brain with `<cngx-stepper>` — Material
 * consumers gain the commit-action lifecycle, router sync, and error
 * aggregation.
 *
 * Bidirectional sync between presenter and `MatStepper.selectedIndex`
 * runs in a single `effect()` with `untracked()` writes so neither
 * direction tracks the other.
 *
 * Material owns keyboard nav and focus on `MatStepperHeader`, so the
 * organism does NOT compose `CngxRovingTabindex` /
 * `CngxFocusRestore`. Group nodes flatten — `<mat-stepper>` does not
 * support nesting — with the depth preserved as a `data-step-depth`
 * hint on the rendered label.
 *
 * @playground Bridge instrumentation ./examples/bridge/bridge-example.component.ts
 * <example-url>http://localhost:4200/mat-stepper-router-sync/deep-linking-against-material</example-url>
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
  // Host CD nudge after the `_iconOverrides` patch — Material reads the map
  // into per-header `[iconOverrides]` bindings on the next CD pass.
  private readonly hostCdr = inject(ChangeDetectorRef);

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;
  private readonly stepDirectives = contentChildren(CngxStep, { descendants: true });

  /**
   * Consumer-projected `<ng-template matStepperIcon>` templates,
   * forwarded into `MatStepper._iconOverrides` from the
   * `afterNextRender` patch below. `<ng-content>` projection cannot
   * reach Material's `@ContentChildren(MatStepperIcon)` — content-init
   * resolves the inner query before the wrapper's projection lands.
   * `_iconOverrides` is a Material-internal slot;
   * `tabs-accepted-debt §5`.
   */
  private readonly stepperIcons = contentChildren(MatStepperIcon);

  /**
   * `Map<id, CngxStep>` so `labelTemplateFor` / `contentTemplateFor`
   * are O(1). Structural `equal` on the id-set + per-id directive
   * identity stops the map from cascading on shape-stable
   * `contentChildren` re-emits.
   */
  private readonly stepDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.stepDirectives,
  });

  /**
   * Step-only flat projection — `<mat-step>` does not nest, so
   * groups collapse into the same level. Memoised via
   * `flatStepsEqual` so consumers (`stepLabel`, panel `@for`,
   * `stepLabelContextFor`) don't re-walk on shape-stable
   * `flatSteps()` re-emits. Sibling-symmetric with
   * `CngxStepper.stepsOnly`.
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

  // Material twin honours only `*cngxStepLabel` / `*cngxStepContent`; Material
  // owns indicator/badge/busy chrome via `<ng-template matStepperIcon>`.
  // stepper-accepted-debt §4.
  labelTemplateFor(id: string): TemplateRef<CngxStepLabelContext> | null {
    return this.stepDirectiveById().get(id)?.labelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<CngxStepContentContext> | null {
    return this.stepDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null;
  }

  /**
   * Per-node-id slot-context cache for `*cngxStepLabel` /
   * `*cngxStepContent`. Mutating fields in place preserves the
   * object reference, so `*ngTemplateOutlet`'s `Object.is` diff
   * short-circuits the embedded-view rebind; the embedded view's
   * `let-` bindings re-read the mutated fields on the next CD pass.
   * Stale ids are pruned by the constructor effect tied to
   * `presenter.flatSteps`.
   */
  private readonly stepLabelContextCache = new Map<string, CngxStepLabelContext>();

  /** Build the {@link CngxStepLabelContext} for the projected label template. */
  protected stepLabelContextFor(node: CngxStepNode): CngxStepLabelContext {
    const flatStep = node.flatIndex;
    const active = node.id === this.presenter.activeStepId();
    const busy =
      this.presenter.commitState.status() === 'pending' &&
      this.presenter.intendedStepIndex() === flatStep;
    const disabled = node.disabled();

    const existing = this.stepLabelContextCache.get(node.id);
    if (!existing) {
      const fresh: CngxStepLabelContext = {
        node,
        index: flatStep + 1,
        active,
        busy,
        disabled,
      };
      this.stepLabelContextCache.set(node.id, fresh);
      return fresh;
    }
    // In-place mutation preserves the object reference so `*ngTemplateOutlet`'s
    // `Object.is` diff short-circuits the embedded-view rebind.
    const mutable = existing as {
      -readonly [K in keyof CngxStepLabelContext]: CngxStepLabelContext[K];
    };
    mutable.node = node;
    mutable.index = flatStep + 1;
    mutable.active = active;
    mutable.busy = busy;
    mutable.disabled = disabled;
    return existing;
  }

  /** Build the {@link CngxStepContentContext} for the projected content template. */
  protected stepContentContextFor(node: CngxStepNode): CngxStepContentContext {
    return this.stepLabelContextFor(node);
  }

  constructor() {
    // Prune stale `stepLabelContextCache` entries — removed node-ids would otherwise leak.
    effect(() => {
      const flat = this.presenter.flatSteps();
      untracked(() => {
        const liveIds = new Set<string>();
        for (const n of flat) {
          liveIds.add(n.id);
        }
        for (const id of Array.from(this.stepLabelContextCache.keys())) {
          if (!liveIds.has(id)) {
            this.stepLabelContextCache.delete(id);
          }
        }
      });
    });

    // `viewChild.required(MatStepper)` isn't resolved until after the view commits.
    afterNextRender(() => {
      const stepper = this.matStepper();
      createMatStepperBidirectionalSync({
        matStepper: stepper,
        presenter: this.presenter,
        injector: this.injector,
        destroyRef: this.destroyRef,
      });

      // Forward projected `<ng-template matStepperIcon>` into
      // `MatStepper._iconOverrides`; `<ng-content>` cannot reach Material's
      // `@ContentChildren(MatStepperIcon)` because content-init resolves the
      // inner query before the wrapper's projection lands. tabs-accepted-debt §5.
      const stepperRef =
        stepper as unknown as MaterialPrivateSurfaces.IconOverrideHost;
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
      // `markForCheck` (not `selectedIndex`) — touching the index would echo
      // through `createMaterialBidirectionalSync`.
      this.hostCdr.markForCheck();
    });
  }
}
