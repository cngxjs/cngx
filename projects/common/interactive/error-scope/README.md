# Error Scope

A DOM-subtree boundary that gates whether descendant error UI is visible. One of five pieces in the cngx error coordination family alongside `CngxErrorRegistry` (root), `CngxErrorAggregator` (groups), `CngxErrorSource`, and `CngxErrorState`.

A scope starts hidden, reveals on an explicit call (typically a `(submit)` handler, a route guard, or an HTTP interceptor reveal-on-422 pattern), and propagates that decision atomically to every descendant aggregator and error state through the `CNGX_ERROR_SCOPE` DI token.

## Import

```ts
import { CngxErrorScope, CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from '@cngx/common/interactive';
```

## Quick start

```html
<form
  [cngxErrorScope]
  cngxErrorScopeName="checkout"
  #scope="cngxErrorScope"
  (submit)="scope.reveal(); save()"
>
  <input [cngxErrorState]="email().invalid()" />
  <input [cngxErrorState]="card().invalid()" />
  <button type="submit">Pay</button>
</form>
```

Descendants stay silent until the user submits. A second submit is a no-op. `scope.reset()` puts the form back to its silent state, for example after a successful save.

## Public API

| Member | Type | Notes |
|-|-|-|
| `showErrors` | `Signal<boolean>` | Reactive flag descendants read through `CNGX_ERROR_SCOPE`. |
| `reveal()` | `void` | Sets `showErrors` to `true`. Idempotent. |
| `reset()` | `void` | Sets `showErrors` to `false`. Idempotent. |

Exported as `cngxErrorScope` for template references.

## `CNGX_ERROR_SCOPE` contract

`CngxErrorScope` provides itself for `CNGX_ERROR_SCOPE` via `useExisting`. Any descendant that needs the gate injects the token with `{ optional: true }` and falls back to "always visible" when no scope is in scope.

```ts
export interface CngxErrorScopeContract {
  readonly showErrors: Signal<boolean>;
  reveal(): void;
  reset(): void;
  readonly scopeName?: Signal<string | undefined>;
}
```

Implement this contract to override the gate, for example a test double that pre-reveals, or a host that mirrors `showErrors` from an external store.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for full input, output, and token reference.
- `CngxErrorRegistry` for the root registry that drives named scopes programmatically.
- `CngxErrorAggregator` for grouping per-field errors under a single count.
- `CngxErrorSource` for contributing errors from a non-form origin.
- `CngxErrorState` for the leaf directive that reflects a single field's invalidity.
