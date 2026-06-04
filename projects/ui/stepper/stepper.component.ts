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
  CngxStep,
  STEPPER_DEFAULT_MOBILE_BREAKPOINT,
  CngxStepBadge,
  CngxStepBusySpinner,
  type CngxStepContentContext,
  CngxStepGroupHeader,
  CngxStepIndicator,
  type CngxStepLabelContext,
  CngxStepperEmpty,
  CngxStepperPresenter,
  type CngxStepperMobileIndicatorPosition,
  type CngxStepperSkin,
  CngxStepRejection,
  CNGX_STEPPER_GLYPHS,
  CNGX_STEPPER_HOST,
  CngxStepperCount,
  createStepperAnnouncementBuilders,
  createStepperHostAttrs,
  createStepperSlotContextBuilders,
  createStepperStripKeyboardNav,
  createStepperTemplateBindings,
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
  readonly connectors = input<boolean | undefined, unknown>(undefined, { transform: (v) => (v === undefined ? undefined : coerceBooleanProperty(v)) });

  /**
   * Opt-in `Step N of M` caption under the mobile `'dots'` row. In
   * the `'text'` collapse branch the count IS the indicator and is
   * always rendered; this input only gates the supplemental caption
   * that sits next to the dot row.
   */
  readonly showStepCount = input<boolean>(false);

  readonly mobileIndicatorPosition = input<CngxStepperMobileIndicatorPosition | undefined>(undefined);

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
  private readonly groupHeaderSlot = contentChild(CngxStepGroupHeader);
  private readonly emptySlot = contentChild(CngxStepperEmpty);

  /** Default-template glyph source - read by `#defaultBadge` / `#defaultRejection` outlets. */
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

  protected readonly displayMode = createStepperDisplayMode(this.config.mobileBreakpoint ?? STEPPER_DEFAULT_MOBILE_BREAKPOINT, () => this.config.mobileCollapse, inject(DestroyRef));

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
  protected readonly hostAttrs = createStepperHostAttrs({ skin: this.skin, connectors: this.connectors, mobileIndicatorPosition: this.mobileIndicatorPosition, config: this.config });

  /** Mobile-swipe navigation host directive (Level-2 composition). */
  protected readonly swipeNav = inject(CngxStepperSwipeNav, { host: true });

  protected statusLabelFor = (node: CngxStepNode): string => resolveStepperStatusLabel(node, this.i18n, this.slotContext.isActive(node));
  protected readonly groupRoleDescription = computed<string>(() => this.config.fallbackLabels?.groupRoleDescription ?? 'step group');

  /**
   * `aria-label` cascade: input → `ariaLabels.stepperRegion` → `i18n.stepperLabel`.
   * Pillar 2.
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
   * Position in the step-only flat projection. Group nodes carry `-1`;
   * callers must guard on `kind === 'step'`.
   */
  protected stepIndexOf(node: CngxStepNode): number {
    return node.flatIndex;
  }

  /** Per-step predicates + slot-context builders (Level-2 factory). */
  protected readonly slotContext = createStepperSlotContextBuilders({ presenter: this.presenter, stepsOnly: this.stepsOnly });

  /** Commit-in-flight flag - drives the host `aria-busy` binding. Pillar 2. */
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
  protected readonly announcement = createStepperAnnouncementBuilders({ presenter: this.presenter, stepsOnly: this.stepsOnly, i18n: this.i18n });

  protected handleHeaderClick(node: CngxStepNode): void {
    if (node.kind !== 'step' || node.disabled()) {
      return;
    }
    const idx = this.stepIndexOf(node);
    if (idx >= 0) {
      this.presenter.select(idx);
    }
  }

  /** Strip-scoped arrow-key handler. See {@link createStepperStripKeyboardNav}. */
  protected readonly handleStripKeyDown = createStepperStripKeyboardNav({ presenter: this.presenter, hostElement: this.hostElement, flatStepCount: () => this.flatSteps().length, stepButtonIdFor: (id) => `${id}-header` });

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
