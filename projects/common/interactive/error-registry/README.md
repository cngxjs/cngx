# Error Registry

Programmatic root of the cngx error coordination system. The four sibling directives wire up the DOM side of "when do form errors become visible": `CngxErrorScope` owns the reveal flag, `CngxErrorSource` reports one condition into an aggregator, `CngxErrorAggregator` rolls many sources into one count, and `CngxErrorState` reflects one flag on one host, gated on the scope's `showErrors`. `CngxErrorRegistry` is the lookup surface that lets route guards, HTTP interceptors, and submit handlers reveal or reset those scopes by name without traversing the DOM.

## Import

```ts
import {
  CngxErrorRegistry,
  injectErrorScope,
  injectErrorAggregator,
  provideErrorRegistry,
  withGlobalRevealOnSubmit,
  withRevealOnNavigate,
} from '@cngx/common/interactive';
```

## Quick start

Register the registry once at bootstrap. At least one feature is normal; without features the registry installs but no ambient reveal triggers run.

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideErrorRegistry(
      withGlobalRevealOnSubmit(),
      withRevealOnNavigate(),
    ),
  ],
});
```

Any `[cngxErrorScope]` or `[cngxErrorAggregator]` with a name input now registers with the first change detection of its host view, re-registers on a rename and unregisters on destroy. Without the registry provider, those directives keep their pure DOM behaviour and skip registration silently.

A lookup by name works from the host component's `ngAfterViewInit` on. It finds nothing from the host's constructor or `ngOnInit`, nor from the `ngOnInit` of a component inside the same template. Code inside the subtree does not need the registry: inject `CNGX_ERROR_SCOPE` or `CNGX_ERROR_AGGREGATOR` and call the contract directly.

Driving a scope by name from outside the template:

```ts
const registry = inject(CngxErrorRegistry);

registry.reveal('checkout');  // show errors in the 'checkout' scope
registry.reset('checkout');   // hide them again
registry.revealAll();         // every registered scope
```

## Provider features

`provideErrorRegistry(...features)` composes via `_apply` partial-config functions, mirroring `provideFormField`. Order is irrelevant; each feature is applied once.

| Feature | Effect |
|-|-|
| `withGlobalRevealOnSubmit()` | Capture-phase document listener calls `revealAll()` on any `submit` event. Coarse-grained, fires for every form in the document. |
| `withRevealOnNavigate()` | Subscribes to `Router.NavigationStart` and calls `revealAll()`. Requires `provideRouter()`; no-op when no `Router` is provided. Fires before `CanActivate`/`CanDeactivate` guards run. |

For finer-grained behaviour (reveal one scope on one submit) skip these features and call `registry.reveal(name)` from the consumer's own handler. Both features can coexist with explicit per-form reveals.

## Programmatic scopes and aggregators

For flows that have no DOM host - route guards, interceptors, service-driven error orchestration - create the contracts directly. Both helpers must run in an injection context and both auto-register under `name` when a registry is present.

```ts
// Inside a route guard, service constructor, or runInInjectionContext
const checkoutScope = injectErrorScope('checkout');
const checkoutAggregator = injectErrorAggregator(
  'checkout',
  { card: cardInvalid, address: addressMissing },
  checkoutScope,
  { card: 'Card details', address: 'Shipping address' },
);

// Reveal from anywhere that has access to the registry
inject(CngxErrorRegistry).reveal('checkout');
```

`injectErrorScope(name?)` returns a `CngxErrorScopeContract` with `showErrors`, `reveal()`, `reset()`. `injectErrorAggregator(name?, sources?, scope?, labels?)` returns a `CngxErrorAggregatorContract` sharing the same computed graph as `[cngxErrorAggregator]`. Arguments are positional by design (Pillar 3: Komposition statt Konfiguration).

## Registry signals

`CngxErrorRegistry` exposes three derived signals for dashboards, debug panels, and submit-button enablement:

| Signal | Type | Meaning |
|-|-|-|
| `hasAnyError` | `Signal<boolean>` | True when any registered aggregator reports `hasError()`. |
| `totalErrorCount` | `Signal<number>` | Sum of `errorCount()` across every aggregator. |
| `errorAggregators` | `Signal<readonly CngxErrorAggregatorContract[]>` | All registered aggregators in insertion order. |

Registration is keyed by name and runs on `createKeyedRegistry` from `@cngx/core/utils`. A different instance under a taken name does not replace the holder (dev mode warns [`CNGX0004`](../../../../core-concepts/error-codes/cngx0004.md)); it waits and takes the name over when the holder unregisters. Call `unregisterScope(name, holder)` / `unregisterAggregator(name, holder)` first for an immediate swap.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/error-registry/) for the full signal and method surface.
- `CngxErrorScope` (`[cngxErrorScope]`) - the DOM-side reveal flag.
- `CngxErrorAggregator` (`[cngxErrorAggregator]`) - rolls many sources into one count.
- `CngxErrorSource` (`[cngxErrorSource]`) - reports one condition into an aggregator.
- `CngxErrorState` (`[cngxErrorState]`) - reflects one flag as class and ARIA, gated on `showErrors`.
