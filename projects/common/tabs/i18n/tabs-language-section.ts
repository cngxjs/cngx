import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The tabs section of a {@link CngxLanguagePack}: the copy of
 * `@cngx/common/tabs` and of the tab organisms in `@cngx/ui/tabs` and
 * `@cngx/ui/mat-tabs`. It feeds `CNGX_TABS_I18N` and the copy keys of
 * `CNGX_TABS_CONFIG` (`ariaLabels`, `fallbackLabels`). Messages use `{name}`
 * placeholders; a plural message picks its form from `{count}`.
 *
 * @category common/tabs/i18n
 * @since 0.1.0
 * @relatedTo CNGX_TABS_I18N, CNGX_TABS_CONFIG
 */
export interface CngxTabsLanguageSection {
  /** Accessible name of the tab-group landmark. */
  readonly tabsRegion: string;
  /** Last-tier tab-group label, used when `tabsRegion` is unset. */
  readonly tabsLabel: string;
  /** `aria-roledescription` of the tablist. */
  readonly tabRoleDescription: string;
  /** `aria-roledescription` of each tab panel. */
  readonly tabPanelRoleDescription: string;
  /** `{label}`, `{position}`, `{count}`: the accessible name of a tab. */
  readonly selectedTab: CngxMessage;
  /** `{label}`, `{detail}`: a tab label with its secondary label. */
  readonly tabLabelWithDetail: CngxMessage;
  /** Plural on `{count}`: the number of errors on a tab. */
  readonly tabHasErrors: CngxMessage;
  /** Plural on `{count}`: the overflow trigger label. */
  readonly moreTabsLabel: CngxMessage;
  /**
   * `{position}`: the name of a tab without a label - its button name, its
   * overflow row and, in `<cngx-tab-group>`, the tab named in the live
   * phrase after a move, a rollback or a refusal. The `@cngx/ui/mat-tabs`
   * bridge does not name a label-less origin; it speaks
   * `commitFailedRetry` / `commitRefusedGeneric` instead.
   */
  readonly unlabeledTab: CngxMessage;
  /** `{tab}`: announced after a move to an earlier tab, `{tab}` being its name. */
  readonly previousTab: CngxMessage;
  /** `{tab}`: announced after a move to a later tab. */
  readonly nextTab: CngxMessage;
  /** `{label}`: accessible name of a tab's close button. */
  readonly closeTab: CngxMessage;
  readonly addTab: string;
  /** `{label}`: announced once a closed tab is removed. */
  readonly closedTab: CngxMessage;
  /** Announced once a tab without a label is removed. */
  readonly closedUnlabeledTab: string;
  /**
   * Announced when a tab commit fails and no origin tab resolves (a
   * programmatic commit-state write), and in the `@cngx/ui/mat-tabs` bridge
   * also when the origin tab has no label; a labeled origin speaks
   * `commitRolledBackTo` instead.
   */
  readonly commitFailedRetry: string;
  /** Announced while a tab commit is in flight. */
  readonly commitInFlight: string;
  /** `{origin}`: announced when a failed commit reverts to the origin tab. */
  readonly commitRolledBackTo: CngxMessage;
  /** `{origin}`: announced when the commit action refuses a tab switch. */
  readonly commitRefused: CngxMessage;
  /**
   * Announced when the commit action refuses a tab switch and the origin tab
   * is unknown. `<cngx-tab-group>` names a label-less origin by
   * `unlabeledTab`; the `@cngx/ui/mat-tabs` bridge speaks this phrase for it.
   */
  readonly commitRefusedGeneric: string;
}

/**
 * The English tabs section: the single source of the tabs' English copy.
 * `CNGX_TABS_I18N` and the `CNGX_TABS_CONFIG` labels default to it.
 *
 * @category common/tabs/i18n
 * @since 0.1.0
 * @relatedTo CNGX_TABS_I18N, CNGX_TABS_CONFIG
 */
export const CNGX_TABS_LANGUAGE_EN: CngxTabsLanguageSection = {
  tabsRegion: 'Tabs',
  tabsLabel: 'Tabs',
  tabRoleDescription: 'tab list',
  tabPanelRoleDescription: 'tab panel',
  selectedTab: 'Tab {position} of {count}: {label}',
  tabLabelWithDetail: '{label}, {detail}',
  tabHasErrors: { one: '{count} error', other: '{count} errors' },
  moreTabsLabel: '{count} more',
  unlabeledTab: 'Tab {position}',
  previousTab: 'Previous tab: {tab}',
  nextTab: 'Next tab: {tab}',
  closeTab: 'Close "{label}"',
  addTab: 'Add tab',
  closedTab: 'Closed "{label}"',
  closedUnlabeledTab: 'Tab closed',
  commitFailedRetry: 'Could not switch tab - retry?',
  commitInFlight: 'Switching tab…',
  commitRolledBackTo: 'Could not save changes - reverted to "{origin}".',
  commitRefused: 'Tab switch not allowed - stayed on "{origin}".',
  commitRefusedGeneric: 'Tab switch not allowed.',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly tabs: CngxTabsLanguageSection;
  }
}
