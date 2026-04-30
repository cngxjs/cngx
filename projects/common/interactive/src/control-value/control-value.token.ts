import { InjectionToken, type ModelSignal, type WritableSignal } from '@angular/core';

/**
 * Structural contract every cngx interactive value-bearing atom exposes
 * to its surrounding form-bridge. Consumers (`CngxFormBridge`, custom
 * adapters, test harnesses) pull the token off the host element and
 * reach the atom's primary value plus its disabled flag without
 * importing the concrete directive class.
 *
 * Two-way binding flows through `value` (a `ModelSignal<T>`, never a
 * plain `WritableSignal<T>`); the `model<T>()` requirement is part of
 * the contract because Signal Forms relies on `value()` being callable
 * AND `value.set(v)` triggering the change-event Angular emits for
 * `[(value)]` template syntax.
 *
 * `disabled` stays a `WritableSignal<boolean>` because consumers
 * typically derive it externally (`computed(() => parentDisabled() ||
 * fieldDisabled())` and forward into the atom) — `model<boolean>()`
 * would force every implementer into a two-way binding they do not
 * need.
 *
 * @category interactive
 */
export interface CngxControlValue<T = unknown> {
  readonly value: ModelSignal<T>;
  readonly disabled: WritableSignal<boolean>;
}

/**
 * DI token every cngx interactive atom registers via `useExisting:
 * <self>` so its host element doubles as a value-shape contract for
 * `CngxFormBridge` and any future Reactive-Forms / Signal-Forms
 * integration in `@cngx/forms/controls`.
 *
 * No `providedIn`, no factory: providing the token is the atom's
 * responsibility. A surrounding consumer that wants a sane fallback
 * (e.g. an inert read-only value) supplies one in its own `providers`
 * block — the token deliberately does not invent a default because
 * "what is the value of an unbound control?" has no library-level
 * answer.
 *
 * @category interactive
 */
export const CNGX_CONTROL_VALUE = new InjectionToken<CngxControlValue>(
  'CngxControlValue',
);
