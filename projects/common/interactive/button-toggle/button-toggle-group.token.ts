import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * What `CngxButtonToggle` needs from a single-select group. Provide your own implementation under
 * `CNGX_BUTTON_TOGGLE_GROUP` to drive the leaf from a custom group.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-toggle-group.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_TOGGLE_GROUP, CngxButtonToggleGroup, CngxButtonToggle
 */
export interface CngxButtonToggleGroupContract<T = unknown> {
  readonly value: ModelSignal<T | undefined>;
  readonly disabled: Signal<boolean>;
  /**
   * Called on every leaf focus, disabled or not. Selects `value` and returns `true` after an
   * arrow, Home or End focus unless the group or `leafDisabled` is disabled.
   *
   * Read the flag with `CngxRovingTabindex.consumeNavigationKey()`, which clears it. Consume it on
   * every call, a disabled leaf included, or it outlives the arrow press and a later Tab selects.
   */
  consumePendingArrowSelect(value: T, leafDisabled?: boolean): boolean;
}

/**
 * The single-select group `CngxButtonToggle` injects. `CngxButtonToggleGroup` provides itself
 * here.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-toggle-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonToggleGroup, CngxButtonToggle, CNGX_BUTTON_MULTI_TOGGLE_GROUP
 */
export const CNGX_BUTTON_TOGGLE_GROUP = new InjectionToken<CngxButtonToggleGroupContract>(
  'CngxButtonToggleGroup',
);
