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
 * Feature of {@link withButtonCloseIcon}: the close glyph component, routed
 * to {@link provideButtonCloseIcon} by the hidden `_target: 'closeIcon'`.
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
 * `withButtonSize` helpers), the close glyph, the busy glyph and the action
 * status defaults (`withActionStatusLabels` / `withActionStatusTemplates`
 * from `@cngx/common/interactive`).
 */
export type CngxButtonFeature =
  | CngxButtonConfigFeature
  | CngxButtonCloseIconFeature
  | CngxButtonSpinnerFeature
  | CngxActionStatusConfigFeature;

/**
 * The close glyph of every `cngxCloseButton` in scope, as a
 * {@link provideCngxButton} feature. Same effect as {@link provideButtonCloseIcon}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideButtonCloseIcon
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
 * Unified aggregator for the button family. Filters by `_target` and
 * forwards: config features to {@link provideButtonConfig}, the close glyph
 * to {@link provideButtonCloseIcon}, the busy glyph to
 * {@link provideButtonSpinner}, the action status features to
 * `provideActionStatusConfig` (`@cngx/common/interactive`). Mirrors `provideCngxStepper` /
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
 * @relatedTo provideCngxButtonAt, provideButtonConfig, provideButtonCloseIcon, provideButtonSpinner, provideActionStatusConfig
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
 * Component-scoped twin of {@link provideCngxButton}. Spread into
 * `viewProviders` or `providers`. Same dispatch semantics; config features
 * merge over the parent scope's config (`provideButtonConfigAt`), the action
 * status features over the parent's action status config per key
 * (`provideActionStatusConfigAt`).
 *
 * ```ts
 * @Component({
 *   viewProviders: [...provideCngxButtonAt(withButtonVariant('ghost'), withButtonSpinner(DotsSpinner))],
 * })
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/provide-cngx-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxButton, provideButtonConfigAt, provideActionStatusConfigAt
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
