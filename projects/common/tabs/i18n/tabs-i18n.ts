import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { CNGX_TABS_LANGUAGE_EN, type CngxTabsLanguageSection } from './tabs-language-section';

/**
 * Tabs i18n surface. Library defaults are English; consumers
 * override via {@link provideTabsI18n}. Sibling to
 * `CNGX_STEPPER_I18N` and `CNGX_CHART_I18N`.
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
   * Accessible name of a tab without a label, with its position in the group:
   * the label-less twin of {@link selectedTab}. Receives the 1-based position
   * and the tab count; English `Tab 2 of 5`.
   */
  readonly unlabeledTabOfCount: (position: number, count: number) => string;
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
   * label is unresolvable - fires for a failed commit from an unlabeled
   * tab or programmatic `commitState` writes that bypass `select()`,
   * never for a refusal ({@link commitRefusedGeneric}). See
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
  /**
   * Origin-aware refusal phrase. Read when the commit action answered
   * `false` and the origin label resolves. Receives the label of the tab
   * the user stayed on, yields e.g. `Tab switch not allowed - stayed on
   * "Profile".`. A refusal is not a failure, so it never reads the
   * failure copy ({@link commitRolledBackTo}, {@link commitFailedRetry}).
   */
  readonly commitRefused: (originLabel: string) => string;
  /**
   * Refusal phrase for an origin without a label. Twin of
   * {@link commitFailedRetry} for the refused outcome.
   */
  readonly commitRefusedGeneric: string;
}

/**
 * @internal The English tabs section with the active pack's tabs section on
 * top. Feeds both `CNGX_TABS_I18N` and the `CNGX_TABS_CONFIG` labels.
 */
export const injectTabsLanguage = createLanguageSection('tabs', CNGX_TABS_LANGUAGE_EN);

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
    unlabeledTabOfCount: (position, count) =>
      formatMessage(section.unlabeledTabOfCount, { position, count }, locale),
    previousTab: (tab) => formatMessage(section.previousTab, { tab }, locale),
    nextTab: (tab) => formatMessage(section.nextTab, { tab }, locale),
    closeTab: (label) => formatMessage(section.closeTab, { label }, locale),
    addTab: section.addTab,
    closedTab: (label) =>
      label ? formatMessage(section.closedTab, { label }, locale) : section.closedUnlabeledTab,
    commitFailedRetry: section.commitFailedRetry,
    commitInFlight: section.commitInFlight,
    commitRolledBackTo: (origin) => formatMessage(section.commitRolledBackTo, { origin }, locale),
    commitRefused: (origin) => formatMessage(section.commitRefused, { origin }, locale),
    commitRefusedGeneric: section.commitRefusedGeneric,
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
 */
export function injectTabsI18n(): Signal<CngxTabsI18n> {
  return tabsBundle.resolve(inject(CNGX_TABS_I18N));
}
