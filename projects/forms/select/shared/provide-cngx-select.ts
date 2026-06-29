import type { EnvironmentProviders, Provider } from '@angular/core';

import {
  provideActionSelectConfig,
  provideActionSelectConfigAt,
  type CngxActionSelectConfigFeature,
} from './action-select-config';
import {
  provideSelectConfig,
  provideSelectConfigAt,
  type CngxSelectConfigFeature,
} from './config';
import {
  provideReorderableSelectConfig,
  provideReorderableSelectConfigAt,
  type CngxReorderableSelectConfigFeature,
} from './reorderable-select-config';

/**
 * Feature union for {@link provideCngxSelect} / {@link provideCngxSelectAt}.
 * The hidden `_target` discriminator routes each feature to its
 * underlying provider (`select`/`action`/`reorderable`).
 *
 * @category forms/select/config
 */
export type CngxSelectAggregatorFeature =
  | CngxSelectConfigFeature
  | CngxActionSelectConfigFeature
  | CngxReorderableSelectConfigFeature;

/** @internal */
interface BucketedFeatures {
  readonly select: CngxSelectConfigFeature[];
  readonly action: CngxActionSelectConfigFeature[];
  readonly reorderable: CngxReorderableSelectConfigFeature[];
}

function bucket(
  features: readonly CngxSelectAggregatorFeature[],
): BucketedFeatures {
  const select: CngxSelectConfigFeature[] = [];
  const action: CngxActionSelectConfigFeature[] = [];
  const reorderable: CngxReorderableSelectConfigFeature[] = [];
  for (const feature of features) {
    switch (feature._target) {
      case 'select':
        select.push(feature);
        break;
      case 'action':
        action.push(feature);
        break;
      case 'reorderable':
        reorderable.push(feature);
        break;
      default:
        // Back-compat for `{ config: {...} }` features built without a
        // `with*` helper - route to `provideSelectConfig`.
        select.push(feature as CngxSelectConfigFeature);
    }
  }
  return { select, action, reorderable };
}

/**
 * App-wide entry point for the Select-family configuration surfaces.
 * Routes mixed features from `provideSelectConfig`,
 * `provideActionSelectConfig`, and `provideReorderableSelectConfig` to
 * the correct underlying provider. The three individual providers stay
 * exported.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideCngxSelect(
 *       // CngxSelectConfig features
 *       withPanelWidth('trigger'),
 *       withVirtualization({ estimateSize: 36 }),
 *       withAriaLabels({ clearButton: 'Clear', chipRemove: 'Remove' }),
 *
 *       // CngxActionSelectConfig features
 *       withFocusTrapBehavior('strict'),
 *       withCloseOnCreate(true),
 *
 *       // CngxReorderableSelectConfig features
 *       withReorderKeyboardModifier('alt'),
 *       withReorderStripFreeze(true),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category forms/select/config
 */
export function provideCngxSelect(
  ...features: CngxSelectAggregatorFeature[]
): EnvironmentProviders[] {
  const { select, action, reorderable } = bucket(features);
  const out: EnvironmentProviders[] = [];
  if (select.length > 0) {
    out.push(provideSelectConfig(...select));
  }
  if (action.length > 0) {
    out.push(provideActionSelectConfig(...action));
  }
  if (reorderable.length > 0) {
    out.push(provideReorderableSelectConfig(...reorderable));
  }
  return out;
}

/**
 * Component-scoped twin of {@link provideCngxSelect}. Returns
 * `Provider[]` because `viewProviders` rejects `EnvironmentProviders`.
 *
 * ```ts
 * @Component({
 *   selector: 'tagged-multi-select-host',
 *   viewProviders: [
 *     ...provideCngxSelectAt(
 *       withChipOverflow('truncate'),
 *       withMaxVisibleChips(2),
 *       withReorderKeyboardModifier('meta'),
 *     ),
 *   ],
 *   template: `<cngx-reorderable-multi-select … />`,
 * })
 * ```
 *
 * @category forms/select/config
 */
export function provideCngxSelectAt(
  ...features: CngxSelectAggregatorFeature[]
): Provider[] {
  const { select, action, reorderable } = bucket(features);
  const out: Provider[] = [];
  if (select.length > 0) {
    out.push(...provideSelectConfigAt(...select));
  }
  if (action.length > 0) {
    out.push(...provideActionSelectConfigAt(...action));
  }
  if (reorderable.length > 0) {
    out.push(...provideReorderableSelectConfigAt(...reorderable));
  }
  return out;
}
