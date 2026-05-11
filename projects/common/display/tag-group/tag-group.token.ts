import { InjectionToken, type Signal } from '@angular/core';

/**
 * Public host contract that `CngxTagGroup` and any future
 * non-component implementer must satisfy. Surfaced through
 * `CNGX_TAG_GROUP` so child `CngxTag` directives can read parent state
 * reactively without injecting a concrete parent class.
 *
 * The field is typed `Signal<boolean>` (the public parent type),
 * NOT `InputSignal<boolean>` — test doubles and programmatic groups
 * must be able to satisfy the contract without owning an Angular
 * `input()`. The `CngxTagGroup` implementer narrows its
 * `InputSignal<boolean>` to this public type via direct assignment
 * (`readonly semanticList: Signal<boolean> = this.semanticListInput`).
 * `InputSignal` already structurally extends `Signal`, so no runtime
 * conversion is needed — and `.asReadonly()` does NOT exist on
 * `InputSignal` (it lives on `WritableSignal` only); the type-only
 * narrowing is the canonical bridge.
 */
export interface CngxTagGroupHost {
  readonly semanticList: Signal<boolean>;
}

/**
 * DI token for parent `CngxTagGroup` <-> child `CngxTag` ARIA wiring.
 * Atomic-decompose rule 4 — communication via `InjectionToken`,
 * never via concrete parent class injection.
 *
 * `CngxTag` injects the token `{ optional: true }` and, when present,
 * derives its own `role="listitem"` from `host.semanticList()` via a
 * single `computed()`. When absent (Tag rendered outside any group),
 * the role attribute stays unset.
 *
 * Defaults to no provider — the token resolves to `null` for any
 * `CngxTag` that lives outside a `CngxTagGroup`.
 */
export const CNGX_TAG_GROUP = new InjectionToken<CngxTagGroupHost>('CNGX_TAG_GROUP');
