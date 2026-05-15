import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  ElementRef,
  inject,
  Injector,
  input,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import {
  CngxFocusRestore,
  CngxLiveRegion,
  CngxRovingItem,
  CngxRovingTabindex,
} from '@cngx/common/a11y';
import {
  CNGX_STEP_PANEL_HOST,
  CngxStep,
  CngxStepBadge,
  type CngxStepBadgeContext,
  CngxStepBusySpinner,
  type CngxStepBusySpinnerContext,
  type CngxStepContentContext,
  CngxStepGroupHeader,
  type CngxStepGroupHeaderContext,
  CngxStepIndicator,
  type CngxStepIndicatorContext,
  type CngxStepLabelContext,
  CngxStepperEmpty,
  CngxStepperPresenter,
  CngxStepRejection,
  type CngxStepRejectionContext,
  CNGX_STEPPER_GLYPHS,
  CNGX_STEPPER_HOST,
  createStepperTemplateBindings,
  flatStepsEqual,
  injectStepperConfig,
  injectStepperI18n,
  type CngxStepNode,
  type CngxStepPanelHost,
} from '@cngx/common/stepper';
import {
  CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
} from '@cngx/common/tabs';

/**
 * Stepper organism. Composes `CngxStepperPresenter` with
 * `CngxRovingTabindex` and `CngxFocusRestore` via `hostDirectives`;
 * forwards `activeStepIndex`/`linear`/`orientation`/`commitAction`/
 * `commitMode` to the presenter. Material twin lives in
 * `@cngx/ui/mat-stepper`. ARIA attrs are in the `computed()` graph.
 * <example-url>http://localhost:4200/ui/stepper/stepper-commit-action/pessimistic-optimistic-commits-with-bridge-directives</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-custom-labels/mixing-code-label-code-input-with-code-cngxsteplabel-code-slot</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-error-aggregation/per-step-error-badges</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-hierarchical/group-nested-steps-trailing-root-step</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-horizontal/three-step-wizard</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-linear/linear-gating-with-completion-checkboxes</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-router-sync/deep-linking-with-fragment-queryparam-modes</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-vertical/vertical-sidebar-layout</example-url>
 */
@Component({
  selector: 'cngx-stepper',
  exportAs: 'cngxStepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxLiveRegion, CngxRovingItem],
  styleUrls: ['./styles/stepper-base.css', './stepper.component.css'],
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear', 'orientation', 'commitAction', 'commitMode'],
      outputs: ['activeStepIndexChange'],
    },
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation'],
    },
    { directive: CngxFocusRestore },
    // CngxLiveRegion not composed: its role="status" would clobber the
    // host's role="group". Template mounts a dedicated <span cngxLiveRegion>
    // bound to liveAnnouncement instead.
  ],
  providers: [{ provide: CNGX_STEP_PANEL_HOST, useExisting: CngxStepper }],
  templateUrl: './stepper.component.html',
  host: {
    'role': 'group',
    '[attr.aria-roledescription]': 'stepperRoleDescription()',
    '[attr.aria-orientation]': 'presenter.orientation()',
    '[attr.data-orientation]': 'presenter.orientation()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.aria-busy]': 'isCommitting() ? "true" : null',
    '[class.cngx-stepper]': 'true',
  },
})
export class CngxStepper implements CngxStepPanelHost {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  protected readonly presenter = inject(CNGX_STEPPER_HOST);
  protected readonly i18n = injectStepperI18n();
  protected readonly config = injectStepperConfig();
  private readonly hostElement: HTMLElement = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement;
  private readonly injector = inject(Injector);
  private readonly stepDirectives = contentChildren(CngxStep, { descendants: true });

  private readonly indicatorSlot = contentChild(CngxStepIndicator);
  private readonly badgeSlot = contentChild(CngxStepBadge);
  private readonly busySpinnerSlot = contentChild(CngxStepBusySpinner);
  private readonly rejectionSlot = contentChild(CngxStepRejection);
  private readonly groupHeaderSlot = contentChild(CngxStepGroupHeader);
  private readonly emptySlot = contentChild(CngxStepperEmpty);

  /** Default-template glyph source — read by `#defaultBadge` / `#defaultRejection` outlets. */
  protected readonly glyphs = CNGX_STEPPER_GLYPHS;

  /**
   * 6-slot template cascade (indicator/badge/busySpinner/rejection/
   * groupHeader/empty). Resolution: per-instance slot directive →
   * `CNGX_STEPPER_CONFIG.templates.<key>` → `null` (built-in default).
   */
  protected readonly templates = createStepperTemplateBindings({
    indicatorSlot: this.indicatorSlot,
    badgeSlot: this.badgeSlot,
    busySpinnerSlot: this.busySpinnerSlot,
    rejectionSlot: this.rejectionSlot,
    groupHeaderSlot: this.groupHeaderSlot,
    emptySlot: this.emptySlot,
    config: this.config,
  });

  constructor() {
    // Scroll active step into view on activeStepId change. Routed through
    // CNGX_ORGANISM_SCROLL_SYNC_FACTORY so consumers can swap policy
    // (instant, reduced-motion opt-out) without forking.
    inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)({
      activeId: this.presenter.activeStepId,
      hostElement: this.hostElement,
      injector: this.injector,
    });
  }

  /** Stepper landmark role-description with config + i18n cascade. */
  protected readonly stepperRoleDescription = computed<string>(
    () =>
      this.config.fallbackLabels?.stepRoleDescription ??
      this.i18n.stepperLabel,
  );

  /** Group landmark role-description with config + i18n cascade. */
  protected readonly groupRoleDescription = computed<string>(
    () =>
      this.config.fallbackLabels?.groupRoleDescription ?? 'step group',
  );

  /**
   * `aria-label` cascade: input → `ariaLabels.stepperRegion` → `i18n.stepperLabel`.
   * Pillar 2.
   */
  protected readonly resolvedAriaLabel = computed<string | null>(() => {
    if (this.ariaLabelledBy()) {
      return null; // labelledby trumps label
    }
    return (
      this.ariaLabel() ??
      this.config.ariaLabels?.stepperRegion ??
      this.i18n.stepperLabel
    );
  });

  // O(1) labelTemplateFor/contentTemplateFor lookup. Structural equal on
  // id-set + directive identity stops cascade on shape-stable re-emits.
  private readonly stepDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.stepDirectives,
  });

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;

  /**
   * Step-only flat projection (group nodes filtered out). Structural equal
   * via `flatStepsEqual` — downstream consumers don't re-walk on shape-stable
   * `flatSteps()` re-emits.
   */
  protected readonly stepsOnly = computed(
    () => this.flatSteps().filter((n) => n.kind === 'step'),
    { equal: flatStepsEqual },
  );

  /**
   * Position in the step-only flat projection. Group nodes carry `-1`;
   * callers must guard on `kind === 'step'`.
   */
  protected stepIndexOf(node: CngxStepNode): number {
    return node.flatIndex;
  }

  protected isActive(node: CngxStepNode): boolean {
    return node.kind === 'step' && node.id === this.activeStepId();
  }

  protected isStepBusy(node: CngxStepNode): boolean {
    return (
      node.kind === 'step' &&
      this.presenter.commitState.status() === 'pending' &&
      this.presenter.intendedStepIndex() === node.flatIndex
    );
  }

  /** Commit-in-flight flag — drives the host `aria-busy` binding. Pillar 2. */
  protected readonly isCommitting = computed<boolean>(
    () => this.presenter.commitState.status() === 'pending',
  );

  protected stepHeaderId(node: CngxStepNode): string {
    return `${node.id}-header`;
  }

  protected stepPanelId(node: CngxStepNode): string {
    return `${node.id}-panel`;
  }

  protected stepDescriptorId(node: CngxStepNode): string {
    return `${node.id}-desc`;
  }

  /**
   * Live-region content. Empty string between transitions keeps the region
   * quiet on no-op CD ticks. Error-arm priority:
   * 1. `commitRolledBackTo(originLabel)` when both `lastFailedIndex` and a
   *    resolvable origin label exist.
   * 2. `commitFailedRetry` otherwise.
   */
  protected readonly liveAnnouncement = computed<string>(() => {
    const current = this.presenter.commitTransition.current();
    if (current === 'pending') {
      return this.i18n.commitInFlight;
    }
    if (current === 'error') {
      // Sync commit-handler errors collapse pending → error in one signal
      // flush; tracker sees `previous === 'idle'`. Guard stays loose so
      // sync-rejection (`commitAction = () => false`) still announces.
      const failedIdx = this.presenter.lastFailedIndex();
      const originIdx = this.presenter.originIndexDuringCommit();
      if (failedIdx !== undefined && originIdx !== undefined) {
        const originLabel = this.stepsOnly()[originIdx]?.label();
        if (originLabel) {
          return this.i18n.commitRolledBackTo(originLabel);
        }
      }
      return this.i18n.commitFailedRetry;
    }
    return '';
  });

  /** SR descriptor phrase. Aggregator-announced or "Step N of M: <label>"; appends stepRolledBackSuffix on the rejected row. */
  protected statusPhrase(node: CngxStepNode): string {
    const aggregator = node.errorAggregator?.();
    let base = aggregator?.shouldShow?.() ? (aggregator.announcement?.() ?? '') : '';
    if (!base && node.kind === 'step') {
      const idx = this.stepIndexOf(node);
      if (idx >= 0) {
        base = this.i18n.selectedStep(node.label(), idx + 1, this.stepsOnly().length);
      }
    }
    if (!base) {
      return '';
    }
    return node.kind === 'step' && node.flatIndex === this.presenter.lastFailedIndex()
      ? `${base} ${this.i18n.stepRolledBackSuffix}`
      : base;
  }

  /** Group descriptor — rolls up children's aggregated status. */
  protected groupStatusPhrase(node: CngxStepNode): string {
    const status = node.state();
    if (status === 'error') {
      return this.i18n.stepErrored;
    }
    if (status === 'success') {
      return this.i18n.stepCompleted;
    }
    return '';
  }

  /** Whether to render the error badge for a step node. */
  protected showErrorBadge(node: CngxStepNode): boolean {
    return !!node.errorAggregator?.()?.shouldShow?.();
  }

  /**
   * Render the rejection decoration when this step's flat-index matches
   * `presenter.lastFailedIndex()`. Closes stepper-accepted-debt §2.
   */
  protected showRejection(node: CngxStepNode): boolean {
    return (
      node.kind === 'step' &&
      node.flatIndex >= 0 &&
      node.flatIndex === this.presenter.lastFailedIndex()
    );
  }

  /** Build the slot context for `*cngxStepIndicator`. */
  protected indicatorContextFor(node: CngxStepNode): CngxStepIndicatorContext {
    const position = node.flatIndex + 1;
    return {
      $implicit: position,
      position,
      node,
      active: this.isActive(node),
      status: node.state(),
      busy: this.isStepBusy(node),
    };
  }

  /** Build the slot context for `*cngxStepBadge`. */
  protected badgeContextFor(node: CngxStepNode): CngxStepBadgeContext {
    const aggregator = node.errorAggregator?.();
    const count = aggregator?.errorCount() ?? 0;
    return { count, node };
  }

  /** Build the slot context for `*cngxStepBusySpinner`. */
  protected busySpinnerContextFor(node: CngxStepNode): CngxStepBusySpinnerContext {
    return { node };
  }

  /**
   * Build the slot context for `*cngxStepRejection`. Resolves origin label
   * from `presenter.originIndexDuringCommit()` via `stepsOnly()`.
   */
  protected rejectionContextFor(node: CngxStepNode): CngxStepRejectionContext {
    const failedIndex = node.flatIndex;
    const originIdx = this.presenter.originIndexDuringCommit();
    const originLabel =
      originIdx !== undefined ? this.stepsOnly()[originIdx]?.label() : undefined;
    return { failedIndex, originLabel, node };
  }

  /** Build the slot context for `*cngxStepGroupHeader`. */
  protected groupHeaderContextFor(node: CngxStepNode): CngxStepGroupHeaderContext {
    return { group: node, expanded: true, status: node.state() };
  }

  protected handleHeaderClick(node: CngxStepNode): void {
    if (node.kind !== 'step' || node.disabled()) {
      return;
    }
    const idx = this.stepIndexOf(node);
    if (idx >= 0) {
      this.presenter.select(idx);
    }
  }

  /**
   * Clear the presenter's `lastFailedIndex`. Lets template-ref consumers
   * (`#s="cngxStepper"`) dismiss the rejection decoration without injecting
   * {@link CNGX_STEPPER_HOST}.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }

  // CngxStepPanelHost contract — O(1) via the pre-built map.
  labelTemplateFor(id: string): TemplateRef<CngxStepLabelContext> | null {
    return this.stepDirectiveById().get(id)?.labelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<CngxStepContentContext> | null {
    return this.stepDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null;
  }

  /**
   * Build the {@link CngxStepLabelContext} for `*cngxStepLabel`.
   * `index` is 1-based (mirrors indicator position); group nodes
   * (`flatIndex === -1`) yield `0` and are never iterated here.
   */
  protected stepLabelContextFor(node: CngxStepNode): CngxStepLabelContext {
    return {
      node,
      index: node.flatIndex + 1,
      active: this.isActive(node),
      busy: this.isStepBusy(node),
      disabled: node.disabled(),
    };
  }

  /**
   * Build the {@link CngxStepContentContext} for `*cngxStepContent`.
   * Same shape as the label context — content templates need the same
   * `disabled`/`busy` derivations.
   */
  protected stepContentContextFor(node: CngxStepNode): CngxStepContentContext {
    return this.stepLabelContextFor(node);
  }
}
