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
  readonly commitFailedRetry: string;
  readonly commitInFlight: string;
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
 * Provider for the tabs i18n bundle. Pass a partial override — unset
 * keys fall back to the English default.
 *
 * @category interactive
 */
export function provideTabsI18n(
  overrides: Partial<CngxTabsI18n>,
): Provider {
  return {
    provide: CNGX_TABS_I18N,
    useValue: { ...TABS_I18N_DEFAULTS, ...overrides },
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
