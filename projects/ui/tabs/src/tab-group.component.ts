import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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
 * CNGX-standard tab-group organism. Thin shell composing the
 * {@link CngxTabGroupPresenter} brain with `CngxRovingTabindex` and
 * `CngxFocusRestore` via `hostDirectives`. Material consumers reach
 * for `[cngxMatTabs]` from `@cngx/ui/mat-tabs`.
 *
 * The presenter owns `activeIndex`, `orientation`, `loop`,
 * `commitAction`, `commitMode`; the organism forwards them through
 * `hostDirectives.inputs`. Renders the strip + panels via two
 * `@for` loops over `presenter.tabs()`. Reactive ARIA — every
 * `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-busy`,
 * `aria-orientation` is a `computed()` or signal-reading method,
 * never a one-time binding.
 *
 * `CngxLiveRegion` is mounted as a dedicated `<span cngxLiveRegion>`
 * inside the template rather than composed via `hostDirectives`,
 * because its `role="status"` would clobber the wrapper's
 * `role="group"` landmark.
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

  /**
   * AT-announcement + descriptor surfaces extracted into a pure
   * factory under `@cngx/common/tabs/announcements/`. The bundle
   * owns `tabsRoleDescription` / `tabPanelRoleDescription` /
   * `resolvedAriaLabel` / `liveAnnouncement` / `statusPhrase` /
   * `tabAriaLabel` plus the prior-active-index `linkedSignal` slot
   * that drives the success-arm direction prefix. Host bindings and
   * template outlets read through `announcements.<field>()`.
   */
  protected readonly announcements: CngxTabGroupAnnouncements =
    createTabGroupAnnouncements({
      presenter: this.presenter,
      i18n: this.i18n,
      config: this.config,
      ariaLabel: this.ariaLabel,
      ariaLabelledBy: this.ariaLabelledBy,
    });

  constructor() {
    // Self-healing scroll loop — when the active tab changes (via
    // direct click on a visible tab, keyboard nav, or selectById from
    // the overflow molecule), bring the matching button into the
    // strip's visible area. The IntersectionObserver in
    // <cngx-tab-overflow> picks up the new visibility on the next
    // tick and the More dropdown self-trims. Routed through
    // `CNGX_ORGANISM_SCROLL_SYNC_FACTORY` so consumers can swap the
    // scroll policy (instant, custom selector, reduced-motion opt-out)
    // without forking the organism.
    inject(CNGX_ORGANISM_SCROLL_SYNC_FACTORY)({
      activeId: this.presenter.activeId,
      hostElement: this.hostElement,
      injector: this.injector,
    });
  }

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
   * Per-tab cache of the `*cngxTabErrorBadge` slot context. The
   * context object's only field is `{ tab }` — purely tab-keyed,
   * never reactive — so caching it via `WeakMap` keeps the context
   * reference stable across CD ticks. Stable refs let
   * `*ngTemplateOutlet`'s `Object.is` input-diff short-circuit
   * the embedded-view context-update path, eliminating per-CD
   * allocation + rebind cost. Mirrors the select-family
   * `chipRemoveFor` `WeakMap` precedent.
   */
  private readonly errorBadgeContextCache = new WeakMap<
    CngxTabHandle,
    CngxTabErrorBadgeContext
  >();

  /**
   * Context object passed to the `*cngxTabErrorBadge` slot template.
   * Returns the same `WeakMap`-cached object across CD ticks for a
   * given tab handle — `*ngTemplateOutlet` sees a stable reference
   * and skips the context-update path entirely. WeakMap auto-clears
   * with the tab handle's GC.
   */
  protected errorBadgeContextFor(tab: CngxTabHandle): CngxTabErrorBadgeContext {
    let ctx = this.errorBadgeContextCache.get(tab);
    if (!ctx) {
      ctx = { tab };
      this.errorBadgeContextCache.set(tab, ctx);
    }
    return ctx;
  }

  /**
   * Context object passed to the `*cngxTabBusySpinner` slot template.
   * `intendedIndex` is asserted non-undefined because the gate
   * `isTabBusy(tab)` already returned `true` (which requires the
   * presenter's `intendedIndex()` to be defined and to point at the
   * matching handle).
   *
   * Allocates fresh per CD tick. Caching via `WeakMap` does NOT work
   * here: the context carries a reactive `intendedIndex` field that
   * changes between calls, and Angular's `*ngTemplateOutlet` only
   * re-evaluates `let-*` bindings when the context REFERENCE changes
   * (input-diff via `Object.is`); mutating fields on a cached object
   * leaves consumer let-bindings stale. The fresh-per-CD allocation
   * is the correct trade-off until either (a) a real performance
   * signal forces signal-bearing context fields, or (b) Angular
   * gains property-level context-diffing on outlet inputs. See
   * `tabs-accepted-debt §9` cross-reference for the broader
   * decompose discussion.
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
   *
   * Allocates fresh per CD tick — same trade-off as
   * {@link busySpinnerContextFor}: both `failedIndex` and the resolved
   * `originLabel` change reactively, so a `WeakMap`-cached object would
   * leave consumer let-bindings stale. Fresh allocation keeps
   * `*ngTemplateOutlet` re-evaluating let-bindings on each CD.
   */
  protected rejectionIconContextFor(
    failedIndex: number,
  ): CngxTabRejectionIconContext {
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
