import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * Structural surface a `CngxRadio` leaf exposes when it registers
 * itself with a parent `CngxRadioGroup`. The group keeps the
 * registry in DOM order so arrow-key navigation (driven by
 * `CngxRovingTabindex` host directive) and the
 * value-equality check (`group.value() === radio.value()`) both
 * have access to the leaf without injecting the concrete radio
 * class.
 *
 * @category interactive
 */
export interface CngxRadioRegistration<T = unknown> {
  readonly id: string;
  readonly value: () => T | undefined;
  readonly disabled: () => boolean;
}

/**
 * Parent-child contract every `CngxRadioGroup` provides via
 * `useExisting`. `CngxRadio` injects this token (never the
 * concrete `CngxRadioGroup` class) so the leaf stays decompose-
 * ready and free of cyclic type dependencies.
 *
 * `value` is a `ModelSignal<T | undefined>` because the group's
 * canonical value is two-way-bindable from the consumer
 * (`[(value)]`) and writable by the leaf when the user picks a
 * radio (`group.value.set(radio.value())`). `disabled` is a
 * read-only `Signal<boolean>` projected from the group's own
 * `model<boolean>`; leaves combine it with their own per-radio
 * `disabled()` to compute `radioDisabled`. `name` is the HTML
 * `name` attribute applied to all radio inputs in this group —
 * defaults to a `nextUid('cngx-radio-group')` value when the
 * consumer does not supply one.
 *
 * @category interactive
 */
export interface CngxRadioGroupContract<T = unknown> {
  readonly value: ModelSignal<T | undefined>;
  readonly disabled: Signal<boolean>;
  readonly name: Signal<string>;
  register(radio: CngxRadioRegistration<T>): void;
  unregister(id: string): void;
  /**
   * Consume the group's "last interaction was a roving-arrow keydown"
   * flag. Called by a leaf's `(focus)` handler — when the flag is
   * true, the leaf forwards its value to the group's `value` model
   * (W3C APG auto-select-on-arrow-nav semantics) and the flag is
   * cleared so a subsequent Tab-into focus does not double-select.
   * Returns whether the group actually consumed the flag, so the
   * leaf can short-circuit redundant work.
   */
  consumePendingArrowSelect(value: T): boolean;
}

/**
 * DI token a `CngxRadio` leaf injects to find its parent group.
 * Always provided via
 * `{ provide: CNGX_RADIO_GROUP, useExisting: CngxRadioGroup }`
 * — never via concrete-class injection (per
 * `reference_atomic_decompose` §4).
 *
 * @category interactive
 */
export const CNGX_RADIO_GROUP = new InjectionToken<CngxRadioGroupContract>(
  'CngxRadioGroup',
);
