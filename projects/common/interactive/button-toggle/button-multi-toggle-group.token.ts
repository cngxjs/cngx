import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * What a `CngxButtonToggle` needs from a multi-select group. `CngxButtonMultiToggleGroup`
 * implements it. Provide your own implementation under `CNGX_BUTTON_MULTI_TOGGLE_GROUP` to drive
 * the leaf from a custom group.
 *
 * - `isSelected(value)` returns the membership signal the leaf reads inside a `computed()` for
 *   `aria-pressed`.
 * - `toggle(value)` is the only write the leaf makes, on click, Space and Enter.
 * - `disabled` is combined with the leaf's own `disabled`.
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
 * Token through which `CngxButtonToggle` finds its multi-select group.
 * `CngxButtonMultiToggleGroup` provides itself here with `useExisting`.
 *
 * The leaf needs exactly one of this token and `CNGX_BUTTON_TOGGLE_GROUP`. It throws
 * [`CNGX1052`](/error-codes/cngx1052.md) when both resolve and
 * [`CNGX1053`](/error-codes/cngx1053.md) when neither does, in production too.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-multi-toggle-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonMultiToggleGroup, CngxButtonToggle, CNGX_BUTTON_TOGGLE_GROUP
 */
export const CNGX_BUTTON_MULTI_TOGGLE_GROUP =
  new InjectionToken<CngxButtonMultiToggleGroupContract>('CngxButtonMultiToggleGroup');
