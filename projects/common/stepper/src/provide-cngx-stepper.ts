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
 * Union of every feature kind the stepper family aggregator accepts.
 * Today: config (`CNGX_STEPPER_CONFIG`) and i18n (`CNGX_STEPPER_I18N`).
 * Future surfaces (announcer cadence, scroll strategy, etc.) widen
 * this union and {@link provideCngxStepper} dispatches via each
 * feature's hidden `_target` discriminator.
 *
 * @category interactive
 */
export type CngxStepperFeature =
  | CngxStepperConfigFeature
  | CngxStepperI18nFeature;

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
    // Unbranded feature — caller wired a stale `(cfg) => cfg` (pre-
    // `defineStepperConfigFeature`) or a hand-rolled mutator without a
    // discriminator. Routing it blind to the config bucket is a
    // Pillar-3 silent-mutation hazard: an i18n-shaped override could
    // land in `CNGX_STEPPER_CONFIG` instead of `CNGX_STEPPER_I18N` and
    // the consumer would never see the difference. Dev mode warns
    // loudly so the wiring gets fixed; prod silently drops so a
    // mis-authored feature never crashes a deployed app. Both
    // directions communicate the violation per the
    // honest-failure rule.
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
 * Unified aggregator for the stepper family's configuration. Filters
 * features by `_target` and forwards to the matching `provide*` —
 * config features dispatch to {@link provideStepperConfig}, i18n
 * features to {@link provideStepperI18n}.
 *
 * Mirrors `provideCngxTabs` and `provideCngxSelect`. Apply once in the
 * application providers array.
 *
 * @example
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
 * @category interactive
 */
export function provideCngxStepper(
  ...features: readonly CngxStepperFeature[]
): EnvironmentProviders {
  const { config, i18n } = partitionFeatures(features);
  // `provideStepperConfig` returns EnvironmentProviders, `provideStepperI18n`
  // returns Provider — `makeEnvironmentProviders` accepts both.
  return makeEnvironmentProviders([
    provideStepperConfig(...config),
    ...(i18n.length > 0 ? [provideStepperI18n(...i18n)] : []),
  ]);
}

/**
 * Component-scoped twin of {@link provideCngxStepper}. Use in a component's
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
 *     ...provideCngxStepperAt(
 *       withStepperDefaultOrientation('vertical'),
 *       withStepperI18nLabels({ stepperLabel: 'Schrittfolge' }),
 *     ),
 *   ],
 * })
 * ```
 *
 * @category interactive
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
