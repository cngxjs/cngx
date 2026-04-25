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
 * Discriminated union covering every feature accepted by
 * {@link provideCngxSelect} / {@link provideCngxSelectAt}. The hidden
 * `_target` field on each `with*` return value lets the aggregator
 * dispatch to the correct underlying provider:
 *
 *   - `'select'`   → `provideSelectConfig`
 *   - `'action'`   → `provideActionSelectConfig`
 *   - `'reorderable'` → `provideReorderableSelectConfig`
 *
 * Consumers never see `_target` — every existing `with*` function
 * returns a typed feature whose discriminator is set by its central
 * `feature()` helper. New features are auto-tagged by virtue of using
 * the same helper inside their respective config modules.
 *
 * @category interactive
 */
export type CngxSelectAggregatorFeature =
  | CngxSelectConfigFeature
  | CngxActionSelectConfigFeature
  | CngxReorderableSelectConfigFeature;

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
        // Backwards-compat for callers using a custom feature shape
        // (e.g. tests constructing `{ config: {...} }` directly without
        // going through the `with*` helpers). Default to the most
        // common surface — `provideSelectConfig`.
        select.push(feature as CngxSelectConfigFeature);
    }
  }
  return { select, action, reorderable };
}

/**
 * Unified app-wide entry point for every Select-family configuration
 * surface. Accepts a mix of features from `provideSelectConfig`,
 * `provideActionSelectConfig`, and `provideReorderableSelectConfig`
 * — internally dispatches each feature to the correct underlying
 * provider via the hidden `_target` discriminator on the feature.
 *
 * Existing app-wide setup (`provideSelectConfig(...)` etc.) keeps
 * working — the three providers stay exported and behaviourally
 * identical. The aggregator is purely additive: it lets apps that
 * configure two or more surfaces collapse their `bootstrapApplication`
 * providers into a single call.
 *
 * @example
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
 * @category interactive
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
 * Component-scoped twin of {@link provideCngxSelect}. Drop into a
 * component's `viewProviders` to override every Select-family surface
 * for that component subtree without touching the app-wide
 * configuration.
 *
 * Returns the flat `Provider[]` shape required by `viewProviders` /
 * `providers` (Angular 21's `EnvironmentProviders` is not accepted in
 * those slots).
 *
 * @example
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
 * @category interactive
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
