import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import {
  provideActionStatusConfig,
  provideActionStatusConfigAt,
  type CngxActionStatusConfigFeature,
} from '@cngx/common/interactive';
import { cngxDevWarn } from '@cngx/utils';

import {
  provideButtonConfig,
  provideButtonConfigAt,
  type CngxButtonConfigFeature,
} from './button-config';
import { provideButtonSpinner } from './button-spinner.token';
import { provideButtonCloseIcon } from './close-button.component';

/**
 * Feature of {@link withButtonCloseIcon}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo withButtonCloseIcon, provideCngxButton
 */
export interface CngxButtonCloseIconFeature {
  readonly _target: 'closeIcon';
  readonly component: Type<unknown>;
}

/**
 * Feature of {@link withButtonSpinner}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo withButtonSpinner, provideCngxButton
 */
export interface CngxButtonSpinnerFeature {
  readonly _target: 'spinner';
  readonly component: Type<unknown>;
}

/**
 * Every feature {@link provideCngxButton} accepts, including `withActionStatusLabels` /
 * `withActionStatusTemplates` from `@cngx/common/interactive`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideCngxButtonAt
 */
export type CngxButtonFeature =
  | CngxButtonConfigFeature
  | CngxButtonCloseIconFeature
  | CngxButtonSpinnerFeature
  | CngxActionStatusConfigFeature;

/**
 * {@link provideButtonCloseIcon} as a {@link provideCngxButton} feature.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideButtonCloseIcon
 */
export function withButtonCloseIcon(component: Type<unknown>): CngxButtonCloseIconFeature {
  return { _target: 'closeIcon', component };
}

/**
 * {@link provideButtonSpinner} as a {@link provideCngxButton} feature.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideButtonSpinner
 */
export function withButtonSpinner(component: Type<unknown>): CngxButtonSpinnerFeature {
  return { _target: 'spinner', component };
}

/** @internal */
interface PartitionedFeatures {
  readonly config: CngxButtonConfigFeature[];
  readonly actionStatus: CngxActionStatusConfigFeature[];
  readonly providers: Provider[];
}

/** @internal */
function partitionFeatures(
  features: readonly CngxButtonFeature[],
  caller: 'provideCngxButton' | 'provideCngxButtonAt',
): PartitionedFeatures {
  const config: CngxButtonConfigFeature[] = [];
  const actionStatus: CngxActionStatusConfigFeature[] = [];
  const providers: Provider[] = [];
  for (const feat of features) {
    if (feat._target === 'config') {
      config.push(feat);
      continue;
    }
    if (feat._target === 'actionStatus') {
      actionStatus.push(feat);
      continue;
    }
    if (feat._target === 'closeIcon') {
      providers.push(provideButtonCloseIcon(feat.component));
      continue;
    }
    if (feat._target === 'spinner') {
      providers.push(provideButtonSpinner(feat.component));
      continue;
    }
    // Unbranded feature - drop + dev-warn (mirrors `provideCngxStepper`).
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      if (caller === 'provideCngxButtonAt') {
        cngxDevWarn(
          'CNGX1041',
          'provideCngxButtonAt(): dropped feature without a `_target` ' +
            'discriminator. Pass config through `withButtonVariant` / `withButtonTone` / ' +
            '`withButtonSize`, the glyphs through `withButtonCloseIcon` / `withButtonSpinner` and the ' +
            'status defaults through `withActionStatusLabels` / `withActionStatusTemplates`; ' +
            'the caret goes through `withButtonCaretIcon` in `provideCngxMenuButton` (@cngx/common/menu-button).',
        );
      } else {
        cngxDevWarn(
          'CNGX1041',
          'provideCngxButton(): dropped feature without a `_target` ' +
            'discriminator. Pass config through `withButtonVariant` / `withButtonTone` / ' +
            '`withButtonSize`, the glyphs through `withButtonCloseIcon` / `withButtonSpinner` and the ' +
            'status defaults through `withActionStatusLabels` / `withActionStatusTemplates`; ' +
            'the caret goes through `withButtonCaretIcon` in `provideCngxMenuButton` (@cngx/common/menu-button).',
        );
      }
    }
  }
  return { config, actionStatus, providers };
}

/**
 * One root provider for the button family; routes each feature to its own `provide*`. A feature
 * without a `_target` is dropped with [`CNGX1041`](/error-codes/cngx1041.md). Use
 * {@link provideCngxButtonAt} in `viewProviders`. Menu buttons use `provideCngxMenuButton`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCngxButton(
 *       withButtonVariant('outline'),
 *       withButtonSize('sm'),
 *       withButtonCloseIcon(MaterialCloseIcon),
 *       withButtonSpinner(DotsSpinner),
 *     ),
 *   ],
 * });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButtonAt, provideButtonConfig, provideButtonCloseIcon, provideButtonSpinner, provideActionStatusConfig, withButtonVariant, withButtonCloseIcon, withButtonSpinner
 * <example-url>/#/common/button/button/scoped-defaults</example-url>
 */
export function provideCngxButton(...features: readonly CngxButtonFeature[]): EnvironmentProviders {
  const { config, actionStatus, providers } = partitionFeatures(features, 'provideCngxButton');
  return makeEnvironmentProviders([
    provideButtonConfig(...config),
    provideActionStatusConfig(...actionStatus),
    ...providers,
  ]);
}

/**
 * `viewProviders` / `providers` twin of {@link provideCngxButton}. Config and action status
 * features merge over the parent scope per key.
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideCngxButtonAt(withButtonVariant('ghost'), withButtonSpinner(DotsSpinner))],
 * })
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideButtonConfigAt, provideActionStatusConfigAt, withButtonVariant, withButtonCloseIcon, withButtonSpinner
 * <example-url>/#/common/button/button/scoped-defaults</example-url>
 */
export function provideCngxButtonAt(...features: readonly CngxButtonFeature[]): Provider[] {
  const { config, actionStatus, providers } = partitionFeatures(features, 'provideCngxButtonAt');
  return [
    ...provideButtonConfigAt(...config),
    ...provideActionStatusConfigAt(...actionStatus),
    ...providers,
  ];
}
