import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

import { provideButtonCaretIcon } from './caret-icon.token';
import { provideMenuButtonI18n, type CngxMenuButtonI18nFeature } from './i18n/menu-button-i18n';

/**
 * The feature `withButtonCaretIcon` returns.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/provide-cngx-menu-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxMenuButton, withButtonCaretIcon
 */
export interface CngxMenuButtonCaretIconFeature {
  readonly _target: 'caretIcon';
  readonly component: Type<unknown>;
}

/**
 * A feature of `provideCngxMenuButton(At)`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/provide-cngx-menu-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxMenuButton, withButtonCaretIcon, withMenuButtonI18nLabels
 */
export type CngxMenuButtonFeature = CngxMenuButtonCaretIconFeature | CngxMenuButtonI18nFeature;

/**
 * `provideButtonCaretIcon` as a `provideCngxMenuButton` feature.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/provide-cngx-menu-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxMenuButton, provideButtonCaretIcon
 */
export function withButtonCaretIcon(component: Type<unknown>): CngxMenuButtonCaretIconFeature {
  return { _target: 'caretIcon', component };
}

/** @internal */
interface PartitionedFeatures {
  readonly caret: Provider[];
  readonly i18n: CngxMenuButtonI18nFeature[];
}

/** @internal */
function partitionFeatures(
  features: readonly CngxMenuButtonFeature[],
  caller: 'provideCngxMenuButton' | 'provideCngxMenuButtonAt',
): PartitionedFeatures {
  const caret: Provider[] = [];
  const i18n: CngxMenuButtonI18nFeature[] = [];
  for (const feat of features) {
    if (feat._target === 'i18n') {
      i18n.push(feat);
      continue;
    }
    if (feat._target === 'caretIcon') {
      caret.push(provideButtonCaretIcon(feat.component));
      continue;
    }
    // Unbranded feature - drop + dev-warn (mirrors `provideCngxStepper`).
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      if (caller === 'provideCngxMenuButtonAt') {
        cngxDevWarn(
          'CNGX1041',
          'provideCngxMenuButtonAt(): dropped feature without a `_target` ' +
            'discriminator. Pass the caret through `withButtonCaretIcon(...)` ' +
            'and labels through `withMenuButtonI18nLabels(...)`.',
        );
      } else {
        cngxDevWarn(
          'CNGX1041',
          'provideCngxMenuButton(): dropped feature without a `_target` ' +
            'discriminator. Pass the caret through `withButtonCaretIcon(...)` ' +
            'and labels through `withMenuButtonI18nLabels(...)`.',
        );
      }
    }
  }
  return { caret, i18n };
}

/** @internal */
function toProviders({ caret, i18n }: PartitionedFeatures): Provider[] {
  return [...caret, ...(i18n.length > 0 ? [provideMenuButtonI18n(...i18n)] : [])];
}

/**
 * Sets the caret glyph and the labels of the menu-button family at the app root. Button-wide
 * defaults, the close glyph and the busy glyph go through `provideCngxButton`.
 *
 * `EnvironmentProviders`: `ApplicationConfig.providers` and route providers only. A component
 * subtree takes `provideCngxMenuButtonAt`.
 *
 * ```ts
 * provideCngxMenuButton(
 *   withButtonCaretIcon(MaterialCaret),
 *   withMenuButtonI18nLabels({ splitToggle: 'More actions' }),
 * );
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/provide-cngx-menu-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxMenuButtonAt, provideButtonCaretIcon, provideMenuButtonI18n, withButtonCaretIcon, withMenuButtonI18nLabels, provideCngxButton
 * <example-url>/#/common/menu-button/menu-button/scoped-defaults</example-url>
 */
export function provideCngxMenuButton(
  ...features: readonly CngxMenuButtonFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders(
    toProviders(partitionFeatures(features, 'provideCngxMenuButton')),
  );
}

/**
 * Component-scoped twin of `provideCngxMenuButton`: spread it into `providers` or
 * `viewProviders`.
 *
 * ```ts
 * viewProviders: [
 *   ...provideCngxMenuButtonAt(withMenuButtonI18nLabels({ splitToggle: 'Weitere Aktionen' })),
 * ],
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/provide-cngx-menu-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxMenuButton, withButtonCaretIcon, withMenuButtonI18nLabels
 * <example-url>/#/common/menu-button/menu-button/scoped-defaults</example-url>
 */
export function provideCngxMenuButtonAt(...features: readonly CngxMenuButtonFeature[]): Provider[] {
  return toProviders(partitionFeatures(features, 'provideCngxMenuButtonAt'));
}
