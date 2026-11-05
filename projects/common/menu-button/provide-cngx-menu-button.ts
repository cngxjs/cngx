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
 * Feature of {@link withButtonCaretIcon}: the caret glyph component, routed
 * to {@link provideButtonCaretIcon} by the hidden `_target: 'caretIcon'`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/provide-cngx-menu-button.ts
 * @since 0.1.0
 */
export interface CngxMenuButtonCaretIconFeature {
  readonly _target: 'caretIcon';
  readonly component: Type<unknown>;
}

/**
 * Union of every feature kind {@link provideCngxMenuButton} accepts: the
 * caret glyph and the menu-button labels (`withMenuButtonI18nLabels`).
 */
export type CngxMenuButtonFeature = CngxMenuButtonCaretIconFeature | CngxMenuButtonI18nFeature;

/**
 * The caret glyph of every menu button and split caret in scope, as a
 * {@link provideCngxMenuButton} feature. Same effect as
 * {@link provideButtonCaretIcon}.
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
 * Unified aggregator for the menu-button family. Filters by `_target` and
 * forwards: the caret glyph to {@link provideButtonCaretIcon}, labels to
 * {@link provideMenuButtonI18n}. The button-wide config, close glyph and busy
 * glyph go through `provideCngxButton` in `@cngx/common/button`; mirrors
 * `provideCngxStepper` / `provideCngxTabs`.
 *
 * Returns {@link EnvironmentProviders} for app-root use; the
 * component-scoped twin {@link provideCngxMenuButtonAt} returns
 * `Provider[]` because `viewProviders` cannot accept opaque
 * `EnvironmentProviders`.
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
 * @relatedTo provideCngxMenuButtonAt, provideButtonCaretIcon, provideMenuButtonI18n
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
 * Component-scoped twin of {@link provideCngxMenuButton}. Spread into
 * `viewProviders` or `providers`. Same dispatch semantics.
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
 * @relatedTo provideCngxMenuButton
 * <example-url>/#/common/menu-button/menu-button/scoped-defaults</example-url>
 */
export function provideCngxMenuButtonAt(...features: readonly CngxMenuButtonFeature[]): Provider[] {
  return toProviders(partitionFeatures(features, 'provideCngxMenuButtonAt'));
}
