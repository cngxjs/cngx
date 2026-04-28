import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

/**
 * Selection contract a radio-grouping menu host exposes to its
 * `CngxMenuItemRadio` children. Children read `selectedValue()` to compute
 * `aria-checked` and call `select(value)` to update on click; the host owns
 * the writable signal so consumers two-way bind through it.
 *
 * @category interactive
 */
export interface CngxMenuRadioGroup<T> {
  readonly selectedValue: ModelSignal<T | undefined>;
  readonly name: Signal<string | undefined>;
  select(value: T): void;
}

/**
 * Factory shape — pass into a custom DI provider to wrap selection in
 * telemetry, server-sync, or audit logging without forking `CngxMenuGroup`.
 */
export type CngxMenuRadioGroupFactory = <T>(deps: {
  readonly selectedValue: ModelSignal<T | undefined>;
  readonly name: Signal<string | undefined>;
}) => CngxMenuRadioGroup<T>;

/**
 * Pure factory wiring a {@link CngxMenuRadioGroup} from already-created
 * signals. `CngxMenuGroup` implements the contract directly; this factory
 * exists for hand-built menu hosts that do not declare a directive but
 * still need to provide `CNGX_MENU_RADIO_GROUP`.
 */
export const createMenuRadioController: CngxMenuRadioGroupFactory = ({ selectedValue, name }) => ({
  selectedValue,
  name,
  select(value) {
    selectedValue.set(value);
  },
});

/**
 * DI token a radio-grouping menu host provides for `CngxMenuItemRadio` to
 * resolve. Items inject with `{ optional: true }` so a radio item rendered
 * outside any group still works (it just reports `aria-checked="false"`).
 */
export const CNGX_MENU_RADIO_GROUP = new InjectionToken<CngxMenuRadioGroup<unknown>>(
  'CNGX_MENU_RADIO_GROUP',
);
