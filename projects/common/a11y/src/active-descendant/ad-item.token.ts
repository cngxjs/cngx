import { InjectionToken, type Signal } from '@angular/core';

/**
 * Descriptor of an item managed by `CngxActiveDescendant`.
 *
 * `id` must be unique and stable across change detection runs (use `nextUid()`
 * from `@cngx/core/utils`). `label` is used by typeahead matching.
 *
 * @category a11y
 */
export interface ActiveDescendantItem {
  /** Unique DOM `id` on the element — required for `aria-activedescendant`. */
  readonly id: string;
  /** Opaque value emitted on `activated`. Compared with `Object.is` by default. */
  readonly value: unknown;
  /** Human-readable text used by typeahead. Falls back to empty string. */
  readonly label: string;
  /** Disabled items are skipped during navigation when `skipDisabled` is true. */
  readonly disabled?: boolean;
}

/**
 * DI token for content-projected items that should register with the
 * surrounding `CngxActiveDescendant`.
 *
 * Consumers like `CngxOption` and `CngxMenuItem` expose themselves via:
 *
 * ```typescript
 * providers: [{ provide: CNGX_AD_ITEM, useExisting: MyItem }]
 * ```
 *
 * The contained directive must expose `id`, `value`, `label`, and optionally
 * `disabled` as signals — the AD reads them reactively.
 *
 * @category a11y
 */
export const CNGX_AD_ITEM = new InjectionToken<CngxAdItemHandle>('CNGX_AD_ITEM');

/**
 * Minimum shape an AD-registered directive must expose.
 *
 * The shape is signal-based so the AD recomputes when any field changes.
 *
 * @category a11y
 */
export interface CngxAdItemHandle {
  readonly id: string;
  readonly value: Signal<unknown>;
  /**
   * Label accessor. Typically a signal, but may be a plain getter when the
   * label derives from runtime DOM state (e.g. `textContent` fallback).
   */
  readonly label: Signal<string> | (() => string);
  readonly disabled?: Signal<boolean>;
}
