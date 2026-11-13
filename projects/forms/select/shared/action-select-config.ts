import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type Signal,
} from '@angular/core';

import type { PopoverPlacement } from '@cngx/common/popover';
import { coerceSignal } from '@cngx/core/utils';

import { injectSelectWord } from '../i18n/select-i18n';

/**
 * Focus-trap policy for the action-slot workflow:
 * - `'dirty'` (default) - trap on while `actionDirty()` is `true`.
 * - `'always'` - trap on whenever the panel is open.
 * - `'never'` - shell never engages the trap; consumer owns focus.
 */
export type CngxActionFocusTrapBehavior = 'always' | 'dirty' | 'never';

/**
 * Slot position inside the panel frame. Default `'bottom'`.
 */
export type CngxActionPosition = 'top' | 'bottom' | 'both' | 'none';

/**
 * App-wide config for the action-select organisms. Cascade: per-instance
 * input > `provideActionSelectConfigAt` > `provideActionSelectConfig` >
 * library default.
 */
export interface CngxActionSelectConfig {
  /** When the panel-shell's `CngxFocusTrap` activates. Default `'dirty'`. */
  readonly focusTrapBehavior?: CngxActionFocusTrapBehavior;
  /**
   * Accessible name of the action-slot group (`role="group"`) in every select
   * panel, value or `Signal`. Unset, it reads `actionGroup` of the `select`
   * language section (English `'Inline action'`).
   */
  readonly ariaLabel?: string | Signal<string>;
  /**
   * Forces `closeOnCreate` across both organisms. `null` (default) keeps
   * the variant baselines: single closes, multi keeps open.
   */
  readonly closeOnCreate?: boolean | null;
  /** Slot position inside the panel frame. Default `'bottom'`. */
  readonly actionPosition?: CngxActionPosition;
  /**
   * Falls back to the raw `<input>` value when the debounced `searchTerm`
   * hasn't caught up. Default `true`. Disable when consumer owns debouncing.
   */
  readonly liveInputFallback?: boolean;
  /** Popover placement for the action organisms. Default `'bottom'`. */
  readonly popoverPlacement?: PopoverPlacement;
}

/**
 * Library defaults. `closeOnCreate: null` lets each organism apply its
 * own baseline (single `true`, multi `false`).
 *
 * @internal
 */
export const CNGX_ACTION_SELECT_DEFAULTS: Required<Omit<CngxActionSelectConfig, 'ariaLabel'>> = {
  focusTrapBehavior: 'dirty',
  closeOnCreate: null,
  actionPosition: 'bottom',
  liveInputFallback: true,
  popoverPlacement: 'bottom',
};

/**
 * Resolved configuration for the action-select composites - the inline
 * create-action workflow shared by `CngxActionSelect` and
 * `CngxActionMultiSelect`. Holds the focus-trap behaviour, action-button
 * position, popover placement, ARIA label, and create / close timing.
 *
 * Provide it through one of two entry points, never the token directly:
 *
 * - `provideActionSelectConfig(...)` returns `EnvironmentProviders` - app bootstrap or a route.
 * - `provideActionSelectConfigAt(...)` returns `Provider[]` - a component's `providers` / `viewProviders`.
 *
 * Compose from the `with*` features (`withActionAriaLabel`, `withActionPosition`,
 * `withActionPopoverPlacement`). `provideActionSelectConfig` at the root
 * replaces the whole config; `provideActionSelectConfigAt` merges over the
 * parent scope, key by key - the keys it sets win, unset keys inherit.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/action-select-config.ts
 * @since 0.1.0
 * @relatedTo provideActionSelectConfig, provideActionSelectConfigAt, injectActionSelectConfig, withActionAriaLabel, withActionPosition, withActionPopoverPlacement, CngxActionSelect, CngxActionMultiSelect, withFocusTrapBehavior, withCloseOnCreate, withLiveInputFallback
 */
export const CNGX_ACTION_SELECT_CONFIG = new InjectionToken<CngxActionSelectConfig>(
  'CngxActionSelectConfig',
);

/**
 * One config slice returned by an action-select `with*` helper.
 *
 * Pass them to `provideActionSelectConfig`, `provideActionSelectConfigAt` or
 * `provideCngxSelect`. A later feature replaces the keys an earlier one set.
 */
export interface CngxActionSelectConfigFeature {
  readonly config: Partial<CngxActionSelectConfig>;
  /** @internal Discriminator for `provideCngxSelect` dispatch. */
  readonly _target?: 'action';
}

function feature(config: Partial<CngxActionSelectConfig>): CngxActionSelectConfigFeature {
  return { config, _target: 'action' };
}

/**
 * Sets when the panel of an action host traps focus.
 *
 * `'dirty'` (default) traps while the action slot reports unsaved input
 * through `setDirty(true)`, `'always'` traps whenever the panel is open, and
 * `'never'` leaves focus management to the consumer. While the trap is on,
 * Tab cycles inside the panel. Read by
 * `CngxActionSelect` and `CngxActionMultiSelect`; there is no per-instance
 * input.
 */
export function withFocusTrapBehavior(
  behavior: CngxActionFocusTrapBehavior,
): CngxActionSelectConfigFeature {
  return feature({ focusTrapBehavior: behavior });
}

/**
 * Sets the accessible name of the `role="group"` that wraps a projected
 * `*cngxSelectAction` slot.
 *
 * Unset, it reads `actionGroup` of the `select` language section (English
 * `'Inline action'`). Pass a `Signal` to follow a runtime language switch.
 * It applies in every select panel that renders the action slot.
 *
 * @example
 * ```ts
 * provideActionSelectConfig(withActionAriaLabel('Create a new tag'));
 * ```
 */
export function withActionAriaLabel(label: string | Signal<string>): CngxActionSelectConfigFeature {
  return feature({ ariaLabel: label });
}

/**
 * Sets whether a successful quick-create closes the panel on both action
 * hosts.
 *
 * `null` (default) keeps the baselines: `CngxActionSelect` closes,
 * `CngxActionMultiSelect` stays open for the next pick. A per-instance
 * `[closeOnCreate]` wins.
 *
 * @example
 * ```ts
 * provideActionSelectConfig(withCloseOnCreate(false));
 * ```
 */
export function withCloseOnCreate(closeOnCreate: boolean | null): CngxActionSelectConfigFeature {
  return feature({ closeOnCreate });
}

/**
 * Sets where the `*cngxSelectAction` slot sits in the panel of an action
 * host.
 *
 * `'bottom'` (default) places it below the options, `'top'` above them,
 * `'both'` renders it twice and `'none'` hides it. A per-instance
 * `[actionPosition]` wins.
 */
export function withActionPosition(position: CngxActionPosition): CngxActionSelectConfigFeature {
  return feature({ actionPosition: position });
}

/**
 * Sets whether a create reads the raw input value while the debounced
 * search term still lags.
 *
 * Default `true`, so a fast typist who triggers the create inside the
 * debounce window still creates what they typed. Set `false` when the
 * consumer owns the search pipeline and wants the debounced term only. A
 * per-instance `[liveInputFallback]` wins.
 */
export function withLiveInputFallback(enabled: boolean): CngxActionSelectConfigFeature {
  return feature({ liveInputFallback: enabled });
}

/**
 * Sets where the anchored panel of an action host opens relative to its
 * trigger.
 *
 * Default `'bottom'`. `CngxActionSelect` and `CngxActionMultiSelect` read this
 * key instead of `withPopoverPlacement`. A per-instance `[popoverPlacement]`
 * wins.
 */
export function withActionPopoverPlacement(
  placement: PopoverPlacement,
): CngxActionSelectConfigFeature {
  return feature({ popoverPlacement: placement });
}

/**
 * App-wide action-select config. `provideActionSelectConfigAt` wins.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideActionSelectConfig(
 *       withFocusTrapBehavior('always'),
 *       withActionAriaLabel('Quick action'),
 *       withCloseOnCreate(true),
 *       withActionPosition('top'),
 *       withLiveInputFallback(false),
 *     ),
 *   ],
 * });
 * ```
 */
export function provideActionSelectConfig(
  ...features: CngxActionSelectConfigFeature[]
): EnvironmentProviders {
  const merged: {
    -readonly [K in keyof CngxActionSelectConfig]?: CngxActionSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
  }
  return makeEnvironmentProviders([{ provide: CNGX_ACTION_SELECT_CONFIG, useValue: merged }]);
}

/**
 * Component-scoped action-select config. Returns `Provider[]` because
 * `viewProviders` rejects `EnvironmentProviders`. Merges over the
 * config of the parent injector: the keys set here win, unset keys inherit.
 */
export function provideActionSelectConfigAt(
  ...features: CngxActionSelectConfigFeature[]
): Provider[] {
  const merged: {
    -readonly [K in keyof CngxActionSelectConfig]?: CngxActionSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
  }
  return [
    {
      provide: CNGX_ACTION_SELECT_CONFIG,
      useFactory: (): CngxActionSelectConfig => ({
        ...inject(CNGX_ACTION_SELECT_CONFIG, { skipSelf: true, optional: true }),
        ...merged,
      }),
    },
  ];
}

/**
 * Effective config for the current injector. Injection context required.
 * `ariaLabel` is a `Signal`, read where the label is rendered so a runtime
 * language switch reaches it.
 *
 * @internal
 */
export function resolveActionSelectConfig(): Required<Omit<CngxActionSelectConfig, 'ariaLabel'>> & {
  readonly ariaLabel: Signal<string>;
} {
  const user = inject(CNGX_ACTION_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    focusTrapBehavior: user.focusTrapBehavior ?? CNGX_ACTION_SELECT_DEFAULTS.focusTrapBehavior,
    ariaLabel: coerceSignal(user.ariaLabel ?? injectSelectWord('actionGroup')),
    closeOnCreate:
      user.closeOnCreate === undefined
        ? CNGX_ACTION_SELECT_DEFAULTS.closeOnCreate
        : user.closeOnCreate,
    actionPosition: user.actionPosition ?? CNGX_ACTION_SELECT_DEFAULTS.actionPosition,
    liveInputFallback: user.liveInputFallback ?? CNGX_ACTION_SELECT_DEFAULTS.liveInputFallback,
    popoverPlacement: user.popoverPlacement ?? CNGX_ACTION_SELECT_DEFAULTS.popoverPlacement,
  };
}
