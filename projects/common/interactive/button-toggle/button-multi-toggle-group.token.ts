import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * What `CngxButtonToggle` needs from a multi-select group. Provide your own implementation under
 * `CNGX_BUTTON_MULTI_TOGGLE_GROUP` to drive the leaf from a custom group. The leaf reads
 * `isSelected` inside a `computed()` and writes only through `toggle`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-multi-toggle-group.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_MULTI_TOGGLE_GROUP, CngxButtonMultiToggleGroup, CngxButtonToggle
 */
export interface CngxButtonMultiToggleGroupContract<T = unknown> {
  readonly selectedValues: ModelSignal<T[]>;
  readonly disabled: Signal<boolean>;
  isSelected(value: T): Signal<boolean>;
  toggle(value: T): void;
}

/**
 * The multi-select group `CngxButtonToggle` injects. `CngxButtonMultiToggleGroup` provides itself
 * here. The leaf throws [`CNGX1052`](/error-codes/cngx1052.md) when this and
 * `CNGX_BUTTON_TOGGLE_GROUP` both resolve and [`CNGX1053`](/error-codes/cngx1053.md) when neither
 * does, in production too.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-multi-toggle-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonMultiToggleGroup, CngxButtonToggle, CNGX_BUTTON_TOGGLE_GROUP
 */
export const CNGX_BUTTON_MULTI_TOGGLE_GROUP =
  new InjectionToken<CngxButtonMultiToggleGroupContract>('CngxButtonMultiToggleGroup');
