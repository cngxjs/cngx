import {
  type EnvironmentProviders,
  isDevMode,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';

import { provideTabsI18n, type CngxTabsI18nFeature } from './i18n/tabs-i18n';
import { provideTabsConfig, provideTabsConfigAt, type CngxTabsConfigFeature } from './tabs-config';

/**
 * Union of feature kinds the tabs aggregator accepts. \
 * Today: config and i18n; future surfaces widen the union and dispatch via the
 * hidden `_target` discriminator.
 *
 * @category common/tabs
 */
export type CngxTabsFeature = CngxTabsConfigFeature | CngxTabsI18nFeature;

/** @internal */
interface PartitionedFeatures {
  readonly config: CngxTabsConfigFeature[];
  readonly i18n: CngxTabsI18nFeature[];
}

function partitionFeatures(features: readonly CngxTabsFeature[]): PartitionedFeatures {
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
    // Unbranded feature — runtime escape from the `_target` type.
    // Drop with dev-warn so an i18n-shaped override never lands
    // silently in `CNGX_TABS_CONFIG`.
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
 * Unified aggregator for tabs configuration. \
 * Routes features by `_target` to {@link provideTabsConfig} and {@link provideTabsI18n}. \
 * Sibling to
 * - `provideCngxMenu` and
 * - `provideCngxSelect`;
 * apply once in the app providers array. \
 * Returns {@link EnvironmentProviders}; for
 * - `viewProviders` use {@link provideCngxTabsAt} — opaque
 * - `EnvironmentProviders` cannot live there.
 *
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
 * @category common/tabs
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/provide-cngx-tabs.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroup, CngxTabsConfig, provideCngxTabsAt
 */
export function provideCngxTabs(...features: readonly CngxTabsFeature[]): EnvironmentProviders {
  const { config, i18n } = partitionFeatures(features);
  return makeEnvironmentProviders([
    provideTabsConfig(...config),
    ...(i18n.length > 0 ? [provideTabsI18n(...i18n)] : []),
  ]);
}

/**
 * Component-scoped twin of {@link provideCngxTabs}. \
 * Returns `Provider[]` for `viewProviders`/`providers`; same dispatch
 * semantics, different scope.
 *
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
 * @category common/tabs
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/provide-cngx-tabs.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroup, CngxTabsConfig, provideCngxTabs
 */
export function provideCngxTabsAt(...features: readonly CngxTabsFeature[]): Provider[] {
  const { config, i18n } = partitionFeatures(features);
  return [
    ...provideTabsConfigAt(...config),
    ...(i18n.length > 0 ? [provideTabsI18n(...i18n)] : []),
  ];
}
