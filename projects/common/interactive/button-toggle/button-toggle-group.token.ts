import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * What a `CngxButtonToggle` needs from a single-select group. `CngxButtonToggleGroup` implements
 * it. Provide your own implementation under `CNGX_BUTTON_TOGGLE_GROUP` to drive the leaf from a
 * custom group.
 *
 * The leaf writes `value` on click, Space and Enter, and combines `disabled` with its own.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-toggle-group.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_TOGGLE_GROUP, CngxButtonToggleGroup, CngxButtonToggle
 */
export interface CngxButtonToggleGroupContract<T = unknown> {
  readonly value: ModelSignal<T | undefined>;
  readonly disabled: Signal<boolean>;
  /**
   * Called from the leaf's focus handler, disabled or not. Selects `value` and returns `true` when
   * focus just moved by a navigation key (arrows, Home, End) and neither the group nor the leaf
   * (`leafDisabled`) is disabled, otherwise returns `false`.
   *
   * The navigation flag lives on `CngxRovingTabindex`: read it with `consumeNavigationKey()`,
   * which also clears it, so a later Tab focus does not select. Every focus has to consume it,
   * including focus on a disabled leaf, or the flag outlives the arrow press that raised it.
   */
  consumePendingArrowSelect(value: T, leafDisabled?: boolean): boolean;
}

/**
 * Token through which `CngxButtonToggle` finds its single-select group. `CngxButtonToggleGroup`
 * provides itself here with `useExisting`.
 *
 * The leaf also looks for `CNGX_BUTTON_MULTI_TOGGLE_GROUP`. Whichever one it finds sets its mode
 * and ARIA pattern.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-toggle-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonToggleGroup, CngxButtonToggle, CNGX_BUTTON_MULTI_TOGGLE_GROUP
 */
export const CNGX_BUTTON_TOGGLE_GROUP = new InjectionToken<CngxButtonToggleGroupContract>(
  'CngxButtonToggleGroup',
);
