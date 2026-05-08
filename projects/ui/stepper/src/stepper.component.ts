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
 * CNGX-standard stepper organism. Thin shell composing the
 * `CngxStepperPresenter` brain with `CngxRovingTabindex`,
 * `CngxFocusRestore`, and `CngxLiveRegion` via `hostDirectives`.
 * Material consumers reach for `<cngx-mat-stepper>` (sibling
 * `@cngx/ui/mat-stepper` entry) instead.
 *
 * The presenter owns `activeStepIndex`, `linear`, `orientation`,
 * `commitAction`, `commitMode`; the organism forwards them through
 * `hostDirectives.inputs`. Renders the strip + panels via two
 * `@for` loops over `presenter.flatSteps()`. Reactive ARIA — every
 * `aria-current`, `aria-controls`, `aria-describedby`, `aria-busy`
 * is `computed()`, never a one-time binding.
 *
 * @category interactive
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
    // CngxLiveRegion is intentionally NOT composed here — its host
    // binding sets role="status", which would clobber the wrapper's
    // role="group" landmark. A dedicated `<span cngxLiveRegion>` is
    // mounted inside the template (driven by `liveAnnouncement`) for
    // SR announcements on commit transitions.
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

  /**
   * Resolved 6-slot template cascade for the indicator / badge /
   * busy-spinner / rejection / group-header / empty regions.
   * Three-stage cascade: per-instance slot directive >
   * `CNGX_STEPPER_CONFIG.templates.<key>` > `null` (organism falls
   * back to its built-in default template). Mirrors the
   * `createTabOverflowTemplateBindings` pattern in `@cngx/common/tabs`.
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
    // Self-healing scroll loop — when the active step changes (via
    // direct click on a visible step, keyboard nav, or selectById from
    // a future overflow molecule), bring the matching button into the
    // strip's visible area. Vertical layouts benefit equally — the
    // factory's default `scrollIntoView` block:'nearest' keeps both
    // axes covered. Routed through `CNGX_ORGANISM_SCROLL_SYNC_FACTORY`
    // so consumers can swap the scroll policy (instant, custom
    // selector, reduced-motion opt-out) without forking the organism.
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
   * `aria-label` resolves Input → ariaLabels.stepperRegion config →
   * i18n.stepperLabel. Pillar 2 — the surface declared by config /
   * i18n must reach the DOM.
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

  // Pre-build a Map<id, CngxStep> so labelTemplateFor /
  // contentTemplateFor are O(1) per call instead of O(N) linear
  // scans on every panel render. Structural `equal` keyed on the
  // id-set + per-id directive identity prevents the Map from
  // cascading downstream every time `contentChildren` re-emits with
  // an unchanged child set.
  private readonly stepDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.stepDirectives,
  });

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;

  /**
   * Step-only flat projection (excludes group nodes). Memoised behind
   * `flatStepsEqual` so downstream consumers (`statusPhrase`,
   * `liveAnnouncement` origin lookup, group/step `@for` iteration)
   * don't re-walk the array on every shape-stable re-emit of
   * `flatSteps()`. Mirrors the presenter's private twin at
   * `presenter.directive.ts:186-189`.
   */
  protected readonly stepsOnly = computed(
    () => this.flatSteps().filter((n) => n.kind === 'step'),
    { equal: flatStepsEqual },
  );

  /**
   * Step's position in the flat step-only projection. Reads
   * `flatIndex` directly — set by `flattenStepTree` at O(1) in the
   * presenter. Group nodes carry `-1` here, so callers that resolve
   * a UI position must guard `node.kind === 'step'` first.
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

  /**
   * `true` while the presenter has a commit in flight. Drives the
   * landmark `aria-busy` host binding so AT consumers know the
   * stepper region is mid-transition (Pillar 2 — every state change
   * communicates).
   */
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
   * SR-friendly text rendered inside the polite live-region span. Drives
   * the announcer through declarative content updates — never an
   * imperative announce() call. Empty string between transitions so the
   * region stays quiet on no-op CD ticks.
   *
   * Priority chain on the `error` arm:
   *   1. `commitRolledBackTo(originLabel)` when the presenter has both
   *      a `lastFailedIndex` and a resolvable origin label — the rich,
   *      origin-aware rollback phrase carries the destination so the
   *      user understands both *what failed* and *where they are*.
   *   2. `commitFailedRetry` (generic fallback) otherwise — origin
   *      undefined, label unresolvable, or non-rollback error path.
   *
   * Reads `presenter.commitTransition` directly — the presenter
   * allocates one `linkedSignal`-backed tracker per instance and
   * exposes it on the host contract for skin reuse. Pillar 1: derive,
   * never duplicate.
   */
  protected readonly liveAnnouncement = computed<string>(() => {
    const current = this.presenter.commitTransition.current();
    if (current === 'pending') {
      return this.i18n.commitInFlight;
    }
    if (current === 'error') {
      // Synchronous commit-handler errors collapse pending → error in a
      // single signal-flush tick, so the tracker captures
      // `previous = 'idle'` rather than `'pending'`. Loosening the
      // guard keeps the announcement reachable for sync-rejection
      // actions (`commitAction = () => false`) while staying silent on
      // `idle` and `success`.
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

  /**
   * SR descriptor phrase for a step header. Reads the aggregator's
   * announcement when one is bound and the aggregator opted-in to
   * showing errors; otherwise falls back to a "Step N of M:
   * <label>" phrase from the i18n bundle.
   */
  protected statusPhrase(node: CngxStepNode): string {
    const aggregator = node.errorAggregator?.();
    if (aggregator?.shouldShow?.() && aggregator.announcement) {
      return aggregator.announcement();
    }
    if (node.kind !== 'step') {
      return '';
    }
    const idx = this.stepIndexOf(node);
    if (idx < 0) {
      return '';
    }
    return this.i18n.selectedStep(node.label(), idx + 1, this.stepsOnly().length);
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
   * Whether to render the rejection-decoration on a strip step.
   * Mirrors the tabs sibling at `tab-group.component.html:13` —
   * `presenter.lastFailedIndex()` matches this step's flat-index.
   * Closes stepper-accepted-debt §2 (Phase 3 absorption of the
   * deferred visual parity).
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
   * Build the slot context for `*cngxStepRejection`. Resolves the
   * safe-harbour origin label from `presenter.originIndexDuringCommit()`
   * via the step-only flat projection — same lookup the
   * `liveAnnouncement` computed performs for the SR rollback phrase.
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
   * Clear the persisted `lastFailedIndex` rejection flag on the
   * presenter — public delegator mirroring the
   * {@link CngxTabGroup.clearLastFailed} pass-through pattern so
   * consumers using a template ref (`#s="cngxStepper"`) can dismiss
   * the rejection decoration programmatically without injecting
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
   * Build the {@link CngxStepLabelContext} delivered to consumer
   * `*cngxStepLabel` templates. The flat-step index is 1-based to
   * match the indicator-position convention; group nodes carry
   * `flatIndex === -1` so the calculation correctly returns 0 for
   * groups (callers only invoke this for `kind === 'step'` nodes
   * via the template loop).
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
   * Build the {@link CngxStepContentContext} delivered to consumer
   * `*cngxStepContent` templates. Mirrors the label-context shape
   * 1:1 — content templates frequently need the same derivations
   * (gate inner controls on `disabled` / `busy`).
   */
  protected stepContentContextFor(node: CngxStepNode): CngxStepContentContext {
    return this.stepLabelContextFor(node);
  }
}
