import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * Tabs i18n surface. Library defaults are English; consumers
 * override via {@link provideTabsI18n}. Sibling to
 * `CNGX_STEPPER_I18N` and `CNGX_CHART_I18N`.
 *
 * @category common/tabs/i18n
 */
export interface CngxTabsI18n {
  readonly tabsLabel: string;
  readonly selectedTab: (label: string, position: number, count: number) => string;
  readonly tabHasErrors: (count: number) => string;
  readonly moreTabsLabel: (count: number) => string;
  readonly previousTab: string;
  readonly nextTab: string;
  /**
   * @deprecated Superseded by {@link commitRolledBackTo}. Retained as
   * the defensive fallback in `liveAnnouncement` when the origin
   * label is unresolvable — fires for unlabeled tabs or programmatic
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
 * DI token for the tabs i18n bundle. `providedIn: 'root'` with
 * English defaults.
 *
 * @category common/tabs/i18n
 */
export const CNGX_TABS_I18N = new InjectionToken<CngxTabsI18n>(
  'CngxTabsI18n',
  { providedIn: 'root', factory: () => TABS_I18N_DEFAULTS },
);

/**
 * Branded feature-fn for {@link provideTabsI18n} and
 * {@link provideCngxTabs}. The hidden `_target` discriminator routes
 * i18n features to `provideTabsI18n` and config features to
 * `provideTabsConfig` from the unified aggregator.
 *
 * @category common/tabs/i18n
 */
export type CngxTabsI18nFeature = ((
  bundle: CngxTabsI18n,
) => CngxTabsI18n) & {
  readonly _target: 'i18n';
};

/**
 * Brands an i18n-mutator with the `_target` discriminator.
 *
 * @internal
 */
function defineTabsI18nFeature(
  fn: (bundle: CngxTabsI18n) => CngxTabsI18n,
): CngxTabsI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override i18n labels via a partial bundle — unset keys keep the
 * English default. Same shape as `withTabsAriaLabels` /
 * `withTabsFallbackLabels` so `provideCngxTabs` composes both
 * surfaces uniformly.
 *
 * @category common/tabs/i18n
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
 * (and future i18n `with*` features); unset keys fall back to the
 * English default.
 *
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
 * @category common/tabs/i18n
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
 * Inject the resolved tabs i18n bundle.
 *
 * @category common/tabs/i18n
 */
export function injectTabsI18n(): CngxTabsI18n {
  return inject(CNGX_TABS_I18N);
}
