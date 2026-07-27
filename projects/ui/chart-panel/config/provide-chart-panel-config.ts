import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxChartPanelConfig } from './chart-panel.config';
import { CNGX_CHART_PANEL_CONFIG, CNGX_CHART_PANEL_DEFAULTS } from './chart-panel.config.defaults';

/**
 * Discriminated-union shape returned by the chart-panel config features. The
 * reducer matches on `kind` and merges `payload` into the corresponding config
 * sub-tree. Mirrors `CngxStatCardConfigFeature` and `CngxBreadcrumbConfigFeature`.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export type CngxChartPanelConfigFeature =
  | {
      readonly kind: 'ariaLabels';
      readonly payload: NonNullable<CngxChartPanelConfig['ariaLabels']>;
    }
  | {
      readonly kind: 'legendPosition';
      readonly payload: {
        readonly legendPosition: NonNullable<CngxChartPanelConfig['legendPosition']>;
      };
    };

/**
 * Reduces a list of feature objects into a partial config - last write wins
 * per sub-tree.
 *
 * @internal
 */
function reduceFeatures(
  features: readonly CngxChartPanelConfigFeature[],
): Partial<CngxChartPanelConfig> {
  const out: {
    ariaLabels?: NonNullable<CngxChartPanelConfig['ariaLabels']>;
    legendPosition?: NonNullable<CngxChartPanelConfig['legendPosition']>;
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'ariaLabels':
        out.ariaLabels = { ...out.ariaLabels, ...f.payload };
        break;
      case 'legendPosition':
        out.legendPosition = f.payload.legendPosition;
        break;
    }
  }
  return out;
}

/**
 * Two-level deep merge: the nested `ariaLabels` sub-tree spread-merges; the
 * flat top-level scalars take the partial when present, else the base.
 *
 * @internal
 */
function mergeConfig(
  base: CngxChartPanelConfig,
  partial: Partial<CngxChartPanelConfig>,
): CngxChartPanelConfig {
  return {
    ariaLabels: { ...base.ariaLabels, ...partial.ariaLabels },
    legendPosition: partial.legendPosition ?? base.legendPosition,
  };
}

/**
 * Application-root configuration cascade for the chart-panel.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideChartPanelConfig(withChartPanelLegendPosition('top'))],
 * });
 * ```
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export function provideChartPanelConfig(
  ...features: CngxChartPanelConfigFeature[]
): EnvironmentProviders {
  // Empty-features: skip the override so the root factory's defaults reference
  // flows through untouched, preserving downstream identity comparisons.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_CHART_PANEL_CONFIG,
      useValue: mergeConfig(CNGX_CHART_PANEL_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the chart-panel. Injects the
 * parent injector's value and deep-merges the supplied features on top.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export function provideChartPanelConfigAt(
  ...features: CngxChartPanelConfigFeature[]
): Provider[] {
  // Empty-features call: parent value flows through untouched.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_CHART_PANEL_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_CHART_PANEL_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
