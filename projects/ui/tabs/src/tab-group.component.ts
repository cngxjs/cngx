import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  CNGX_TAB_GROUP_HOST,
  CNGX_TAB_PANEL_HOST,
  CngxTab,
  CngxTabGroupPresenter,
  createDirectiveByIdMap,
  createOrganismScrollSync,
  injectTabsConfig,
  injectTabsI18n,
  type CngxTabHandle,
  type CngxTabPanelHost,
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
  private readonly hostElement: HTMLElement = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement;
  private readonly injector = inject(Injector);
  private readonly tabDirectives = contentChildren(CngxTab, {
    descendants: true,
  });

  constructor() {
    // Self-healing scroll loop — when the active tab changes (via
    // direct click on a visible tab, keyboard nav, or selectById from
    // the overflow molecule), bring the matching button into the
    // strip's visible area. The IntersectionObserver in
    // <cngx-tab-overflow> picks up the new visibility on the next
    // tick and the More dropdown self-trims. Plan §"Selection Loop".
    // Extracted to `createOrganismScrollSync` in `@cngx/common/tabs`
    // so future organisms can share the shape.
    createOrganismScrollSync({
      activeId: this.presenter.activeId,
      hostElement: this.hostElement,
      injector: this.injector,
    });
  }

  /** Tabs landmark role-description — i18n / config cascade. */
  protected readonly tabsRoleDescription = computed<string>(
    () =>
      this.config.fallbackLabels?.tabRoleDescription ?? this.i18n.tabsLabel,
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
  private readonly tabDirectiveById = createDirectiveByIdMap<CngxTab>({
    source: this.tabDirectives,
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
   * SR descriptor phrase. Reads the aggregator's `announcement()`
   * when one is bound and revealed; otherwise empty (the descriptor
   * span ID stays in the DOM either way per the cngx A11y rule —
   * IDs always present, content reactive).
   */
  protected statusPhrase(tab: CngxTabHandle): string {
    const aggregator = tab.errorAggregator();
    if (aggregator?.shouldShow()) {
      return aggregator.announcement();
    }
    return '';
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
