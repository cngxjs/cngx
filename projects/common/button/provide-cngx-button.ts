import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

import {
  provideButtonConfig,
  provideButtonConfigAt,
  type CngxButtonConfigFeature,
} from './button-config';
import { provideButtonSpinner } from './button-spinner.token';
import { provideCloseIcon } from './close-button.component';

/**
 * Feature of {@link withButtonCloseIcon}: the close glyph component, routed
 * to {@link provideCloseIcon} by the hidden `_target: 'closeIcon'`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 */
export interface CngxButtonCloseIconFeature {
  readonly _target: 'closeIcon';
  readonly component: Type<unknown>;
}

/**
 * Feature of {@link withButtonSpinner}: the busy glyph component, routed to
 * {@link provideButtonSpinner} by the hidden `_target: 'spinner'`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 */
export interface CngxButtonSpinnerFeature {
  readonly _target: 'spinner';
  readonly component: Type<unknown>;
}

/**
 * Union of every feature kind {@link provideCngxButton} accepts: config
 * (`CNGX_BUTTON_CONFIG`, the `withButtonVariant` / `withButtonTone` /
 * `withButtonSize` helpers), the close glyph and the busy glyph.
 */
export type CngxButtonFeature =
  | CngxButtonConfigFeature
  | CngxButtonCloseIconFeature
  | CngxButtonSpinnerFeature;

/**
 * The close glyph of every `cngxCloseButton` in scope, as a
 * {@link provideCngxButton} feature. Same effect as {@link provideCloseIcon}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideCloseIcon
 */
export function withButtonCloseIcon(component: Type<unknown>): CngxButtonCloseIconFeature {
  return { _target: 'closeIcon', component };
}

/**
 * The busy glyph of every cngx button in scope, as a
 * {@link provideCngxButton} feature. Same effect as
 * {@link provideButtonSpinner}.
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
  readonly providers: Provider[];
}

/** @internal */
function partitionFeatures(
  features: readonly CngxButtonFeature[],
  caller: 'provideCngxButton' | 'provideCngxButtonAt',
): PartitionedFeatures {
  const config: CngxButtonConfigFeature[] = [];
  const providers: Provider[] = [];
  for (const feat of features) {
    if (feat._target === 'config') {
      config.push(feat);
      continue;
    }
    if (feat._target === 'closeIcon') {
      providers.push(provideCloseIcon(feat.component));
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
            'discriminator. Pass config through the `withButton*` helpers of @cngx/common/button.',
        );
      } else {
        cngxDevWarn(
          'CNGX1041',
          'provideCngxButton(): dropped feature without a `_target` ' +
            'discriminator. Pass config through the `withButton*` helpers of @cngx/common/button.',
        );
      }
    }
  }
  return { config, providers };
}

/**
 * Unified aggregator for the button family. Filters by `_target` and
 * forwards: config features to {@link provideButtonConfig}, the close glyph
 * to {@link provideCloseIcon}, the busy glyph to
 * {@link provideButtonSpinner}. Mirrors `provideCngxStepper` /
 * `provideCngxTabs`. The menu buttons have their own,
 * `provideCngxMenuButton` in `@cngx/common/menu-button`.
 *
 * Returns {@link EnvironmentProviders} for app-root use; the
 * component-scoped twin {@link provideCngxButtonAt} returns `Provider[]`
 * because `viewProviders` cannot accept opaque `EnvironmentProviders`.
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
 * @relatedTo provideCngxButtonAt, provideButtonConfig, provideCloseIcon, provideButtonSpinner
 * <example-url>/#/common/button/button/scoped-defaults</example-url>
 */
export function provideCngxButton(...features: readonly CngxButtonFeature[]): EnvironmentProviders {
  const { config, providers } = partitionFeatures(features, 'provideCngxButton');
  return makeEnvironmentProviders([provideButtonConfig(...config), ...providers]);
}

/**
 * Component-scoped twin of {@link provideCngxButton}. Spread into
 * `viewProviders` or `providers`. Same dispatch semantics; config features
 * merge over the parent scope's config (`provideButtonConfigAt`).
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideCngxButtonAt(withButtonVariant('ghost'), withButtonSpinner(DotsSpinner))],
 * })
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideButtonConfigAt
 * <example-url>/#/common/button/button/scoped-defaults</example-url>
 */
export function provideCngxButtonAt(...features: readonly CngxButtonFeature[]): Provider[] {
  const { config, providers } = partitionFeatures(features, 'provideCngxButtonAt');
  return [...provideButtonConfigAt(...config), ...providers];
}
