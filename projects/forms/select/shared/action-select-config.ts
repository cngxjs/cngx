import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { PopoverPlacement } from '@cngx/common/popover';

/**
 * Focus-trap policy for the action-slot workflow:
 * - `'dirty'` (default) — trap on while `actionDirty()` is `true`.
 * - `'always'` — trap on whenever the panel is open.
 * - `'never'` — shell never engages the trap; consumer owns focus.
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
  /** ARIA label on the action-slot wrapper. Localisation hook. */
  readonly ariaLabel?: string;
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
export const CNGX_ACTION_SELECT_DEFAULTS: Required<CngxActionSelectConfig> = {
  focusTrapBehavior: 'dirty',
  ariaLabel: 'Inline-Aktion',
  closeOnCreate: null,
  actionPosition: 'bottom',
  liveInputFallback: true,
  popoverPlacement: 'bottom',
};

/**
 * Token carrying the resolved {@link CngxActionSelectConfig}.
 */
export const CNGX_ACTION_SELECT_CONFIG = new InjectionToken<CngxActionSelectConfig>(
  'CngxActionSelectConfig',
);

/**
 * Feature returned by the `with*` helpers. Merged by
 * {@link provideActionSelectConfig}.
 */
export interface CngxActionSelectConfigFeature {
  readonly config: Partial<CngxActionSelectConfig>;
  /** @internal Discriminator for `provideCngxSelect` dispatch. */
  readonly _target?: 'action';
}

function feature(
  config: Partial<CngxActionSelectConfig>,
): CngxActionSelectConfigFeature {
  return { config, _target: 'action' };
}

/**
 * Sets {@link CngxActionFocusTrapBehavior}.
 */
export function withFocusTrapBehavior(
  behavior: CngxActionFocusTrapBehavior,
): CngxActionSelectConfigFeature {
  return feature({ focusTrapBehavior: behavior });
}

/**
 * Sets the action-slot ARIA label.
 */
export function withActionAriaLabel(label: string): CngxActionSelectConfigFeature {
  return feature({ ariaLabel: label });
}

/**
 * Forces `closeOnCreate` across both action organisms. Pass `null` to
 * restore the variant baselines.
 */
export function withCloseOnCreate(
  closeOnCreate: boolean | null,
): CngxActionSelectConfigFeature {
  return feature({ closeOnCreate });
}

/**
 * Sets the default `*cngxSelectAction` slot position.
 */
export function withActionPosition(
  position: CngxActionPosition,
): CngxActionSelectConfigFeature {
  return feature({ actionPosition: position });
}

/**
 * Sets the live-input fallback policy. Disable when consumer owns
 * debouncing.
 */
export function withLiveInputFallback(
  enabled: boolean,
): CngxActionSelectConfigFeature {
  return feature({ liveInputFallback: enabled });
}

/**
 * Sets the popover placement for the action organisms.
 */
export function withActionPopoverPlacement(
  placement: PopoverPlacement,
): CngxActionSelectConfigFeature {
  return feature({ popoverPlacement: placement });
}

/**
 * App-wide action-select config. `provideActionSelectConfigAt` wins.
 *
 * @example
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
  return makeEnvironmentProviders([
    { provide: CNGX_ACTION_SELECT_CONFIG, useValue: merged },
  ]);
}

/**
 * Component-scoped action-select config. Returns `Provider[]` because
 * `viewProviders` rejects `EnvironmentProviders`.
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
  return [{ provide: CNGX_ACTION_SELECT_CONFIG, useValue: merged }];
}

/**
 * Effective config for the current injector. Injection context required.
 *
 * @internal
 */
export function resolveActionSelectConfig(): Required<CngxActionSelectConfig> {
  const user = inject(CNGX_ACTION_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    focusTrapBehavior:
      user.focusTrapBehavior ?? CNGX_ACTION_SELECT_DEFAULTS.focusTrapBehavior,
    ariaLabel: user.ariaLabel ?? CNGX_ACTION_SELECT_DEFAULTS.ariaLabel,
    closeOnCreate:
      user.closeOnCreate === undefined
        ? CNGX_ACTION_SELECT_DEFAULTS.closeOnCreate
        : user.closeOnCreate,
    actionPosition: user.actionPosition ?? CNGX_ACTION_SELECT_DEFAULTS.actionPosition,
    liveInputFallback:
      user.liveInputFallback ?? CNGX_ACTION_SELECT_DEFAULTS.liveInputFallback,
    popoverPlacement:
      user.popoverPlacement ?? CNGX_ACTION_SELECT_DEFAULTS.popoverPlacement,
  };
}
