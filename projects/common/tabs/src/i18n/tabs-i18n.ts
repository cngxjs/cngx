import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * Tabs i18n surface. Library defaults are English (per
 * `feedback_en_default_locale`); German / other locales come from
 * consumer overrides via {@link provideTabsI18n}.
 *
 * Mirrors `CNGX_STEPPER_I18N` and `CNGX_CHART_I18N` — the same
 * provider+token+inject helper triple every cngx feature ships.
 *
 * @category interactive
 */
export interface CngxTabsI18n {
  readonly tabsLabel: string;
  readonly selectedTab: (label: string, position: number, count: number) => string;
  readonly tabHasErrors: (count: number) => string;
  readonly moreTabsLabel: (count: number) => string;
  readonly previousTab: string;
  readonly nextTab: string;
  /**
   * @deprecated for tabs commit rollback — superseded by
   * {@link commitRolledBackTo}. Retained as the **defensive
   * fallback** in the organism's `liveAnnouncement` priority
   * chain when the origin label is unresolvable. Reachability
   * note: under the current `select()` flow the
   * `originIndexDuringCommit` slot is always written before the
   * commit window opens (`presenter.directive.ts:234`), so the
   * fallback path fires only when `tabs()[originIdx]?.label()`
   * resolves to falsy (unlabeled tab) OR a future producer feeds
   * `commitState` outside `select()` (programmatic state
   * mutation on the host contract). See `tabs-accepted-debt §4`
   * for the rationale on retaining-vs-removing this key.
   */
  readonly commitFailedRetry: string;
  readonly commitInFlight: string;
  /**
   * Origin-aware rollback announcement. Receives the label of the
   * tab the user was returned to (the "safe-harbour" tab) and
   * yields a phrase like `Could not save changes — reverted to
   * "Profile".`. Read by the organism's `liveAnnouncement`
   * computed on the `pending → error` transition when both
   * `lastFailedIndex` and `originIndexDuringCommit` are set.
   */
  readonly commitRolledBackTo: (originLabel: string) => string;
}

const TABS_I18N_DEFAULTS: CngxTabsI18n = {
  tabsLabel: 'Tabs',
  selectedTab: (label, position, count) =>
    `Tab ${position} of ${count}: ${label}`,
  tabHasErrors: (count) => `${count} error${count === 1 ? '' : 's'}`,
  moreTabsLabel: (count) => `${count} more`,
  previousTab: 'Previous tab',
  nextTab: 'Next tab',
  commitFailedRetry: 'Tab change refused — retry?',
  commitInFlight: 'Switching tab…',
  commitRolledBackTo: (originLabel) =>
    `Could not save changes — reverted to "${originLabel}".`,
};

/**
 * DI token for the resolved tabs i18n bundle. `providedIn: 'root'`
 * with the English defaults.
 *
 * @category interactive
 */
export const CNGX_TABS_I18N = new InjectionToken<CngxTabsI18n>(
  'CngxTabsI18n',
  { providedIn: 'root', factory: () => TABS_I18N_DEFAULTS },
);

/**
 * Single feature-flag function consumed by {@link provideTabsI18n} and the
 * family aggregator {@link provideCngxTabs}. Carries a hidden `_target`
 * discriminator so the aggregator can dispatch i18n features to
 * {@link provideTabsI18n} while config features go to
 * {@link provideTabsConfig}. Mirrors `CngxMenuConfigFeature` from the menu
 * family's A+ closure.
 *
 * @category interactive
 */
export type CngxTabsI18nFeature = ((
  bundle: CngxTabsI18n,
) => CngxTabsI18n) & {
  readonly _target?: 'i18n';
};

/**
 * Internal helper that brands an i18n-mutator function with the `_target`
 * discriminator. Every `with*` i18n feature returns one of these.
 *
 * @internal
 */
function defineTabsI18nFeature(
  fn: (bundle: CngxTabsI18n) => CngxTabsI18n,
): CngxTabsI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override one or more i18n labels on the tabs surface. Pass a partial
 * override — unset keys keep their English default. Mirrors the
 * `withTabsAriaLabels` / `withTabsFallbackLabels` shape on the
 * config surface so `provideCngxTabs` can compose features uniformly
 * across both `CNGX_TABS_CONFIG` and `CNGX_TABS_I18N`.
 *
 * @category interactive
 */
export function withTabsI18nLabels(
  overrides: Partial<CngxTabsI18n>,
): CngxTabsI18nFeature {
  return defineTabsI18nFeature((bundle) => ({ ...bundle, ...overrides }));
}

function resolveI18nFeatures(
  features: readonly CngxTabsI18nFeature[],
): CngxTabsI18n {
  return features.reduce<CngxTabsI18n>(
    (bundle, feat) => feat(bundle),
    TABS_I18N_DEFAULTS,
  );
}

/**
 * Provider for the tabs i18n bundle. Compose `withTabsI18nLabels(...)`
 * features (and any future i18n `with*` features) — unset keys fall
 * back to the English default.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTabsI18n(
 *       withTabsI18nLabels({ tabsLabel: 'Reiter', previousTab: 'Vorheriger' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideTabsI18n(
  ...features: readonly CngxTabsI18nFeature[]
): Provider {
  return {
    provide: CNGX_TABS_I18N,
    useValue: resolveI18nFeatures(features),
  };
}

/**
 * Inject the resolved tabs i18n bundle in an injection context.
 *
 * @category interactive
 */
export function injectTabsI18n(): CngxTabsI18n {
  return inject(CNGX_TABS_I18N);
}
