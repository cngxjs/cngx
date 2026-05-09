// Single-consumer cross-package factory — staged under the
// family-uniformity Honest-Absence framing in
// `.internal/architektur/tabs-accepted-debt.md §9` (alongside
// `createTabGroupTemplateBindings` and `CngxMatTabAggregatorContent`).
// Re-Eval Triggers: ≥1 second consumer (e.g. a future
// `<cngx-vertical-tab-group>`) OR sibling debt closure OR consumer-
// confirmed dead-code. Until any trigger fires, the factory's exported
// presence is intentional debt — keeps the Phase-5 announcements
// extraction symmetric with the cascade-resolver and overflow-binding
// factories under `@cngx/common/tabs`.
import { computed, linkedSignal, type Signal } from '@angular/core';

import type { CngxTabsConfig } from '../tabs-config';
import type { CngxTabsI18n } from '../i18n/tabs-i18n';
import type { CngxTabGroupHost, CngxTabHandle } from '../tab-group-host.token';

/**
 * Inputs the announcements bundle reads from the host organism.
 *
 * The organism owns the `aria-label` / `aria-labelledby` Inputs;
 * presenter + i18n + config come from DI. Passing these in (instead
 * of re-injecting inside the factory) keeps the factory pure: a
 * single function call returns the whole bundle, no constructor
 * context required, easy to test in isolation.
 *
 * @category interactive
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
 *
 * Every field is consumer-ready — host bindings and template outlets
 * read these directly without further wiring. The bundle owns one
 * `linkedSignal` slot internally (the prior-active-index tracker
 * that drives the success-arm direction prefix) and exposes pure
 * `computed` / function surfaces; consumers never touch the slot.
 *
 * @category interactive
 */
export interface CngxTabGroupAnnouncements {
  /**
   * Tabs landmark `aria-roledescription`. Cascades through
   * `CngxTabsFallbackLabels.tabRoleDescription` → library default
   * `'tab list'`. Pillar 2: deliberately distinct from
   * `i18n.tabsLabel`, which feeds `aria-label`; collapsing both
   * onto one string makes screen readers read the same word twice.
   */
  readonly tabsRoleDescription: Signal<string>;

  /**
   * Tab-panel `aria-roledescription`. Cascades through
   * `CngxTabsFallbackLabels.tabPanelRoleDescription` → library
   * default `'tab panel'`. Mirrors {@link tabsRoleDescription} so
   * AT-facing role descriptors flow through one config surface
   * regardless of which scope (button vs panel) declares them.
   */
  readonly tabPanelRoleDescription: Signal<string>;

  /**
   * Resolves the wrapper's `aria-label`. Resolution order:
   * per-instance Input → `ariaLabels.tabsRegion` config → `i18n.tabsLabel`.
   * Returns `null` when `aria-labelledby` is bound (the two attributes
   * are mutually exclusive per WAI-ARIA).
   */
  readonly resolvedAriaLabel: Signal<string | null>;

  /**
   * SR-friendly text rendered inside the polite live-region span.
   * Drives the announcer through declarative content updates —
   * never an imperative `announce()` call. Empty string between
   * transitions so the region stays quiet on no-op CD ticks.
   *
   * Priority chain on the `error` arm:
   *   1. `commitRolledBackTo(originLabel)` when the presenter has
   *      both a `lastFailedIndex` and a resolvable origin label.
   *   2. `commitFailedRetry` (generic fallback).
   *
   * Priority chain on the `success` arm:
   *   1. `${i18n.previousTab}: ${i18n.selectedTab(label, position, count)}`
   *      when the navigation moved backward (new index < prior index).
   *   2. `${i18n.nextTab}: ${i18n.selectedTab(...)}` when forward.
   *   3. Bare `i18n.selectedTab(...)` when the index did not change
   *      (initial mount or commit-success that lands the user back
   *      on the same tab).
   */
  readonly liveAnnouncement: Signal<string>;

  /**
   * SR descriptor phrase for a tab's `cngx-sr-only` span. Reads the
   * aggregator's `announcement()` when one is bound and revealed;
   * falls back to `i18n.tabHasErrors(errorCount)` when the aggregator
   * wants reveal but supplies an empty announcement string. Returns
   * empty string when no aggregator wants reveal at all (no
   * decoration to describe).
   *
   * Cngx A11y rule: ids always present, content reactive — this
   * function returns the content; the descriptor span itself is
   * always rendered by the organism's template.
   */
  statusPhrase(tab: CngxTabHandle): string;

  /**
   * Verbose accessible name for each tab button. Replaces the bare
   * label text content with the i18n
   * `selectedTab(label, position, count)` phrase so AT users hear
   * "Tab 2 of 5: Settings" instead of just "Settings, tab" — position
   * context is in-band rather than inferred from tablist enumeration.
   *
   * The visual label span continues to render the bare `label`;
   * `aria-label` takes precedence over text content for AT, leaving
   * sighted users unaffected.
   */
  tabAriaLabel(tab: CngxTabHandle, position: number): string;
}

/**
 * Pure factory bundling the `<cngx-tab-group>` AT-announcement +
 * descriptor surfaces — extracted from the organism class body for
 * decompose readiness and unit-test isolation. Mirrors the
 * `createTabOverflowTemplateBindings` shape: one factory call,
 * one consumer-ready bundle.
 *
 * Owns one internal `linkedSignal` slot ({@link priorActiveIndex})
 * driving the success-arm direction prefix. The slot is lazy by
 * `linkedSignal` semantics; consumers that depend on the
 * direction-prefix path on the very first announcement should read
 * `liveAnnouncement` once at construction to seed the tracker (the
 * `<cngx-tab-group>` constructor does this).
 *
 * @category interactive
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

  // `linkedSignal` with `prev?.source` returns the SOURCE value at
  // the moment before the most recent change — exactly the "prior
  // activeIndex" semantic — without duplicating state in an `effect`
  // (Pillar 1). Initial value coalesces to current so the first
  // emission compares like-for-like and produces no spurious direction.
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
      // `previous` reads stay reactive but are not gated — synchronous
      // commit-handler errors collapse pending → error in a single
      // signal-flush tick, so the tracker captures
      // `previous = 'idle'` rather than `'pending'`. Loosening the
      // guard keeps the announcement reachable for sync-rejection
      // actions (`commitAction = () => false`).
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
    const aggregator = tab.errorAggregator();
    if (!aggregator?.shouldShow()) {
      return '';
    }
    const announcement = aggregator.announcement();
    if (announcement) {
      return announcement;
    }
    return i18n.tabHasErrors(aggregator.errorCount());
  }

  function tabAriaLabel(tab: CngxTabHandle, position: number): string {
    const tabs = presenter.tabs();
    return i18n.selectedTab(tab.label() ?? '', position, tabs.length);
  }

  // Eager seed for the prior-active-index tracker. `linkedSignal` is
  // lazy: without this read its first computation runs only on the
  // first `liveAnnouncement` resolution that hits the success arm,
  // which in test/CD scenarios already coincides with the post-nav
  // activeIndex — leaving `prev?.source` undefined and the direction
  // prefix unfired. Reading once at factory-construction time captures
  // the initial activeIndex so the linkedSignal's `prev.source`
  // carries it forward across the first nav. Reading
  // `liveAnnouncement` is NOT sufficient here: at construction the
  // commitTransition is `idle`, the success arm is skipped, and
  // `priorActiveIndex` never gets touched.
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
