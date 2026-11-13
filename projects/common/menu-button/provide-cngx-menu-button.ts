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
 * The caret glyph feature that `withButtonCaretIcon` returns for `provideCngxMenuButton`.
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
 * Every feature `provideCngxMenuButton` accepts: `withButtonCaretIcon` and
 * `withMenuButtonI18nLabels`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/provide-cngx-menu-button.ts
 * @since 0.1.0
 * @relatedTo provideCngxMenuButton, withButtonCaretIcon, withMenuButtonI18nLabels
 */
export type CngxMenuButtonFeature = CngxMenuButtonCaretIconFeature | CngxMenuButtonI18nFeature;

/**
 * The caret glyph of every menu button and split caret in scope, as a `provideCngxMenuButton`
 * feature. Same effect as `provideButtonCaretIcon`.
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
 * Sets up the menu-button family in one call at the app root: the caret glyph
 * (`withButtonCaretIcon`) and the labels (`withMenuButtonI18nLabels`). Button-wide defaults, the
 * close glyph and the busy glyph go through `provideCngxButton`.
 *
 * Returns `EnvironmentProviders`, so it works in `ApplicationConfig.providers` and route
 * providers only. Use `provideCngxMenuButtonAt` for a component subtree.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCngxButton(withButtonVariant('outline')),
 *     provideCngxMenuButton(
 *       withButtonCaretIcon(MaterialCaret),
 *       withMenuButtonI18nLabels({ splitToggle: 'More actions' }),
 *     ),
 *   ],
 * });
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
 * Component-scoped twin of `provideCngxMenuButton`. Returns `Provider[]`: spread it into
 * `providers` or `viewProviders`.
 *
 * ```ts
 * @Component({
 *   viewProviders: [
 *     ...provideCngxMenuButtonAt(withMenuButtonI18nLabels({ splitToggle: 'Weitere Aktionen' })),
 *   ],
 * })
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
