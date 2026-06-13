import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
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
import { CngxSwipe } from '@cngx/common/interactive';
import {
  CNGX_STEP_PANEL_HOST,
  createStepperDisplayMode,
  createStepperGroupSummary,
  createStripDensity,
  CngxStep,
  STEPPER_DEFAULT_DENSITY_BREAKPOINTS,
  STEPPER_DEFAULT_MOBILE_BREAKPOINT,
  CngxStepBadge,
  CngxStepBusySpinner,
  type CngxStepContentContext,
  CngxStepError,
  type CngxStepErrorContext,
  CngxStepGroupHeader,
  CngxStepIndicator,
  type CngxStepLabelContext,
  CngxStepperEmpty,
  CngxStepperPresenter,
  type CngxStepperHeaderNavigation,
  type CngxStepperMobileIndicatorPosition,
  type CngxStepperSkin,
  CngxStepRejection,
  CNGX_STEPPER_GLYPHS,
  CNGX_STEPPER_HOST,
  CngxStepperCount,
  createStepperAnnouncementBuilders,
  createStepperHostAttrs,
  createStepperSlotContextBuilders,
  createStepperStateView,
  createStepperStripKeyboardNav,
  createStepperTemplateBindings,
  resolveStepperErrorSummary,
  CngxStepperSwipeNav,
  resolveStepperStatusLabel,
  injectStepperConfig,
  injectStepperI18n,
  type CngxStepNode,
  type CngxStepPanelHost,
} from '@cngx/common/stepper';
import {
  CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
} from '@cngx/common/tabs';
import { coerceBooleanProperty } from '@cngx/core/utils';

/**
 * Stepper organism. Composes `CngxStepperPresenter` with
 * `CngxRovingTabindex` and `CngxFocusRestore` via `hostDirectives`;
 * forwards `activeStepIndex`/`linear`/`orientation`/`commitAction`/
 * `commitMode` to the presenter. Material twin lives in
 * `@cngx/ui/mat-stepper`. ARIA attrs are in the `computed()` graph.
 *
 * @category ui/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stepper/stepper.component.ts
 * @since 0.1.0
 * @relatedTo CngxStepperPresenter, CngxStep, CngxRovingTabindex, CngxFocusRestore, CngxLiveRegion
 * @playground Material theme coverage across all skins ./examples/material-theme-coverage/skins-coverage.component.ts
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-horizontal/three-step-wizard</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-vertical/vertical-sidebar-layout</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-linear/linear-gating-with-completion-checkboxes</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-mobile-collapse/dots-collapse</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/linear-minimal</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/stripe-status-rich</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/path-chevron</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/pill-segment</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/chips</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/breadcrumb</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/all-skins-side-by-side</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/material-theme-coverage</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/linear-minimal-vertical</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/stripe-status-rich-vertical</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/path-chevron-vertical</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/pill-segment-vertical</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-skins/chips-vertical</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-density/flat-steps-auto-density</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-density/density-across-skins</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-density/distance-weighted-collapse</example-url>
 */
@Component({
  selector: 'cngx-stepper',
  exportAs: 'cngxStepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxLiveRegion, CngxRovingItem, CngxStepperCount, CngxSwipe],
  styleUrls: ['./styles/stepper-base.css', './stepper.component.css'],
  encapsulation: ViewEncapsulation.None,
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
    {
      directive: CngxStepperSwipeNav,
      inputs: ['mobileSwipe'],
    },
    { directive: CngxFocusRestore },
    // CngxLiveRegion not composed: its role="status" would clobber the
    // host's role="group". Template mounts a dedicated <span cngxLiveRegion>
    // bound to liveAnnouncement instead.
  ],
  providers: [{ provide: CNGX_STEP_PANEL_HOST, useExisting: CngxStepper }],
  templateUrl: './stepper.component.html',
  host: {
    class: 'cngx-stepper',
    role: 'group',
    '[attr.aria-roledescription]': 'stepperRoleDescription()',
    '[attr.aria-orientation]': 'presenter.orientation()',
    '[attr.data-orientation]': 'presenter.orientation()',
    '[attr.data-density]': 'stripDensity()',
    '[attr.data-density-auto]': "isDensityAuto() ? '' : null",
    '[attr.data-skin]': 'hostAttrs.resolvedSkin()',
    '[attr.data-connectors]': "hostAttrs.resolvedConnectors() ? 'true' : null",
    '[attr.data-mobile-indicator-position]': 'hostAttrs.resolvedMobileIndicatorPosition()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[attr.aria-busy]': 'isCommitting() ? "true" : null',
    '[class.cngx-stepper]': 'true',
    '(keydown)': 'handleStripKeyDown($event)',
  },
})
export class CngxStepper implements CngxStepPanelHost {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /** Per-instance skin override; flips `[data-skin]`, structure/ARIA unchanged. */
  readonly skin = input<CngxStepperSkin | undefined>(undefined);

  /** Opt the classic skin into the connector-rail presentation. Off by default, classic-scoped. */
  readonly connectors = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined ? undefined : coerceBooleanProperty(v)),
  });

  /**
   * Per-instance header-navigation policy. `'none'` renders inert label
   * headers (footer-only navigation); `'visited'` keeps them as
   * focusable buttons gated by `linear`. Cascade: Input ?? config ??
   * `'visited'`.
   */
  readonly headerNavigation = input<CngxStepperHeaderNavigation | undefined>(undefined);

  /**
   * Opt-in `Step N of M` caption under the mobile `'dots'` row. In
   * the `'text'` collapse branch the count IS the indicator and is
   * always rendered; this input only gates the supplemental caption
   * that sits next to the dot row.
   */
  readonly showStepCount = input<boolean>(false);

  readonly mobileIndicatorPosition = input<CngxStepperMobileIndicatorPosition | undefined>(
    undefined,
  );

  /** Stepper-host contract; exposed so external `<cngx-stepper-count>` / bridge consumers can `[host]="s.presenter"` via `#s="cngxStepper"`. */
  readonly presenter = inject(CNGX_STEPPER_HOST);
  protected readonly i18n = injectStepperI18n();
  protected readonly config = injectStepperConfig();
  private readonly hostElement: HTMLElement =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly stepDirectives = contentChildren(CngxStep, { descendants: true });

  private readonly indicatorSlot = contentChild(CngxStepIndicator);
  private readonly badgeSlot = contentChild(CngxStepBadge);
  private readonly busySpinnerSlot = contentChild(CngxStepBusySpinner);
  private readonly rejectionSlot = contentChild(CngxStepRejection);
  private readonly errorSlot = contentChild(CngxStepError);
  private readonly groupHeaderSlot = contentChild(CngxStepGroupHeader);
  private readonly emptySlot = contentChild(CngxStepperEmpty);

  /** Default-template glyph source - read by `#defaultBadge` / `#defaultRejection` outlets. */
  protected readonly glyphs = CNGX_STEPPER_GLYPHS;

  /**
   * Template cascade (indicator/badge/busySpinner/rejection/stepError/
   * groupHeader/empty). Resolution: per-instance slot directive →
   * `CNGX_STEPPER_CONFIG.templates.<key>` → `null` (built-in default).
   */
  protected readonly templates = createStepperTemplateBindings({
    indicatorSlot: this.indicatorSlot,
    badgeSlot: this.badgeSlot,
    busySpinnerSlot: this.busySpinnerSlot,
    rejectionSlot: this.rejectionSlot,
    errorSlot: this.errorSlot,
    groupHeaderSlot: this.groupHeaderSlot,
    emptySlot: this.emptySlot,
    config: this.config,
  });

  protected readonly displayMode = createStepperDisplayMode(
    this.config.mobileBreakpoint ?? STEPPER_DEFAULT_MOBILE_BREAKPOINT,
    () => this.config.mobileCollapse,
    inject(DestroyRef),
  );

  /**
   * Space-driven density rung for the classic strip, measured off the
   * host element's own width via {@link createStripDensity}. `'full'`
   * under the `'comfortable'` default. Drives `[data-density]` (the CSS
   * label-degradation ladder) and the auto-vertical flip below.
   */
  protected readonly stripDensity = createStripDensity({
    element: this.hostElement,
    stepCount: () => this.presenter.stepCount(),
    density: () => this.config.density,
    breakpoints: () => this.config.densityBreakpoints ?? STEPPER_DEFAULT_DENSITY_BREAKPOINTS,
    destroyRef: inject(DestroyRef),
  });

  /**
   * `true` when `density: 'auto'` is active. Drives `[data-density-auto]`,
   * which makes the strip absorb a too-narrow container by shrinking +
   * ellipsis-truncating labels in flow rather than growing a horizontal
   * scrollbar - so no rung ever overflows, independent of how the px
   * thresholds resolve.
   */
  protected readonly isDensityAuto = computed<boolean>(() => this.config.density === 'auto');

  constructor() {
    // Scroll active step into view via the swappable scroll-sync factory.
    inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)({
      activeId: this.presenter.activeStepId,
      hostElement: this.hostElement,
      injector: this.injector,
    });
  }

  /** Stepper landmark role-description with config + i18n cascade. */
  protected readonly stepperRoleDescription = computed<string>(
    () => this.config.fallbackLabels?.stepRoleDescription ?? this.i18n.stepperLabel,
  );

  /** Resolved skin / connectors / mobile-indicator host attrs (Level-2 cascade helper). */
  protected readonly hostAttrs = createStepperHostAttrs({
    skin: this.skin,
    connectors: this.connectors,
    mobileIndicatorPosition: this.mobileIndicatorPosition,
    config: this.config,
  });

  /**
   * Resolved header-navigation policy. Cascade mirrors `skin` /
   * `connectors`: per-instance Input ?? config ?? `'visited'`.
   */
  protected readonly resolvedHeaderNavigation = computed<CngxStepperHeaderNavigation>(
    () => this.headerNavigation() ?? this.config.headerNavigation ?? 'visited',
  );

  /**
   * Real error reason for a step, or `null`. A reason is the direct
   * `[error]` string or the first `errorAggregator` label.
   */
  private stepErrorMessageOf(node: CngxStepNode): string | null {
    return node.errorMessage?.() ?? node.errorAggregator?.()?.errorLabels?.()?.[0] ?? null;
  }

  /**
   * Errored steps that carry a real message, rendered as a row BELOW the
   * strip (full width, wraps) rather than inline in a step - a free-text
   * message inside a strip item widens the shrink-to-fit step and tears
   * the row. Empty when no step has a real reason.
   */
  protected readonly stepErrorEntries = computed<
    readonly { id: string; label: string; message: string; context: CngxStepErrorContext }[]
  >(
    () =>
      // The message row sits below the strip, so it has room on every
      // skin - the bare 'errored' state still rides each skin's own
      // indicator / badge / tile.
      this.stepsOnly()
        .filter((node) => node.kind === 'step' && this.stepErrorMessageOf(node) !== null)
        .map((node) => ({
          id: node.id,
          label: node.label(),
          message: this.stepErrorMessageOf(node)!,
          context: this.slotContext.stepErrorContextFor(node),
        })),
    {
      equal: (a, b) =>
        a.length === b.length && a.every((e, i) => e.id === b[i].id && e.message === b[i].message),
    },
  );

  /** Mobile-swipe navigation host directive (Level-2 composition). */
  protected readonly swipeNav = inject(CngxStepperSwipeNav, { host: true });

  protected statusLabelFor = (node: CngxStepNode): string =>
    resolveStepperStatusLabel(node, this.i18n, this.slotContext.isActive(node));

  /** Mobile-dot `data-state`: unified error (rejection + aggregator) over the raw status. */
  protected mobileDotState(node: CngxStepNode): string {
    return this.stateView.hasError(node) ? 'error' : node.state();
  }

  /** Mobile-dot `aria-label`, appending the errored status when the dot has an error. */
  protected mobileDotAriaLabel(node: CngxStepNode, index: number): string {
    const base = this.i18n.selectedStep(node.label(), index + 1, this.stepsOnly().length);
    return this.stateView.hasError(node) ? `${base}: ${this.i18n.statusLabels.errored}` : base;
  }
  protected readonly groupRoleDescription = computed<string>(
    () => this.config.fallbackLabels?.groupRoleDescription ?? 'step group',
  );

  /**
   * `true` when a rendered strip group header is folded under the
   * focus-driven policy: `groupCollapse === 'expand-active'`, the group
   * has children, and it does not hold the active step. Drives the
   * `--collapsed` visual de-emphasis. Reads `activeGroupId` reactively,
   * never a one-shot write.
   *
   * The fold is a density optimisation, not a user-operable disclosure:
   * collapse is focus-driven (no toggle control) and collapsed steps
   * stay sequentially reachable via footer navigation, so the header
   * carries no `aria-expanded` - an unsupported pairing on `role="group"`
   * (ARIA 1.2) that would also imply a false disclosure affordance.
   */
  protected isGroupCollapsed(node: CngxStepNode): boolean {
    if (node.kind !== 'group' || this.config.groupCollapse !== 'expand-active') {
      return false;
    }
    if (node.children.length === 0) {
      return false;
    }
    return this.presenter.activeGroupId() !== node.id;
  }

  /**
   * Collapsed-group summary view (`groupCollapseSummary`). Level-2 factory
   * keeps the count/progress/status derivation out of the organism; the
   * template reads `groupSummary.text(node)` / `.showStatus(node)` /
   * `.srText(node)` on collapsed group headers.
   */
  protected readonly groupSummary = createStepperGroupSummary({
    summaryMode: () => this.config.groupCollapseSummary,
    isCollapsed: (node) => this.isGroupCollapsed(node),
  });

  /**
   * `aria-label` cascade: input → `ariaLabels.stepperRegion` → `i18n.stepperLabel`.
   */
  protected readonly resolvedAriaLabel = computed<string | null>(() => {
    if (this.ariaLabelledBy()) {
      return null; // labelledby trumps label
    }
    return this.ariaLabel() ?? this.config.ariaLabels?.stepperRegion ?? this.i18n.stepperLabel;
  });

  // O(1) labelTemplateFor/contentTemplateFor lookup. Structural equal on
  // id-set + directive identity stops cascade on shape-stable re-emits.
  private readonly stepDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.stepDirectives,
  });

  readonly flatSteps: Signal<readonly CngxStepNode[]> = this.presenter.flatSteps;
  readonly activeStepIndex: Signal<number> = this.presenter.activeStepIndex;
  readonly activeStepId: Signal<string | null> = this.presenter.activeStepId;
  protected readonly stepsOnly: Signal<readonly CngxStepNode[]> = this.presenter.stepsOnly;

  /**
   * Strip projection honouring the focus-driven group-collapse policy.
   * Drives the classic strip `@for`; collapsed groups contribute their
   * header node alone. Sourced from the presenter, never re-derived here
   * (host-token contract). Panels still render every step via
   * {@link stepsOnly}, so collapsed steps keep their panel ids in the DOM.
   */
  protected readonly visibleStripNodes: Signal<readonly CngxStepNode[]> =
    this.presenter.visibleStripNodes;

  /**
   * Position in the step-only flat projection. Group nodes carry `-1`;
   * callers must guard on `kind === 'step'`.
   */
  protected stepIndexOf(node: CngxStepNode): number {
    return node.flatIndex;
  }

  /**
   * Distance of a step from the active one, published per-step as
   * `--cngx-step-distance` under `density: 'auto'`. Drives the
   * distance-weighted label budget so the step furthest from the active
   * one collapses first. Pure derived data - no layout read.
   */
  protected stepDistanceOf(node: CngxStepNode): number {
    return Math.abs(this.stepIndexOf(node) - this.activeStepIndex());
  }

  /** Per-step predicates + slot-context builders (Level-2 factory). */
  protected readonly slotContext = createStepperSlotContextBuilders({
    presenter: this.presenter,
    stepsOnly: this.stepsOnly,
    i18n: this.i18n,
  });

  /**
   * Shared state view - feeds the mobile-collapse `text` / `dots` branches,
   * which otherwise rendered only `Step N of M` (text) or `node.state()`
   * (dots) and dropped the per-step error the desktop branch shows.
   */
  protected readonly stateView = createStepperStateView({
    presenter: this.presenter,
    stepsOnly: this.stepsOnly,
  });

  /**
   * Aggregate error phrase for the mobile-collapse text branch. Feeds the
   * real reason (the `[error]` string / aggregator label) through the
   * resolver so the collapsed view shows "Card declined", not the generic
   * "errored" status word - the strip's per-step row is not on screen in
   * collapsed mode, so this line is the only error surface.
   */
  protected readonly mobileErrorSummary = computed<string>(() =>
    resolveStepperErrorSummary(
      this.stateView,
      this.stepsOnly,
      this.i18n,
      (node) => this.stepErrorMessageOf(node) ?? undefined,
    ),
  );

  /** Commit-in-flight flag - drives the host `aria-busy` binding.*/
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

  /** Live-region + per-step + group SR phrase builders (Level-2 factory). */
  protected readonly announcement = createStepperAnnouncementBuilders({
    presenter: this.presenter,
    stepsOnly: this.stepsOnly,
    i18n: this.i18n,
  });

  protected handleHeaderClick(node: CngxStepNode): void {
    // Inert headers in 'none' mode: the footer is the sole control.
    if (this.resolvedHeaderNavigation() === 'none') {
      return;
    }
    // No-op when the header is not reachable - disabled, linear-blocked,
    // or a commit is in flight. The reachability gate (which now includes
    // `busy()`) is the single source, so a mid-commit click cannot
    // supersede the pending transition.
    if (node.kind !== 'step' || !this.isHeaderReachable(node)) {
      return;
    }
    this.presenter.select(this.stepIndexOf(node));
  }

  /**
   * `true` when the step header at `node` may be navigated to right now:
   * structurally reachable (`canNavigateTo` - not disabled, not
   * linear-blocked) AND not while a commit is in flight (`busy()`). The
   * busy gate mirrors the footer nav atoms, which disable on
   * `!canGo* || busy()` - so the strip and the footer lock together
   * during an async transition instead of letting a header click
   * supersede the pending commit. Reads the host contract, never the
   * presenter's private linear-block check.
   */
  protected isHeaderReachable(node: CngxStepNode): boolean {
    return this.presenter.canNavigateTo(node.flatIndex) && !this.presenter.busy();
  }

  /**
   * `'true'` on a header that cannot be navigated to, `null` otherwise.
   * Folds two channels into one binding: a `disabled` step and a
   * linear-unreachable step both read as `aria-disabled`, so the gate is
   * announced rather than silently ignored. The header stays focusable
   * per the ARIA composite-widget disabled-focusable rule. In
   * `'visited'` + `linear=false` this is byte-identical to the
   * prior `node.disabled()`-only binding, since `canNavigateTo` returns
   * `true` for every enabled step when linear is off.
   */
  protected headerAriaDisabled(node: CngxStepNode): 'true' | null {
    return this.isHeaderReachable(node) ? null : 'true';
  }

  /** Strip-scoped arrow-key handler. See {@link createStepperStripKeyboardNav}. */
  protected readonly handleStripKeyDown = createStepperStripKeyboardNav({
    presenter: this.presenter,
    hostElement: this.hostElement,
    flatStepCount: () => this.flatSteps().length,
    stepButtonIdFor: (id) => `${id}-header`,
    // Defers the post-move focus to afterNextRender so arrow-key
    // navigation across a collapsed group boundary lands on the target
    // button after the strip re-renders its node set.
    injector: this.injector,
    // Off in 'none' mode (inert labels) and while a commit is in flight,
    // so arrow-key navigation locks with the headers + footer during an
    // async transition.
    enabled: () => this.resolvedHeaderNavigation() !== 'none' && !this.presenter.busy(),
  });

  /**
   * Clear the presenter's `lastFailedIndex`. Lets template-ref consumers
   * (`#s="cngxStepper"`) dismiss the rejection decoration without injecting
   * {@link CNGX_STEPPER_HOST}.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }

  // CngxStepPanelHost contract - O(1) via the pre-built map.
  labelTemplateFor(id: string): TemplateRef<CngxStepLabelContext> | null {
    return this.stepDirectiveById().get(id)?.labelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<CngxStepContentContext> | null {
    return this.stepDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null;
  }
}
