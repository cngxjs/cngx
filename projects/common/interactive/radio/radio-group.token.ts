import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';
import type { CngxRadioSkin } from '@cngx/common/display';

/**
 * Parent-child contract every `CngxRadioGroup` provides via
 * `useExisting`. `CngxRadio` injects this token (never the
 * concrete `CngxRadioGroup` class) so the leaf stays decompose-
 * ready and free of cyclic type dependencies.
 *
 * `value` is a `ModelSignal<T | undefined>` because the group's
 * canonical value is two-way-bindable from the consumer
 * (`[(value)]`) and writable by the leaf when the user picks a
 * radio (`group.value.set(radio.value())`). `isDisabled` is a
 * read-only `Signal<boolean>`: the group's own `disabled` OR the
 * disabled state of the field the group is the control of; leaves
 * combine it with their own per-radio `disabled()` to compute
 * `radioDisabled`. `isReadonly` is true while the group is the control
 * of a readonly field; leaves keep focus but skip their value write. `name` is the HTML
 * `name` attribute applied to all radio inputs in this group -
 * defaults to a `nextUid('cngx-radio-group')` value when the
 * consumer does not supply one. `skin` is the group-level indicator
 * skin each leaf falls back to; `undefined` defers to the
 * `CNGX_RADIO_CONFIG` cascade.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/radio/radio-group.token.ts
 * @since 0.1.0
 */
export interface CngxRadioGroupContract<T = unknown> {
  readonly value: ModelSignal<T | undefined>;
  readonly isDisabled: Signal<boolean>;
  readonly isReadonly: Signal<boolean>;
  readonly name: Signal<string>;
  readonly skin: Signal<CngxRadioSkin | undefined>;
  /**
   * Consume the group's "last interaction was a roving-arrow keydown"
   * flag. Called by a leaf's `(focus)` handler - when the flag is
   * true, the leaf forwards its value to the group's `value` model
   * (W3C APG auto-select-on-arrow-nav semantics) and the flag is
   * cleared so a subsequent Tab-into focus does not double-select.
   * Returns whether the group actually consumed the flag, so the
   * leaf can short-circuit redundant work.
   *
   * Called on every focus, a disabled leaf included: a group-disabled
   * radio stays focusable, and a flag it skipped would select on the
   * next unrelated focus. `leafDisabled` makes the group consume the
   * flag and refuse the selection.
   */
  consumePendingArrowSelect(value: T, leafDisabled?: boolean): boolean;
}

/**
 * DI token a `CngxRadio` leaf injects to find its parent group.
 * Always provided via
 * `{ provide: CNGX_RADIO_GROUP, useExisting: CngxRadioGroup }`
 * - never via concrete-class injection (per
 * `reference_atomic_decompose` §4).
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/radio/radio-group.token.ts
 * @since 0.1.0
 */
export const CNGX_RADIO_GROUP = new InjectionToken<CngxRadioGroupContract>('CngxRadioGroup');
