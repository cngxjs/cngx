import {
  type EnvironmentProviders,
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
    } else {
      // Default to 'config' when the discriminator is absent — keeps
      // the door open for stale `(cfg) => cfg` features written before
      // `defineTabsConfigFeature` landed. The narrowing else-branch
      // does not exclude `CngxTabsI18nFeature` from the union (a stale
      // feature could carry no `_target`), so a structural cast is
      // required for the call-site signature.
      config.push(feat as CngxTabsConfigFeature);
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
 *       withDefaultOrientation('vertical'),
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
 *       withDefaultOrientation('vertical'),
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
