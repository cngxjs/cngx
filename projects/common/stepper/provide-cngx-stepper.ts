import {
  type EnvironmentProviders,
  isDevMode,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';

import {
  provideStepperI18n,
  type CngxStepperI18nFeature,
} from './i18n/stepper-i18n';
import {
  provideStepperConfig,
  provideStepperConfigAt,
  type CngxStepperConfigFeature,
} from './stepper-config';

/**
 * Union of every feature kind {@link provideCngxStepper} accepts. Today:
 * config (`CNGX_STEPPER_CONFIG`) and i18n (`CNGX_STEPPER_I18N`). Future
 * surfaces widen this union and dispatch via the hidden `_target`
 * discriminator.
 *
 * @category common/stepper
 */
export type CngxStepperFeature =
  | CngxStepperConfigFeature
  | CngxStepperI18nFeature;

/** @internal */
interface PartitionedFeatures {
  readonly config: CngxStepperConfigFeature[];
  readonly i18n: CngxStepperI18nFeature[];
}

function partitionFeatures(
  features: readonly CngxStepperFeature[],
): PartitionedFeatures {
  const config: CngxStepperConfigFeature[] = [];
  const i18n: CngxStepperI18nFeature[] = [];
  for (const feat of features) {
    if (feat._target === 'i18n') {
      i18n.push(feat);
      continue;
    }
    if (feat._target === 'config') {
      config.push(feat);
      continue;
    }
    // Unbranded feature — drop + dev-warn (mirrors `provideCngxTabs`).
    if (isDevMode()) {
      console.warn(
        '[provideCngxStepper] Dropped feature without a `_target` ' +
          'discriminator. Brand config-side mutators with ' +
          '`defineStepperConfigFeature(...)` (or use a `with*` helper) ' +
          'and i18n-side mutators with `withStepperI18nLabels(...)`.',
      );
    }
  }
  return { config, i18n };
}

/**
 * Unified aggregator for the stepper family. Filters by `_target` and
 * forwards: config features to {@link provideStepperConfig}, i18n
 * features to {@link provideStepperI18n}. Mirrors `provideCngxTabs` /
 * `provideCngxSelect`.
 *
 * Returns {@link EnvironmentProviders} for app-root use; the
 * component-scoped twin {@link provideCngxStepperAt} returns
 * `Provider[]` because `viewProviders` cannot accept opaque
 * `EnvironmentProviders`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCngxStepper(
 *       withStepperDefaultOrientation('vertical'),
 *       withStepperLinear(true),
 *       withStepperAriaLabels({ stepperRegion: 'Schrittfolge' }),
 *       withStepperI18nLabels({ stepperLabel: 'Schrittfolge', previousStep: 'Vorheriger' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/stepper
 */
export function provideCngxStepper(
  ...features: readonly CngxStepperFeature[]
): EnvironmentProviders {
  const { config, i18n } = partitionFeatures(features);
  // `provideStepperConfig` returns EnvironmentProviders, `provideStepperI18n`
  // returns Provider — `makeEnvironmentProviders` takes both.
  return makeEnvironmentProviders([
    provideStepperConfig(...config),
    ...(i18n.length > 0 ? [provideStepperI18n(...i18n)] : []),
  ]);
}

/**
 * Component-scoped twin of {@link provideCngxStepper}. Spread into
 * `viewProviders` or `providers`. Same dispatch semantics — only the
 * provider scope differs.
 *
 * ```ts
 * @Component({
 *   viewProviders: [
 *     ...provideCngxStepperAt(
 *       withStepperDefaultOrientation('vertical'),
 *       withStepperI18nLabels({ stepperLabel: 'Schrittfolge' }),
 *     ),
 *   ],
 * })
 * ```
 *
 * @category common/stepper
 */
export function provideCngxStepperAt(
  ...features: readonly CngxStepperFeature[]
): Provider[] {
  const { config, i18n } = partitionFeatures(features);
  return [
    ...provideStepperConfigAt(...config),
    ...(i18n.length > 0 ? [provideStepperI18n(...i18n)] : []),
  ];
}
