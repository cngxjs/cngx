import {
  type EnvironmentProviders,
  isDevMode,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';

import {
  provideTabsI18n,
  type CngxTabsI18nFeature,
} from './i18n/tabs-i18n';
import {
  provideTabsConfig,
  provideTabsConfigAt,
  type CngxTabsConfigFeature,
} from './tabs-config';

/**
 * Union of every feature kind the tabs family aggregator accepts.
 * Today: config (`CNGX_TABS_CONFIG`) and i18n (`CNGX_TABS_I18N`).
 * Future surfaces (announcer cadence, scroll strategy, etc.) widen
 * this union and {@link provideCngxTabs} dispatches via each
 * feature's hidden `_target` discriminator.
 *
 * @category interactive
 */
export type CngxTabsFeature = CngxTabsConfigFeature | CngxTabsI18nFeature;

interface PartitionedFeatures {
  readonly config: CngxTabsConfigFeature[];
  readonly i18n: CngxTabsI18nFeature[];
}

function partitionFeatures(
  features: readonly CngxTabsFeature[],
): PartitionedFeatures {
  const config: CngxTabsConfigFeature[] = [];
  const i18n: CngxTabsI18nFeature[] = [];
  for (const feat of features) {
    if (feat._target === 'i18n') {
      i18n.push(feat);
      continue;
    }
    if (feat._target === 'config') {
      config.push(feat);
      continue;
    }
    // Unbranded feature — runtime escape from the required `_target`
    // type. Drop and dev-warn so an i18n-shaped override can never
    // land silently in `CNGX_TABS_CONFIG` (Pillar 3 / honest-failure).
    if (isDevMode()) {
      console.warn(
        '[provideCngxTabs] Dropped feature without a `_target` ' +
          'discriminator. Brand config-side mutators with ' +
          '`defineTabsConfigFeature(...)` (or use a `with*` helper) ' +
          'and i18n-side mutators with `withTabsI18nLabels(...)`.',
      );
    }
  }
  return { config, i18n };
}

/**
 * Unified aggregator for the tabs family's configuration. Filters
 * features by `_target` and forwards to the matching `provide*` —
 * config features dispatch to {@link provideTabsConfig}, i18n features
 * to {@link provideTabsI18n}.
 *
 * Mirrors `provideCngxMenu` and `provideCngxSelect`. Apply once in the
 * application providers array.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCngxTabs(
 *       withTabsDefaultOrientation('vertical'),
 *       withTabsAriaLabels({ tabsRegion: 'Bereiche' }),
 *       withTabsI18nLabels({ tabsLabel: 'Bereiche', moreTabsLabel: (n) => `${n} mehr` }),
 *       withTabOverflowStabilizeMs(150),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideCngxTabs(
  ...features: readonly CngxTabsFeature[]
): EnvironmentProviders {
  const { config, i18n } = partitionFeatures(features);
  // `provideTabsConfig` returns EnvironmentProviders, `provideTabsI18n`
  // returns Provider — `makeEnvironmentProviders` accepts both.
  return makeEnvironmentProviders([
    provideTabsConfig(...config),
    ...(i18n.length > 0 ? [provideTabsI18n(...i18n)] : []),
  ]);
}

/**
 * Component-scoped twin of {@link provideCngxTabs}. Use in a component's
 * `viewProviders` (or `providers`) array — the returned `Provider[]` keeps
 * the `viewProviders`-compatible list shape since
 * {@link EnvironmentProviders} cannot live there.
 *
 * Both surfaces dispatch identically: the i18n feature merges shallow
 * over the resolved bundle, the config feature reduces over the
 * defaults — the only difference is provider scope.
 *
 * @example
 * ```ts
 * @Component({
 *   viewProviders: [
 *     ...provideCngxTabsAt(
 *       withTabsDefaultOrientation('vertical'),
 *       withTabsI18nLabels({ tabsLabel: 'Bereiche' }),
 *     ),
 *   ],
 * })
 * ```
 *
 * @category interactive
 */
export function provideCngxTabsAt(
  ...features: readonly CngxTabsFeature[]
): Provider[] {
  const { config, i18n } = partitionFeatures(features);
  return [
    ...provideTabsConfigAt(...config),
    ...(i18n.length > 0 ? [provideTabsI18n(...i18n)] : []),
  ];
}
