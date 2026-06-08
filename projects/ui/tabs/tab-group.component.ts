import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  contentChild,
  contentChildren,
  ElementRef,
  inject,
  Injector,
  input,
  isDevMode,
  linkedSignal,
  signal,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import {
  CNGX_FOCUSABLE_SELECTOR,
  CngxFocusRestore,
  CngxLiveRegion,
} from '@cngx/common/a11y';
import {
  CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
  CNGX_TABS_GLYPHS,
  CNGX_TAB_GROUP_HOST,
  CNGX_TAB_PANEL_HOST,
  CngxTab,
  CngxTabAddIcon,
  CngxTabBusySpinner,
  CngxTabCloseIcon,
  CngxTabErrorBadge,
  CngxTabGroupPresenter,
  CngxTabIcon,
  CngxTabRejectionIcon,
  createTabDismissals,
  createTabGroupAnnouncements,
  createTabGroupTemplateBindings,
  createTabKeyboardNav,
  createTabsHostAttrs,
  injectTabsConfig,
  injectTabsI18n,
  type CngxTabBusySpinnerContext,
  type CngxTabDismissals,
  type CngxTabKeyboardNav,
  type CngxTabErrorBadgeContext,
  type CngxTabGroupAnnouncements,
  type CngxTabGroupTemplateBindings,
  type CngxTabHandle,
  type CngxTabAlign,
  type CngxTabIconContext,
  type CngxTabIconLayout,
  type CngxTabPanelHost,
  type CngxTabRejectionIconContext,
  type CngxTabsHostAttrs,
  type CngxTabsPanelMode,
  type CngxTabsSkin,
} from '@cngx/common/tabs';

/**
 * CNGX tab-group organism. Thin shell over {@link CngxTabGroupPresenter}
 * + `CngxFocusRestore` via `hostDirectives`. The APG tablist keyboard
 * model (automatic activation: arrow keys move focus AND select; Home/End
 * jump to first/last; the active tab is the lone tab stop) lives in
 * {@link createTabKeyboardNav}, deriving the roving stop from the
 * presenter's `activeId` rather than a competing index. Material variant
 * lives at `[cngxMatTabs]` in `@cngx/ui/mat-tabs`.
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
 * @relatedTo CngxTabOverflow, CngxTabGroupPresenter, CngxTab, CngxFocusRestore
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
  imports: [NgTemplateOutlet, CngxLiveRegion],
  styleUrls: ['../../common/tabs/styles/tabs-base.css', './tab-group.component.css'],
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['activeIndex', 'orientation', 'loop', 'commitAction', 'commitMode'],
      outputs: ['activeIndexChange', 'tabClose', 'tabAdd'],
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
    '[attr.data-skin]': 'hostAttrs.resolvedSkin()',
    '[attr.data-icon-layout]': 'hostAttrs.resolvedIconLayout()',
    '[attr.data-panel-mode]': 'hostAttrs.resolvedPanelMode()',
    '[attr.data-fitted]': "hostAttrs.resolvedFitted() ? '' : null",
    '[attr.data-tab-align]': 'hostAttrs.resolvedTabAlign()',
    '[attr.aria-label]': 'announcements.resolvedAriaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledBy()',
    '[class.cngx-tabs]': 'true',
  },
})
export class CngxTabGroup implements CngxTabPanelHost {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /**
   * Visual skin. Cascade `input ?? config ?? 'line'`, resolved by
   * {@link hostAttrs} and reflected onto `[data-skin]`. The skin is a
   * pure CSS concern - structure, slots, ARIA, and keyboard behaviour
   * are identical across all values. Public (consumer-facing input,
   * like `ariaLabel`); the resolved value, not the raw input, is what
   * the host binding reads.
   */
  readonly skin = input<CngxTabsSkin | undefined>(undefined);
  /**
   * Icon layout. Cascade `input ?? config ?? 'start'`, reflected onto
   * `[data-icon-layout]`. Orthogonal to skin and orientation.
   */
  readonly iconLayout = input<CngxTabIconLayout | undefined>(undefined);
  /**
   * Panel render strategy. Cascade `input ?? config ?? 'eager'`,
   * reflected onto `[data-panel-mode]`. `'eager'` (default) renders every
   * panel's content up front (byte-identical to before this input
   * existed); `'lazy'` keep-alives content after first activation;
   * `'lazy-destroy'` renders only the active panel's content. The panel
   * `<div>` always stays in the DOM regardless.
   */
  readonly panelMode = input<CngxTabsPanelMode | undefined>(undefined);
  /** Stretch tabs to fill the strip width (horizontal only); reflects `[data-fitted]`. Cascade `input ?? config ?? false`. */
  readonly fitted = input<boolean | undefined>(undefined);
  /** Tab-cluster alignment when not fitted (horizontal only); reflects `[data-tab-align]`. Cascade `input ?? config ?? 'start'`. */
  readonly tabAlign = input<CngxTabAlign | undefined>(undefined);
  /**
   * Whether tabs render a close affordance. Cascade
   * `input ?? config ?? false`. A per-`CngxTab` `[closable]` override
   * wins over this group default. When on, each closable tab gets a
   * close button (and Delete on the focused tab closes it); the
   * `(tabClose)` output fires with the tab id and index for the
   * consumer to remove from its data.
   */
  readonly closable = input<boolean | undefined>(undefined);
  /**
   * Whether the group renders an add-tab button after the strip. Cascade
   * `input ?? config ?? false`. When on, the `(tabAdd)` output fires for
   * the consumer to append a tab to its data.
   */
  readonly addable = input<boolean | undefined>(undefined);

  protected readonly presenter = inject(CNGX_TAB_GROUP_HOST);
  protected readonly i18n = injectTabsI18n();
  protected readonly config = injectTabsConfig();
  /** Default-glyph table for the template's fallback spans. */
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
  private readonly iconSlot = contentChild(CngxTabIcon);
  private readonly closeIconSlot = contentChild(CngxTabCloseIcon);
  private readonly addIconSlot = contentChild(CngxTabAddIcon);

  /**
   * Dismissable / addable affordance surface (close + add resolution,
   * close interaction, focus restoration). Level-2 helper keeps the
   * cascade + handlers off the organism class (LOC guard).
   */
  protected readonly dismiss: CngxTabDismissals = createTabDismissals({
    host: this.presenter,
    config: this.config,
    i18n: this.i18n,
    closable: this.closable,
    addable: this.addable,
    hostElement: this.hostElement,
    injector: this.injector,
  });

  /**
   * APG tablist keyboard model (automatic activation). Owns arrow / Home /
   * End resolution, the `host.select()` activation, and focus movement;
   * derives each tab's roving `tabindex` from the presenter's `activeId`
   * (single source of truth). Level-2 helper keeps the keyboard logic off
   * the organism class (LOC guard).
   */
  protected readonly keyboard: CngxTabKeyboardNav = createTabKeyboardNav({
    host: this.presenter,
    hostElement: this.hostElement,
  });

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

  /**
   * Resolved skin / icon-layout cascade (`input ?? config ?? default`),
   * read by the `[data-skin]` / `[data-icon-layout]` host bindings. The
   * Level-2 helper keeps the cascade off the organism class (LOC guard).
   */
  protected readonly hostAttrs: CngxTabsHostAttrs = createTabsHostAttrs({
    skin: this.skin,
    iconLayout: this.iconLayout,
    panelMode: this.panelMode,
    fitted: this.fitted,
    tabAlign: this.tabAlign,
    config: this.config,
  });

  /**
   * Whether the active panel contains a natively-focusable descendant.
   * Resolved by a post-render DOM probe (the only way to know - the
   * panel content is consumer-projected). Drives {@link panelTabindex}:
   * a panel with no focusable child earns one tab stop so keyboard users
   * can still reach its content (APG tabpanel pattern); a panel that
   * already has reachable content does not (no redundant stop). Boolean
   * with default `Object.is`, so a stable probe never re-triggers CD.
   */
  private readonly activePanelHasFocusable = signal(false);

  constructor() {
    // Self-healing scroll loop: activeId change -> scrollIntoView ->
    // overflow IO sees new visibility -> More dropdown self-trims.
    // Policy is swappable via CNGX_ORGANISM_SCROLL_SYNC_FACTORY.
    inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)({
      activeId: this.presenter.activeId,
      hostElement: this.hostElement,
      injector: this.injector,
    });

    // APG tabpanel focus probe. afterRenderEffect re-runs after render
    // whenever its tracked dep (the active panel id) changes - i.e. on
    // every tab switch, which is when the active panel (always rendered
    // in every panelMode) gets its current content. Reading the DOM is
    // the only way to know whether the consumer-projected content is
    // focusable. The boolean set is not read inside the effect, so it
    // never re-triggers itself, and its default Object.is equality makes
    // a stable probe a no-op. Scope: content that mutates inside the
    // already-active panel without a tab switch (late async content) is
    // not re-probed - an accepted heuristic limit, not a correctness bug.
    afterRenderEffect(() => {
      // Tracked: re-probe when the active panel changes.
      this.presenter.activeId();
      const panel = this.hostElement.querySelector<HTMLElement>(
        '.cngx-tabs__panel:not([hidden])',
      );
      this.activePanelHasFocusable.set(
        panel?.querySelector(CNGX_FOCUSABLE_SELECTOR) != null,
      );
    });

    if (isDevMode()) {
      // One-shot post-mount check: icon-only hides the label, so a
      // missing *cngxTabIcon template leaves the tab visually empty.
      // afterNextRender runs once, off the reactive graph.
      afterNextRender(() => {
        if (this.hostAttrs.resolvedIconLayout() === 'only' && !this.iconSlot()) {
          console.warn(
            "[cngx-tab-group] iconLayout='only' but no *cngxTabIcon template " +
              'is provided - tabs render no icon and the label is visually ' +
              "hidden. Provide an <ng-template cngxTabIcon> or use 'start' / 'end' / 'top'.",
          );
        }
      });
    }
  }

  // Map<id, CngxTab> for O(1) labelTemplateFor / contentTemplateFor.
  // Structural equal on id-set + directive identity prevents cascade
  // on shape-stable contentChildren re-emissions.
  private readonly tabDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.tabDirectives,
  });

  /**
   * Resolved 3-stage cascade for `errorBadge`, `rejectionIcon`,
   * `busySpinner`, `icon`. `null` -> render built-in default (or, for
   * `icon`, render nothing).
   */
  protected readonly templates: CngxTabGroupTemplateBindings = createTabGroupTemplateBindings({
    errorBadgeSlot: this.errorBadgeSlot,
    rejectionIconSlot: this.rejectionIconSlot,
    busySpinnerSlot: this.busySpinnerSlot,
    iconSlot: this.iconSlot,
    closeIconSlot: this.closeIconSlot,
    addIconSlot: this.addIconSlot,
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

  /**
   * APG tabpanel `tabindex`: `0` only when the selected panel has no
   * focusable descendant (so its content is keyboard-reachable from the
   * tablist), else `null` - never a redundant tab stop. Inactive panels
   * are `null` (they are `[hidden]`).
   */
  protected panelTabindex(tab: CngxTabHandle): 0 | null {
    return this.isSelected(tab) && !this.activePanelHasFocusable() ? 0 : null;
  }

  /**
   * Keep-alive set for `panelMode='lazy'`: the ids of every tab that has
   * ever been activated. Derived history (Pillar 1) - a `linkedSignal`
   * accumulating onto its own previous value as `activeId` moves, NOT an
   * `effect` that writes a set. The structural `equal` (size + membership)
   * means re-activating an already-seen tab returns an equal set, so the
   * reference is stable and downstream `shouldRenderContent` reads do not
   * churn. Unbounded by design: `lazy` trades retention (every visited
   * panel's content stays alive for the directive's life) for keep-alive;
   * the set is bounded by tab count, and `lazy-destroy` is the bounded
   * alternative when retention is unwanted.
   */
  private readonly seenIds = linkedSignal<string | null, ReadonlySet<string>>({
    source: () => this.presenter.activeId(),
    computation: (id, prev) => {
      const next = new Set(prev?.value ?? []);
      if (id != null) {
        next.add(id);
      }
      return next;
    },
    equal: (a, b) => a.size === b.size && [...a].every((x) => b.has(x)),
  });

  /**
   * Whether a tab's panel content should be rendered now. The panel
   * `<div>` is always in the DOM (the `aria-controls` target); only its
   * inner content is gated. `eager` is byte-identical to the original
   * behaviour (everything rendered, visibility toggled via `[hidden]`).
   */
  protected shouldRenderContent(tab: CngxTabHandle): boolean {
    switch (this.hostAttrs.resolvedPanelMode()) {
      case 'lazy':
        return this.seenIds().has(tab.id);
      case 'lazy-destroy':
        return this.isSelected(tab);
      default:
        return true;
    }
  }

  protected tabDescriptorId(tab: CngxTabHandle): string {
    return `${tab.id}-desc`;
  }

  /** `true` when a bound error-aggregator opted in to revealing errors. */
  protected showErrorBadge(tab: CngxTabHandle): boolean {
    return !!tab.errorAggregator()?.shouldShow();
  }

  /**
   * Context for `*cngxTabIcon`. Allocates fresh per CD - `active` is
   * reactive (selection), and `*ngTemplateOutlet` only re-evaluates
   * `let-*` bindings when the context reference changes (`Object.is`
   * input-diff); a `WeakMap`-cached object with a mutated `active`
   * would leave consumer bindings stale. Same pattern as
   * {@link busySpinnerContextFor}.
   */
  protected iconContextFor(tab: CngxTabHandle, index: number): CngxTabIconContext {
    return { tab, active: this.isSelected(tab), index };
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

  /**
   * Roving `tabindex` for a tab button: `0` for the active tab, `-1` for
   * the rest, so the tablist is a single tab stop (APG) and `Tab` lands
   * on the active tab. Derived in {@link keyboard} from `activeId`.
   */
  protected tabTabindex(tab: CngxTabHandle): 0 | -1 {
    return this.keyboard.tabTabindex(tab);
  }

  /**
   * Single `(keydown)` entry for a tab button: APG navigation
   * (arrows / Home / End, automatic activation) first, then Delete-to-close
   * when navigation did not consume the event.
   */
  protected handleTabKeydown(tab: CngxTabHandle, event: KeyboardEvent): void {
    this.keyboard.handleKeydown(event);
    if (event.defaultPrevented) {
      return;
    }
    this.dismiss.handleTabKeydown(tab, event);
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

  subLabelTemplateFor(id: string): TemplateRef<unknown> | null {
    return this.tabDirectiveById().get(id)?.subLabelTemplate()?.templateRef ?? null;
  }

  contentTemplateFor(id: string): TemplateRef<unknown> | null {
    return this.tabDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null;
  }
}
