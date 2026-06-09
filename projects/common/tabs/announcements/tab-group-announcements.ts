// Single-consumer factory — staged under family-uniformity
// (tabs-accepted-debt §9, alongside `createTabGroupTemplateBindings`
// and `CngxMatTabAggregatorContent`). Re-eval on second consumer or
// sibling debt closure.
import { computed, linkedSignal, type Signal } from '@angular/core';

import type { CngxTabsConfig } from '../tabs-config';
import type { CngxTabsI18n } from '../i18n/tabs-i18n';
import type { CngxTabGroupHost, CngxTabHandle } from '../tab-group-host.token';

/**
 * Inputs the announcements bundle reads from the host organism.
 * Passing presenter / i18n / config in (instead of re-injecting)
 * keeps the factory pure — one call returns the bundle, no
 * injection context required.
 *
 * @category common/tabs/announcements
 */
export interface CngxTabGroupAnnouncementsOptions {
  readonly presenter: CngxTabGroupHost;
  readonly i18n: CngxTabsI18n;
  readonly config: CngxTabsConfig;
  /** Per-instance `aria-label` Input on the organism. */
  readonly ariaLabel: Signal<string | undefined>;
  /** Per-instance `aria-labelledby` Input on the organism. */
  readonly ariaLabelledBy: Signal<string | undefined>;
}

/**
 * Resolved bundle returned by {@link createTabGroupAnnouncements}.
 * Host bindings and template outlets read these directly. Owns one
 * internal `linkedSignal` slot (prior-active-index tracker driving
 * the success-arm direction prefix); consumers never touch it.
 *
 * @category common/tabs/announcements
 */
export interface CngxTabGroupAnnouncements {
  /**
   * Tablist `aria-roledescription`. Cascades through
   * `CngxTabsFallbackLabels.tabRoleDescription` → `'tab list'`.
   * Distinct from `i18n.tabsLabel` (which feeds `aria-label`) so
   * AT does not read the same word twice.
   */
  readonly tabsRoleDescription: Signal<string>;

  /**
   * Tab-panel `aria-roledescription`. Cascades through
   * `CngxTabsFallbackLabels.tabPanelRoleDescription` → `'tab panel'`.
   */
  readonly tabPanelRoleDescription: Signal<string>;

  /**
   * Wrapper `aria-label`. Resolution: per-instance Input →
   * `ariaLabels.tabsRegion` → `i18n.tabsLabel`. Returns `null` when
   * `aria-labelledby` is bound (mutually exclusive per WAI-ARIA).
   */
  readonly resolvedAriaLabel: Signal<string | null>;

  /**
   * Polite live-region content — declarative, never an imperative
   * `announce()`. Empty between transitions so the region stays
   * quiet on no-op ticks.
   *
   * Error arm: `commitRolledBackTo(originLabel)` when origin
   * resolves; otherwise `commitFailedRetry`.
   *
   * Success arm: `${previousTab|nextTab}: selectedTab(...)` when
   * the index moved; bare `selectedTab(...)` when it didn't (initial
   * mount, or commit-success that lands on the same tab).
   */
  readonly liveAnnouncement: Signal<string>;

  /**
   * SR descriptor phrase for a tab's `cngx-sr-only` span. Gated on the
   * folded `tab.hasError()` so a direct `[error]` tab announces without
   * an aggregator. Resolution: `aggregator.announcement()` →
   * `tab.errorMessage()` (the direct-channel message) →
   * `i18n.tabHasErrors(errorCount)`. Empty string when the tab has no
   * error. The span itself is always rendered (cngx ARIA-by-value
   * rule); this returns its content.
   */
  statusPhrase(tab: CngxTabHandle): string;

  /**
   * Verbose tab-button `aria-label` — `selectedTab(label, position,
   * count)` so AT hears "Tab 2 of 5: Settings" instead of inferring
   * position from tablist enumeration. The visual span keeps the
   * bare label.
   */
  tabAriaLabel(tab: CngxTabHandle, position: number): string;
}

/**
 * Pure factory bundling the `<cngx-tab-group>` AT-announcement +
 * descriptor surfaces. Owns one internal `linkedSignal`
 * (prior-active-index, drives the success-arm direction prefix) —
 * lazy by `linkedSignal` semantics, so the organism reads
 * `liveAnnouncement` once at construction to seed it.
 *
 * @category common/tabs/announcements
 */
export function createTabGroupAnnouncements(
  options: CngxTabGroupAnnouncementsOptions,
): CngxTabGroupAnnouncements {
  const { presenter, i18n, config, ariaLabel, ariaLabelledBy } = options;

  const tabsRoleDescription = computed<string>(
    () => config.fallbackLabels?.tabRoleDescription ?? 'tab list',
  );

  const tabPanelRoleDescription = computed<string>(
    () => config.fallbackLabels?.tabPanelRoleDescription ?? 'tab panel',
  );

  const resolvedAriaLabel = computed<string | null>(() => {
    if (ariaLabelledBy()) {
      return null;
    }
    return ariaLabel() ?? config.ariaLabels?.tabsRegion ?? i18n.tabsLabel;
  });

  // `prev?.source` = source value before the most recent change —
  // prior activeIndex without an `effect`-driven slot (Pillar 1).
  // Coalesce to current on first emission.
  const priorActiveIndex = linkedSignal<number, number>({
    source: () => presenter.activeIndex(),
    computation: (curr, prev) => prev?.source ?? curr,
    equal: Object.is,
  });

  const liveAnnouncement = computed<string>(() => {
    const current = presenter.commitTransition.current();
    if (current === 'pending') {
      return i18n.commitInFlight;
    }
    if (current === 'error') {
      // No `previous === 'pending'` guard — sync rejections collapse
      // pending → error in one flush, so the tracker captures
      // `previous = 'idle'` and an unguarded read keeps the
      // announcement reachable for `commitAction = () => false`.
      const failedIdx = presenter.lastFailedIndex();
      const originIdx = presenter.originIndexDuringCommit();
      if (failedIdx !== undefined && originIdx !== undefined) {
        const originLabel = presenter.tabs()[originIdx]?.label();
        if (originLabel) {
          return i18n.commitRolledBackTo(originLabel);
        }
      }
      return i18n.commitFailedRetry;
    }
    if (current === 'success') {
      const tabs = presenter.tabs();
      const idx = presenter.activeIndex();
      const tab = tabs[idx];
      if (!tab) {
        return '';
      }
      const label = tab.label() ?? '';
      const positionPhrase = i18n.selectedTab(label, idx + 1, tabs.length);
      const prevIdx = priorActiveIndex();
      if (idx > prevIdx) {
        return `${i18n.nextTab}: ${positionPhrase}`;
      }
      if (idx < prevIdx) {
        return `${i18n.previousTab}: ${positionPhrase}`;
      }
      return positionPhrase;
    }
    return '';
  });

  function statusPhrase(tab: CngxTabHandle): string {
    if (!tab.hasError()) {
      return '';
    }
    const aggregator = tab.errorAggregator();
    const announcement = aggregator?.announcement();
    if (announcement) {
      return announcement;
    }
    const directMessage = tab.errorMessage();
    if (directMessage) {
      return directMessage;
    }
    return i18n.tabHasErrors(aggregator?.errorCount() ?? 1);
  }

  function tabAriaLabel(tab: CngxTabHandle, position: number): string {
    const tabs = presenter.tabs();
    const label = tab.label() ?? '';
    const detail = tab.subLabel();
    const labelPart = detail ? i18n.tabLabelWithDetail(label, detail) : label;
    return i18n.selectedTab(labelPart, position, tabs.length);
  }

  // Eager seed — `linkedSignal` is lazy and the success arm doesn't
  // touch the tracker at construction (commitTransition is `idle`),
  // so without this read `prev?.source` is undefined on the first
  // nav and the direction prefix is silently lost.
  priorActiveIndex();

  return {
    tabsRoleDescription,
    tabPanelRoleDescription,
    resolvedAriaLabel,
    liveAnnouncement,
    statusPhrase,
    tabAriaLabel,
  };
}
