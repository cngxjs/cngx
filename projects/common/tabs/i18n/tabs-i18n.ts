import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { CNGX_TABS_LANGUAGE_EN, type CngxTabsLanguageSection } from './tabs-language-section';

/**
 * Tabs i18n surface. Library defaults are English; consumers
 * override via {@link provideTabsI18n}. Sibling to
 * `CNGX_STEPPER_I18N` and `CNGX_CHART_I18N`.
 *
 * @category common/tabs/i18n
 */
export interface CngxTabsI18n {
  /**
   * Last tier of the tab-group `aria-label`. It only applies when
   * `CNGX_TABS_CONFIG.ariaLabels.tabsRegion` is unset; that key defaults
   * to `'Tabs'`, so localise the landmark through `withTabsAriaLabels(...)`.
   */
  readonly tabsLabel: string;
  readonly selectedTab: (label: string, position: number, count: number) => string;
  /**
   * Folds a tab's optional secondary label into its accessible name.
   * Receives the primary label and the sub-label detail; the result
   * is passed to {@link selectedTab} as the label part, e.g.
   * `Tab 2 of 5: Bookmarks, 45`. Only invoked when a sub-label is
   * present.
   */
  readonly tabLabelWithDetail: (label: string, detail: string) => string;
  readonly tabHasErrors: (count: number) => string;
  readonly moreTabsLabel: (count: number) => string;
  /**
   * Name of a tab without a label, e.g. a row of the overflow list.
   * Receives the 1-based position; English `Tab 3`.
   */
  readonly unlabeledTab: (position: number) => string;
  /**
   * Commit-success announcement after a move to an earlier tab. Receives
   * the position phrase from {@link selectedTab} and owns the whole
   * sentence, so a locale can reorder it or drop the separator, e.g.
   * `Previous tab: Tab 1 of 3: Profile`. Unlike the stepper's
   * `previousStep` / `nextStep`, which are button labels, this key returns
   * the full live-region sentence.
   */
  readonly previousTab: (positionPhrase: string) => string;
  /** Sibling of {@link previousTab} after a move to a later tab. */
  readonly nextTab: (positionPhrase: string) => string;
  /**
   * Accessible name for a tab's close button. Receives the tab label
   * (or a generic fallback when unlabeled) and yields the button's
   * `aria-label`, e.g. `Close "Profile"`.
   */
  readonly closeTab: (label: string) => string;
  /** Accessible name for the add-tab button. */
  readonly addTab: string;
  /**
   * Live-region confirmation once a closed tab's removal has actually
   * landed in the registry. Receives the closed tab's label (or an
   * empty string when unlabeled).
   */
  readonly closedTab: (label: string) => string;
  /**
   * @deprecated Superseded by {@link commitRolledBackTo}. Retained as
   * the defensive fallback in `liveAnnouncement` when the origin
   * label is unresolvable - fires for unlabeled tabs or programmatic
   * `commitState` writes that bypass `select()`. See
   * `tabs-accepted-debt §4`.
   */
  readonly commitFailedRetry: string;
  readonly commitInFlight: string;
  /**
   * Origin-aware rollback announcement. Receives the safe-harbour
   * tab label and yields the rollback phrase. Read on the
   * `pending → error` transition when both `lastFailedIndex` and
   * `originIndexDuringCommit` are set.
   */
  readonly commitRolledBackTo: (originLabel: string) => string;
}

const NO_SECTION: Partial<CngxTabsLanguageSection> = {};

/**
 * @internal The English tabs section with the active pack's tabs section on
 * top. Feeds both `CNGX_TABS_I18N` and the `CNGX_TABS_CONFIG` labels.
 */
export function injectTabsLanguage(): Signal<CngxTabsLanguageSection> {
  const pack = injectLanguageSection('tabs');
  return createOverrideMerge(
    CNGX_TABS_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/** @internal Turns a tabs section into the token's keys for a locale. */
function tabsBundleFrom(section: CngxTabsLanguageSection, locale: string): CngxTabsI18n {
  return {
    tabsLabel: section.tabsLabel,
    selectedTab: (label, position, count) =>
      formatMessage(section.selectedTab, { label, position, count }, locale),
    tabLabelWithDetail: (label, detail) =>
      formatMessage(section.tabLabelWithDetail, { label, detail }, locale),
    tabHasErrors: (count) => formatMessage(section.tabHasErrors, { count }, locale),
    moreTabsLabel: (count) => formatMessage(section.moreTabsLabel, { count }, locale),
    unlabeledTab: (position) => formatMessage(section.unlabeledTab, { position }, locale),
    previousTab: (tab) => formatMessage(section.previousTab, { tab }, locale),
    nextTab: (tab) => formatMessage(section.nextTab, { tab }, locale),
    closeTab: (label) => formatMessage(section.closeTab, { label }, locale),
    addTab: section.addTab,
    closedTab: (label) =>
      label ? formatMessage(section.closedTab, { label }, locale) : section.closedUnlabeledTab,
    commitFailedRetry: section.commitFailedRetry,
    commitInFlight: section.commitInFlight,
    commitRolledBackTo: (origin) => formatMessage(section.commitRolledBackTo, { origin }, locale),
  };
}

/** @internal The tabs section of the active pack over English. */
function injectTabsSection(): Signal<CngxTabsLanguageSection> {
  return injectTabsLanguage();
}

/** @internal Builds and reads the token, formatted for the reading locale. */
const tabsBundle = createSectionBundle<CngxTabsLanguageSection, CngxTabsI18n>({
  section: injectTabsSection,
  toBundle: tabsBundleFrom,
});

/**
 * DI token for the tabs i18n bundle, as a `Signal` so a runtime language
 * switch re-renders every label it feeds. `providedIn: 'root'`: the tabs
 * section of the active language pack over the English defaults, formatted
 * for the app locale. Provide it through {@link provideTabsI18n}; a
 * `{ provide, useValue }` entry must supply a `Signal<CngxTabsI18n>`.
 *
 * @category common/tabs/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/i18n/tabs-i18n.ts
 * @since 0.1.0
 */
export const CNGX_TABS_I18N = new InjectionToken<Signal<CngxTabsI18n>>('CngxTabsI18n', {
  providedIn: 'root',
  factory: () => tabsBundle.build(),
});

/**
 * Branded feature-fn for {@link provideTabsI18n} and
 * {@link provideCngxTabs}. The hidden `_target` discriminator routes
 * i18n features to `provideTabsI18n` and config features to
 * `provideTabsConfig` from the unified aggregator.
 *
 * @category common/tabs/i18n
 */
export type CngxTabsI18nFeature = ((bundle: Signal<CngxTabsI18n>) => Signal<CngxTabsI18n>) & {
  readonly _target: 'i18n';
};

/**
 * Brands an i18n-mutator with the `_target` discriminator.
 *
 * @internal
 */
function defineTabsI18nFeature(
  fn: (bundle: Signal<CngxTabsI18n>) => Signal<CngxTabsI18n>,
): CngxTabsI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle - unset keys keep the
 * language pack's copy, or the English default. Same shape as `withTabsAriaLabels` /
 * `withTabsFallbackLabels` so `provideCngxTabs` composes both
 * surfaces uniformly. Pass a `Signal` to switch the language at runtime.
 *
 * @category common/tabs/i18n
 */
export function withTabsI18nLabels(
  overrides: Partial<CngxTabsI18n> | Signal<Partial<CngxTabsI18n>>,
): CngxTabsI18nFeature {
  return defineTabsI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the tabs i18n bundle. Compose `withTabsI18nLabels(...)`
 * (and future i18n `with*` features); unset keys fall back to the
 * language pack, then English. The features apply on top of the active pack.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTabsI18n(
 *       withTabsI18nLabels({ tabsLabel: 'Reiter', addTab: 'Neuer Reiter' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/tabs/i18n
 */
export function provideTabsI18n(...features: readonly CngxTabsI18nFeature[]): Provider {
  return {
    provide: CNGX_TABS_I18N,
    useFactory: () => tabsBundle.build(features),
  };
}

/**
 * Inject the resolved tabs i18n bundle. Read it inside a `computed()`,
 * template or handler so a language switch reaches the label.
 *
 * @category common/tabs/i18n
 */
export function injectTabsI18n(): Signal<CngxTabsI18n> {
  return tabsBundle.resolve(inject(CNGX_TABS_I18N));
}
