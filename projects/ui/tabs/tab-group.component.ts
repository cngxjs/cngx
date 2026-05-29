import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
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
  CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
  CNGX_TABS_GLYPHS,
  CNGX_TAB_GROUP_HOST,
  CNGX_TAB_PANEL_HOST,
  CngxTab,
  CngxTabBusySpinner,
  CngxTabErrorBadge,
  CngxTabGroupPresenter,
  CngxTabRejectionIcon,
  createTabGroupAnnouncements,
  createTabGroupTemplateBindings,
  injectTabsConfig,
  injectTabsI18n,
  type CngxTabBusySpinnerContext,
  type CngxTabErrorBadgeContext,
  type CngxTabGroupAnnouncements,
  type CngxTabGroupTemplateBindings,
  type CngxTabHandle,
  type CngxTabPanelHost,
  type CngxTabRejectionIconContext,
} from '@cngx/common/tabs';

/**
 * CNGX tab-group organism. Thin shell over {@link CngxTabGroupPresenter}
 * + `CngxRovingTabindex` + `CngxFocusRestore` via `hostDirectives`.
 * Material variant lives at `[cngxMatTabs]` in `@cngx/ui/mat-tabs`.
 *
 * All ARIA attrs are signal-driven - never one-shot bindings.
 * `CngxLiveRegion` is mounted as a child `<span>` rather than a
 * host directive: its `role="status"` would clobber the wrapper's
 * `role="group"` landmark.
 *
 * @playground Form error aggregation ./examples/form-errors/form-errors.component.ts
 * @see {@link CngxMatTabs} for the Material `<mat-tab-group>` variant with `[cngxMatTabError]`.
 *
 * @category ui/tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/tabs/tab-group.component.ts
 * @since 0.1.0
 * @relatedTo CngxTabOverflow, CngxTabGroupPresenter, CngxTab, CngxRovingTabindex, CngxFocusRestore
 * <example-url>http://localhost:4200/#/ui/tabs/tab-commit-action/optimistic-pessimistic-commits-with-bridge-directives</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-error-aggregation/per-tab-error-badges</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-group-vertical/vertical-sidebar-tabs</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-group/three-tab-navigation</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-overflow/8-tabs-in-a-narrow-container</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-slot-overrides/custom-busy-spinner-via-code-cngxtabbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-slot-overrides/custom-error-badge-via-code-cngxtaberrorbadge-code</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-slot-overrides/rejection-decoration-via-code-cngxtabrejectionicon-code</example-url>
 */
@Component({
  selector: 'cngx-tab-group',
  exportAs: 'cngxTabGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxLiveRegion, CngxRovingItem],
  styleUrls: ['../../common/tabs/styles/tabs-base.css', './tab-group.component.css'],
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['activeIndex', 'orientation', 'loop', 'commitAction', 'commitMode'],
      outputs: ['activeIndexChange'],
    },
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation', 'loop'],
    },
    { directive: CngxFocusRestore },
  ],
  providers: [{ provide: CNGX_TAB_PANEL_HOST, useExisting: CngxTabGroup }],
  templateUrl: './tab-group.component.html',
  host: {
    class: 'cngx-tab-group',
    role: 'group',
    '[attr.aria-roledescription]': 'announcements.tabsRoleDescription()',
    '[attr.aria-orientation]': 'presenter.orientation()',
    '[attr.data-orientation]': 'presenter.orientation()',
    '[attr.aria-label]': 'announcements.resolvedAriaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[class.cngx-tabs]': 'true',
  },
})
export class CngxTabGroup implements CngxTabPanelHost {
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledBy = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  protected readonly presenter = inject(CNGX_TAB_GROUP_HOST);
  protected readonly i18n = injectTabsI18n();
  protected readonly config = injectTabsConfig();
  /** Default-glyph table for the template's fallback spans. Pillar 1. */
  protected readonly glyphs = CNGX_TABS_GLYPHS;
  private readonly hostElement: HTMLElement =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly tabDirectives = contentChildren(CngxTab, {
    descendants: true,
  });

  /**
   * Per-instance skin slots. Resolved via 3-stage cascade in {@link templates}:
   * `*cngxTab*` directive > `CNGX_TABS_CONFIG.templates.<key>` > built-in.
   * AOT (NG8110) requires `contentChild()` to be a direct field initialiser
   * on the variant - cascade resolution is delegated to the factory.
   */
  private readonly errorBadgeSlot = contentChild(CngxTabErrorBadge);
  private readonly rejectionIconSlot = contentChild(CngxTabRejectionIcon);
  private readonly busySpinnerSlot = contentChild(CngxTabBusySpinner);

  /**
   * AT-announcement bundle from `@cngx/common/tabs/announcements/`.
   * Owns role descriptions, resolved aria-label, live-region phrasing,
   * and the prior-active-index `linkedSignal` driving the success-arm
   * direction prefix.
   */
  protected readonly announcements: CngxTabGroupAnnouncements = createTabGroupAnnouncements({
    presenter: this.presenter,
    i18n: this.i18n,
    config: this.config,
    ariaLabel: this.ariaLabel,
    ariaLabelledBy: this.ariaLabelledBy,
  });

  constructor() {
    // Self-healing scroll loop: activeId change -> scrollIntoView ->
    // overflow IO sees new visibility -> More dropdown self-trims.
    // Policy is swappable via CNGX_ORGANISM_SCROLL_SYNC_FACTORY.
    inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)({
      activeId: this.presenter.activeId,
      hostElement: this.hostElement,
      injector: this.injector,
    });
  }

  // Map<id, CngxTab> for O(1) labelTemplateFor / contentTemplateFor.
  // Structural equal on id-set + directive identity prevents cascade
  // on shape-stable contentChildren re-emissions.
  private readonly tabDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.tabDirectives,
  });

  /**
   * Resolved 3-stage cascade for `errorBadge`, `rejectionIcon`, `busySpinner`.
   * `null` -> render built-in default span.
   */
  protected readonly templates: CngxTabGroupTemplateBindings = createTabGroupTemplateBindings({
    errorBadgeSlot: this.errorBadgeSlot,
    rejectionIconSlot: this.rejectionIconSlot,
    busySpinnerSlot: this.busySpinnerSlot,
    config: this.config,
  });

  readonly tabs: Signal<readonly CngxTabHandle[]> = this.presenter.tabs;
  readonly activeIndex: Signal<number> = this.presenter.activeIndex;
  readonly activeId: Signal<string | null> = this.presenter.activeId;
  readonly orientation: Signal<'horizontal' | 'vertical'> = this.presenter.orientation;

  protected isSelected(tab: CngxTabHandle): boolean {
    return tab.id === this.activeId();
  }

  protected isTabBusy(tab: CngxTabHandle): boolean {
    if (this.presenter.commitState.status() !== 'pending') {
      return false;
    }
    const intended = this.presenter.intendedIndex();
    if (intended === undefined) {
      return false;
    }
    return this.tabs()[intended]?.id === tab.id;
  }

  protected tabHeaderId(tab: CngxTabHandle): string {
    return `${tab.id}-header`;
  }

  protected tabPanelId(tab: CngxTabHandle): string {
    return `${tab.id}-panel`;
  }

  protected tabDescriptorId(tab: CngxTabHandle): string {
    return `${tab.id}-desc`;
  }

  /** `true` when a bound error-aggregator opted in to revealing errors. */
  protected showErrorBadge(tab: CngxTabHandle): boolean {
    return !!tab.errorAggregator()?.shouldShow();
  }

  /**
   * Stable per-tab `*cngxTabErrorBadge` context cache. Context is
   * `{ tab }` only (no reactive fields), so a `WeakMap` keeps the
   * reference stable and lets `*ngTemplateOutlet`'s `Object.is`
   * input-diff short-circuit the embedded-view rebind.
   */
  private readonly errorBadgeContextCache = new WeakMap<CngxTabHandle, CngxTabErrorBadgeContext>();

  /** `WeakMap`-cached context for `*cngxTabErrorBadge`. Stable ref per tab. */
  protected errorBadgeContextFor(tab: CngxTabHandle): CngxTabErrorBadgeContext {
    let ctx = this.errorBadgeContextCache.get(tab);
    if (!ctx) {
      ctx = { tab };
      this.errorBadgeContextCache.set(tab, ctx);
    }
    return ctx;
  }

  /**
   * Context for `*cngxTabBusySpinner`. Allocates fresh per CD -
   * `intendedIndex` is reactive, and `*ngTemplateOutlet` only
   * re-evaluates `let-*` bindings when the context reference changes
   * (`Object.is` input-diff); a cached mutated object would leave
   * consumer bindings stale. `intendedIndex` is non-undefined by gate
   * - `isTabBusy(tab)` returning `true` requires it.
   */
  protected busySpinnerContextFor(tab: CngxTabHandle): CngxTabBusySpinnerContext {
    return { tab, intendedIndex: this.presenter.intendedIndex() ?? -1 };
  }

  /**
   * Context for `*cngxTabRejectionIcon`. `originLabel` matches the
   * `liveAnnouncement` priority chain so visual + SR phrasing align.
   * Allocates fresh per CD for the same reason as
   * {@link busySpinnerContextFor}.
   */
  protected rejectionIconContextFor(failedIndex: number): CngxTabRejectionIconContext {
    const originIdx = this.presenter.originIndexDuringCommit();
    const originLabel =
      originIdx !== undefined ? this.presenter.tabs()[originIdx]?.label() : undefined;
    return { failedIndex, originLabel };
  }

  protected handleHeaderClick(tab: CngxTabHandle): void {
    if (tab.disabled()) {
      return;
    }
    const idx = this.tabs().findIndex((t) => t.id === tab.id);
    if (idx >= 0) {
      this.presenter.select(idx);
    }
  }

  // CngxTabPanelHost contract - presenter owns clamping, disabled-skip,
  // commit-action gating.
  selectById(id: string): void {
    this.presenter.selectById(id);
  }

  /**
   * Clear the presenter's `lastFailedIndex` rejection flag - exposed
   * so template-ref consumers (`#tg="cngxTabGroup"`) can dismiss the
   * decoration without injecting the host token.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }

  labelTemplateFor(id: string): TemplateRef<unknown> | null {
    return this.tabDirectiveById().get(id)?.labelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<unknown> | null {
    return this.tabDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null;
  }
}
