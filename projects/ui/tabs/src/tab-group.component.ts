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
  linkedSignal,
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
  createTabGroupTemplateBindings,
  injectTabsConfig,
  injectTabsI18n,
  type CngxTabBusySpinnerContext,
  type CngxTabErrorBadgeContext,
  type CngxTabGroupTemplateBindings,
  type CngxTabHandle,
  type CngxTabPanelHost,
  type CngxTabRejectionIconContext,
} from '@cngx/common/tabs';

/**
 * CNGX-standard tab-group organism. Thin shell composing the
 * {@link CngxTabGroupPresenter} brain with `CngxRovingTabindex` and
 * `CngxFocusRestore` via `hostDirectives`. Material consumers reach
 * for `<cngx-mat-tab-group>` (sibling `@cngx/ui/mat-tabs` entry
 * planned for Phase D3) instead.
 *
 * The presenter owns `activeIndex`, `orientation`, `loop`,
 * `commitAction`, `commitMode`; the organism forwards them through
 * `hostDirectives.inputs`. Renders the strip + panels via two
 * `@for` loops over `presenter.tabs()`. Reactive ARIA — every
 * `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-busy`,
 * `aria-orientation` is a `computed()` or signal-reading method,
 * never a one-time binding.
 *
 * `CngxLiveRegion` is intentionally NOT composed via
 * `hostDirectives` — its host binding sets `role="status"` which
 * would clobber the wrapper's `role="group"` landmark. Phase 3
 * commit 1 will mount a dedicated `<span cngxLiveRegion>` inside
 * the template for SR announcements.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-tab-group',
  exportAs: 'cngxTabGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxLiveRegion, CngxRovingItem],
  styleUrls: [
    '../../../common/tabs/src/styles/tabs-base.css',
    './tab-group.component.css',
  ],
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: [
        'activeIndex',
        'orientation',
        'loop',
        'commitAction',
        'commitMode',
      ],
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
    role: 'group',
    '[attr.aria-roledescription]': 'tabsRoleDescription()',
    '[attr.aria-orientation]': 'presenter.orientation()',
    '[attr.data-orientation]': 'presenter.orientation()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
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
  /**
   * Internal default-glyph table read inside the template's
   * built-in fallback spans (`{{ glyphs.errorBadge }}` /
   * `{{ glyphs.rejectionIcon }}`). Exposed as a protected field so
   * the host markup stays declarative — Pillar 1 (no inline literals
   * driving Pillar-2 visual surfaces).
   */
  protected readonly glyphs = CNGX_TABS_GLYPHS;
  private readonly hostElement: HTMLElement = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement;
  private readonly injector = inject(Injector);
  private readonly tabDirectives = contentChildren(CngxTab, {
    descendants: true,
  });

  /**
   * Per-instance skin slots. Resolved through the 3-stage cascade in
   * {@link templates}: per-instance `*cngxTab*` directive >
   * `CNGX_TABS_CONFIG.templates.<key>` > organism's built-in default.
   *
   * AOT requires `contentChild()` calls to be direct field
   * initialisers on the variant component (NG8110 rejects them from
   * helper functions); the resolved cascade signals live in
   * {@link templates} via `createTabGroupTemplateBindings`.
   */
  private readonly errorBadgeSlot = contentChild(CngxTabErrorBadge);
  private readonly rejectionIconSlot = contentChild(CngxTabRejectionIcon);
  private readonly busySpinnerSlot = contentChild(CngxTabBusySpinner);

  constructor() {
    // Self-healing scroll loop — when the active tab changes (via
    // direct click on a visible tab, keyboard nav, or selectById from
    // the overflow molecule), bring the matching button into the
    // strip's visible area. The IntersectionObserver in
    // <cngx-tab-overflow> picks up the new visibility on the next
    // tick and the More dropdown self-trims. Plan §"Selection Loop".
    // Extracted to `createOrganismScrollSync` in `@cngx/common/tabs`
    // so future organisms can share the shape; routed through
    // `CNGX_ORGANISM_SCROLL_SYNC_FACTORY` so consumers can swap the
    // scroll policy (instant, custom selector, reduced-motion opt-out)
    // without forking the organism.
    inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)({
      activeId: this.presenter.activeId,
      hostElement: this.hostElement,
      injector: this.injector,
    });

    // Eager seed for {@link priorActiveIndex} — `linkedSignal` is
    // lazy: without this read its first computation runs only on the
    // FIRST live-region announcement, which in test/CD scenarios
    // already coincides with the post-nav activeIndex, leaving
    // `prev?.source` undefined and the direction prefix unfired.
    // Reading once at construction captures the pre-nav activeIndex
    // so the linkedSignal's `prev.source` carries it forward.
    this.priorActiveIndex();
  }

  /**
   * Tabs landmark `aria-roledescription`. Defaults to the W3C ARIA
   * tablist convention (`'tab list'`) — deliberately distinct from
   * `i18n.tabsLabel`, which feeds `aria-label`. Pillar 2: the two
   * announce different things to AT (the *kind of region* vs *which
   * region*); collapsing them onto one string makes screen readers
   * read the same word twice in a row. Consumers who want a localised
   * role description override via
   * `withTabsFallbackLabels({ tabRoleDescription: 'Reiterleiste' })`.
   */
  protected readonly tabsRoleDescription = computed<string>(
    () => this.config.fallbackLabels?.tabRoleDescription ?? 'tab list',
  );

  /**
   * Tab-panel role-description — read by the per-panel
   * `aria-roledescription` binding. Cascades through
   * `CngxTabsFallbackLabels.tabPanelRoleDescription` → library default
   * `'tab panel'`. Mirrors the `tabsRoleDescription` computed so
   * AT-facing role descriptors flow through one config surface
   * regardless of which scope (button vs panel) declares them.
   */
  protected readonly tabPanelRoleDescription = computed<string>(
    () => this.config.fallbackLabels?.tabPanelRoleDescription ?? 'tab panel',
  );

  /**
   * `aria-label` resolves Input → ariaLabels.tabsRegion config →
   * i18n.tabsLabel. Pillar 2 — the surface declared by config /
   * i18n must reach the DOM.
   */
  protected readonly resolvedAriaLabel = computed<string | null>(() => {
    if (this.ariaLabelledBy()) {
      return null;
    }
    return (
      this.ariaLabel() ??
      this.config.ariaLabels?.tabsRegion ??
      this.i18n.tabsLabel
    );
  });

  // Pre-build a Map<id, CngxTab> so labelTemplateFor /
  // contentTemplateFor are O(1) per call instead of O(N) linear
  // scans on every panel render. Structural `equal` keyed on the
  // id-set + per-id directive identity prevents the Map from
  // cascading downstream every time `contentChildren` re-emits with
  // an unchanged child set.
  private readonly tabDirectiveById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.tabDirectives,
  });

  /**
   * Resolved 3-stage template cascade for the three visible-region
   * skin slots: `errorBadge`, `rejectionIcon`, `busySpinner`. Each
   * field is a `Signal<TemplateRef | null>` — `null` signals the
   * template should render the built-in default span.
   *
   * Mirrors the Phase-3 stepper sibling (`createStepperTemplateBindings`).
   * Single-consumer note: tracked as `tabs-accepted-debt §9` —
   * `<cngx-mat-tabs>` does NOT consume this factory because Material
   * owns the tab-button chrome via its own MDC template. The factory
   * stays uniform with the family pattern; the staging is
   * acknowledged debt.
   */
  protected readonly templates: CngxTabGroupTemplateBindings =
    createTabGroupTemplateBindings({
      errorBadgeSlot: this.errorBadgeSlot,
      rejectionIconSlot: this.rejectionIconSlot,
      busySpinnerSlot: this.busySpinnerSlot,
      config: this.config,
    });

  readonly tabs: Signal<readonly CngxTabHandle[]> = this.presenter.tabs;
  readonly activeIndex: Signal<number> = this.presenter.activeIndex;
  readonly activeId: Signal<string | null> = this.presenter.activeId;
  readonly orientation: Signal<'horizontal' | 'vertical'> =
    this.presenter.orientation;

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

  /**
   * Tracks the previous activeIndex value so the live-region's
   * success-arm announcement can prepend a direction phrase
   * (`i18n.previousTab` / `i18n.nextTab`) when navigation crosses
   * tab boundaries. `linkedSignal` with `prev?.source` returns the
   * SOURCE value at the moment before the most recent change — exactly
   * the "prior activeIndex" semantic — without duplicating state in an
   * `effect` (Pillar 1). Initial value coalesces to current so the
   * first emission compares like-for-like and produces no spurious
   * direction.
   */
  private readonly priorActiveIndex = linkedSignal<number, number>({
    source: () => this.presenter.activeIndex(),
    computation: (curr, prev) => prev?.source ?? curr,
    equal: Object.is,
  });

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
   * Priority chain on the `success` arm:
   *   1. `${i18n.previousTab} | ${i18n.selectedTab(label, position, count)}`
   *      when the navigation moved backward (new index < prior index).
   *   2. `${i18n.nextTab} | ${i18n.selectedTab(...)}` when forward.
   *   3. Bare `i18n.selectedTab(...)` when the index did not change
   *      (initial mount or commit-success that lands the user back on
   *      the same tab) — keeps the announcement non-empty so AT
   *      consumers receive feedback that the action settled.
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
      // `previous` reads stay reactive but are not gated — synchronous
      // commit-handler errors collapse pending → error in a single
      // signal-flush tick, so the tracker captures
      // `previous = 'idle'` rather than `'pending'`. Loosening the
      // guard keeps the announcement reachable for sync-rejection
      // actions (`commitAction = () => false`) while staying silent
      // on `idle` and `success`.
      const failedIdx = this.presenter.lastFailedIndex();
      const originIdx = this.presenter.originIndexDuringCommit();
      if (failedIdx !== undefined && originIdx !== undefined) {
        const originLabel = this.presenter.tabs()[originIdx]?.label();
        if (originLabel) {
          return this.i18n.commitRolledBackTo(originLabel);
        }
      }
      return this.i18n.commitFailedRetry;
    }
    if (current === 'success') {
      const tabs = this.presenter.tabs();
      const idx = this.presenter.activeIndex();
      const tab = tabs[idx];
      if (!tab) {
        return '';
      }
      const label = tab.label() ?? '';
      const positionPhrase = this.i18n.selectedTab(label, idx + 1, tabs.length);
      const prevIdx = this.priorActiveIndex();
      if (idx > prevIdx) {
        return `${this.i18n.nextTab}: ${positionPhrase}`;
      }
      if (idx < prevIdx) {
        return `${this.i18n.previousTab}: ${positionPhrase}`;
      }
      return positionPhrase;
    }
    return '';
  });

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
   * Context object passed to the `*cngxTabErrorBadge` slot template.
   * Re-derived on every CD tick — outlets memoise their embedded
   * views by template + context-by-key, so the rebuild cost is the
   * `tab` reference comparison only.
   */
  protected errorBadgeContextFor(tab: CngxTabHandle): CngxTabErrorBadgeContext {
    return { tab };
  }

  /**
   * Context object passed to the `*cngxTabBusySpinner` slot template.
   * `intendedIndex` is asserted non-undefined because the gate
   * `isTabBusy(tab)` already returned `true` (which requires the
   * presenter's `intendedIndex()` to be defined and to point at the
   * matching handle).
   */
  protected busySpinnerContextFor(
    tab: CngxTabHandle,
  ): CngxTabBusySpinnerContext {
    return { tab, intendedIndex: this.presenter.intendedIndex() ?? -1 };
  }

  /**
   * Context object passed to the `*cngxTabRejectionIcon` slot template.
   * `originLabel` resolves through the same priority chain as
   * `liveAnnouncement` — `originIndexDuringCommit` -> `tabs()[idx].label()`
   * — so the visual decoration phrasing matches the SR announcement.
   */
  protected rejectionIconContextFor(
    failedIndex: number,
  ): CngxTabRejectionIconContext {
    const originIdx = this.presenter.originIndexDuringCommit();
    const originLabel =
      originIdx !== undefined ? this.presenter.tabs()[originIdx]?.label() : undefined;
    return { failedIndex, originLabel };
  }

  /**
   * SR descriptor phrase. Reads the aggregator's `announcement()`
   * when one is bound and revealed; falls back to
   * `i18n.tabHasErrors(errorCount)` when the aggregator wants reveal
   * but supplies an empty announcement string — the i18n fallback
   * surfaces a consistent count phrase instead of leaving the
   * descriptor span empty (the cngx A11y rule: ids always present,
   * content reactive). Returns empty string when no aggregator wants
   * reveal at all (no decoration to describe).
   */
  protected statusPhrase(tab: CngxTabHandle): string {
    const aggregator = tab.errorAggregator();
    if (!aggregator?.shouldShow()) {
      return '';
    }
    const announcement = aggregator.announcement();
    if (announcement) {
      return announcement;
    }
    return this.i18n.tabHasErrors(aggregator.errorCount());
  }

  /**
   * Verbose accessible name for each tab button. Replaces the bare
   * label text content with the i18n `selectedTab(label, position, count)`
   * phrase so AT users hear "Tab 2 of 5: Settings" instead of just
   * "Settings, tab" — position context is now in-band rather than
   * inferred from tablist enumeration.
   *
   * The visual label span continues to render the bare `label`
   * (`tab.label()`); `aria-label` takes precedence over text content
   * for AT, leaving sighted users unaffected. Reactive — re-derives
   * when the tab's label or count changes.
   */
  protected tabAriaLabel(tab: CngxTabHandle, position: number): string {
    const tabs = this.tabs();
    return this.i18n.selectedTab(tab.label() ?? '', position, tabs.length);
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

  // CngxTabPanelHost contract — selectById delegates to the
  // presenter, which owns clamping / disabled-skip / commit-action
  // gating policy.
  selectById(id: string): void {
    this.presenter.selectById(id);
  }

  /**
   * Clear the persisted `lastFailedIndex` rejection flag on the
   * presenter — public delegator mirroring the {@link selectById}
   * pass-through pattern so consumers using a template ref
   * (`#tg="cngxTabGroup"`) can dismiss the rejection decoration
   * programmatically without injecting the host token.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }

  labelTemplateFor(id: string): TemplateRef<unknown> | null {
    return (
      this.tabDirectiveById().get(id)?.labelTemplate()?.templateRef ?? null
    );
  }

  contentTemplateFor(id: string): TemplateRef<unknown> | null {
    return (
      this.tabDirectiveById().get(id)?.contentTemplate()?.templateRef ?? null
    );
  }
}
