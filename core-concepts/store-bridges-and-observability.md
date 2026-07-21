<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Store Bridges & Async Observability

<aside class="cc-tldr">

Every async source funnels into one `CngxAsyncState` protocol. `@cngx/interop` adapts external engines (TanStack Query, NgRx SignalStore) onto it; an opt-in registry in `@cngx/common/data` aggregates every in-flight operation into a single derived `isAnythingLoading()`. No new state machine, no manual flags.

</aside>

`CngxAsyncState<T>` is the one lifecycle protocol a UI surface reads (see **Async State Machine**). This page covers the two ways a source that cngx does not own gets onto that protocol, and how a whole app reads "is anything loading?" from a single derived signal instead of N hand-maintained booleans.

Two questions drive the design:

- **Producing** the protocol from a foreign engine - TanStack Query, an `@ngrx/signals` store - without re-deriving the boolean view.
- **Aggregating** many independent operations into one shell-level source, opt-in, computed-only, without a central manager that violates Pillar 1.

Neither adds a state machine. `fromQuery` and the NgRx feature both build on the shipped kernels (`buildAsyncStateView`, `createManualState`); the registry is a Pillar-1-safe aggregation modelled on `CngxErrorRegistry`.

---

## The interop library

`@cngx/interop` is a Level-3 library sitting beside `@cngx/forms`. It exists so the third-party engines stay **optional peers** - `@tanstack/angular-query-experimental` and `@ngrx/signals` are declared `peerDependenciesMeta.optional`, isolated out of `@cngx/common`. Two secondary entries, one adapter each:

- `@cngx/interop/query` - `fromQuery`
- `@cngx/interop/signals` - `withCngxAsyncState`

A consumer installs only the engine they use; the other peer never loads.

---

## `fromQuery` - TanStack Query onto `CngxAsyncState`

`injectQuery(...)` returns a signal-bag (`status`, `fetchStatus`, `data`, `error` are all `Signal`s). `fromQuery` reads those signals and maps TanStack's `status` / `fetchStatus` pair onto the cngx `AsyncStatus` union, then hands the derived signals to `buildAsyncStateView` - the same single-source-of-truth kernel every other producer uses.

```typescript
import { injectQuery } from '@tanstack/angular-query-experimental';
import { fromQuery } from '@cngx/interop/query';

private readonly query = injectQuery(() => ({
  queryKey: ['users', this.filter()],
  queryFn: () => fetchUsers(this.filter()),
}));

readonly users = fromQuery(this.query);
// users.status(), users.data(), users.isFirstLoad() - all work
// <cngx-async-container [state]="users"> - direct binding
```

The status mapping mirrors `fromResource`'s `reloading -> refreshing`:

| TanStack | cngx `AsyncStatus` |
|-|-|
| `error` | `error` |
| `success` + `fetching` | `refreshing` (background refetch, data still visible) |
| `success` + idle/paused | `success` |
| `pending` + `fetching` | `loading` (first load, no data yet) |
| `pending` + idle/paused | `idle` (disabled or paused query) |

`fromQuery` requires no injection context - it is pure `computed()`. Its input is typed against a minimal structural interface, `CngxQueryLike<T>`, not the volatile experimental `CreateQueryResult` proxy type; a real query result satisfies the shape structurally.

---

## `withCngxAsyncState` - an NgRx SignalStore slice

`withCngxAsyncState` is an `@ngrx/signals` `signalStoreFeature` that grants any store a `CngxAsyncState`-shaped slice with zero hand-written status flags. It adds two members under the key you pass:

- `<key>State` - the read-only `CngxAsyncState<T>` view, for `[state]` bindings and the transition bridges.
- `<key>Sink` - the writable `ManualAsyncState<T>` that the existing `tapAsyncState` operator drives.

Both members are the same underlying `createManualState` instance, exposed under a read type and a write type. There is no new state machine - the shipped `tapAsyncState` wires the status flow.

```typescript
import { signalStore, withMethods } from '@ngrx/signals';
import { withCngxAsyncState } from '@cngx/interop/signals';
import { tapAsyncState } from '@cngx/common/data';

export const UsersStore = signalStore(
  withCngxAsyncState<User[]>()('users'),
  withMethods((store) => {
    const http = inject(HttpClient);
    return {
      load: () =>
        http.get<User[]>('/api/users').pipe(
          tapAsyncState(store.usersSink),
          takeUntilDestroyed(),
        ).subscribe(),
    };
  }),
);
// store.usersState.status(), store.usersState.data() - derived, no flags
```

**Why the `<T>()('key')` curry.** TypeScript cannot infer the literal key while `T` is given explicitly in one call - a single-call form collapses the key to a `string` index signature, which loses the concrete `usersState` / `usersSink` member names. Supplying `T` up front and inferring the key from the argument keeps the members concretely named.

---

## Opt-in async observability

Producing the protocol is half the story. The other half: a greenfield app shell that wants one top progress bar reading **every** in-flight operation, not N flags threaded through N components.

`CngxAsyncRegistry` is that single derived source. It is an opt-in aggregation registry, modelled on `CngxErrorRegistry`:

- Not `providedIn: 'root'` - consumers opt in with `provideAsyncRegistry()`. When the registry is absent, producers skip registration entirely.
- Exactly two public views, both `computed()` only - no `effect`, no service calls:
  - `isAnythingLoading: Signal<boolean>` - true when any registered operation reports `isLoading()`.
  - `activeOperations: Signal<readonly CngxAsyncOperation[]>` - every registered operation with its `id`, `label`, and current `status`.

```typescript
bootstrapApplication(AppComponent, {
  providers: [provideAsyncRegistry()],
});
```

```html
<!-- app shell: one derived source, not N booleans -->
<div class="top-progress" [attr.aria-busy]="registry.isAnythingLoading()"></div>
```

**Keyed by a per-operation uid, not the human label.** This is the one deliberate divergence from `CngxErrorRegistry` (which keys by a stable scope name). Async operations are transient and collide on label; `register(state, label?)` mints a fresh uid (`nextUid('cngx-async-op')`) and returns it, so N concurrent same-label (or unlabeled) operations are tracked independently and one `unregister` evicts exactly its own entry. The `label` is a display field only.

Inner status reactivity flows through each entry's `CngxAsyncState` signals - exactly as `CngxErrorRegistry.hasAnyError` reads `aggregator.hasError()`. The Map signal's key-set `equal` short-circuits register/unregister churn without hiding a status change.

**Error reaction stays consumer-wired.** The registry exposes read-only views; it never calls a toaster, alerter, or announcer. That would be a layer breach (`common` reaching into `ui`/`forms`) and Pillar-1 management. Error reaction runs through the transition bridges (`CngxToastOn` / `CngxAlertOn` / `CngxBannerOn`) against the produced state, exactly as with any other `CngxAsyncState`.

---

## Registering a component state

A component state opts into the registry through the injectable producer:

```typescript
readonly residents = injectAsyncState(
  () => this.api.getResidents(this.filter()),
  { register: true, label: 'Residents' },
);
```

`register` defaults to `false` - a no-op for existing callers, and a no-op when no registry is provided. When set, `injectAsyncState` resolves the registry optionally, registers the state under a fresh uid, and unregisters on the `DestroyRef` it already injects. The registration is a one-time synchronous write in the producer's construction path, never inside the auto-load `effect()`, so it adds no tracked dependency and cannot loop.

Pure factories (`createManualState`, `buildAsyncStateView`) stay injection-context-free and never register - only the injectable producer does.

---

## HTTP-level auto-observability

For the "light up the shell for all raw HTTP traffic" case, `provideAsyncHttpObservability()` wires a functional interceptor that registers every in-flight `HttpRequest` and unregisters on `finalize`:

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideAsyncRegistry(),
    provideAsyncHttpObservability(),
  ],
});
// every HttpClient call now surfaces in isAnythingLoading() - zero per-call wiring
```

The interceptor is fully opt-in and self-contained. It resolves `inject(CngxAsyncRegistry, { optional: true })` and passes the request straight through when no registry is provided. Otherwise it registers under a per-request uid, maps the response / error onto a `createManualState`, and `unregister`s in a `finalize` that fires on success **and** error (and on unsubscribe) - so a request can never pin the global loading state. It does not swallow errors: `setError` records the failure, then the error propagates to the caller unchanged.

Per-request `HttpContext` tokens name or exclude a request:

```typescript
import { withAsyncLabel, withAsyncSkip } from '@cngx/common/data';

// label it - shows in activeOperations()
this.http.get('/api/users', { context: withAsyncLabel('users') });

// exclude polling / telemetry pings from the aggregate
this.http.get('/api/ping', { context: withAsyncSkip() });
```

**Caveat - HttpClient ownership.** `provideAsyncHttpObservability()` calls `provideHttpClient(withInterceptors([cngxAsyncInterceptor]))` internally. Use it only when cngx owns the `HttpClient` setup. An app that already calls `provideHttpClient` (especially with `withFetch()`) would get a second, feature-less configuration - last-provider-wins on `HttpBackend` can silently revert `withFetch()` to XHR. In that case do not call it; add the exported `cngxAsyncInterceptor` to your own `withInterceptors` instead:

```typescript
provideHttpClient(withFetch(), withInterceptors([authInterceptor, cngxAsyncInterceptor]));
```

---

## The strangler-fig payoff

The protocol is the seam that lets a legacy module modernise without a rewrite. A feature of the shape "HttpClient `Observable` + manual `isLoading` boolean + `mat-table`" upgrades in two independent steps:

1. **UI upgrade, service untouched.** Wrap the `Observable` with `injectAsyncState({ register: true })`, drop the manual `isLoading` (now derived), bind `<cngx-treetable [state]="state">`. The table gains skeleton / empty / error for free, and `register: true` surfaces the operation in the shell progress without the component knowing.
2. **Internal refactor, UI stable.** Later swap the HttpClient internals for a SignalStore via `withCngxAsyncState`. The protocol stays byte-identical, so the template does not change.

One derived source at the shell, one protocol at every surface, adapters at the edges. That is the whole shape.

---

## What NOT to do

- Do not re-derive `isLoading` / `isEmpty` in an adapter. `fromQuery` and the NgRx sink both build on `buildAsyncStateView` / `createManualState` - the kernel owns the boolean view.
- Do not make the registry `providedIn: 'root'`. It is opt-in via `provideAsyncRegistry()`; a root default would tax every app whether it aggregates or not.
- Do not add an `effect` or a service call inside `CngxAsyncRegistry`. The two views are `computed()` only; error reaction is consumer-wired through the transition bridges.
- Do not key the registry by the human label. Two same-label operations must stay independent - the per-operation uid guarantees one `unregister` never evicts another.
- Do not call `provideAsyncHttpObservability()` when you already configure `HttpClient` with features. Add `cngxAsyncInterceptor` to your own `withInterceptors` so `withFetch()` and friends survive.
- Do not import `@tanstack/*` or `@ngrx/signals` from `@cngx/common`. The bridges live in `@cngx/interop` precisely to keep those peers optional and out of the lower layers.

---

## API reference

Every public symbol on this page, linked to its generated API entry. The links are relative, so they resolve on localhost and on the deployed docs alike.

**`@cngx/interop/query`**

- [`fromQuery`](../miscellaneous/functions/fromQuery.html) - TanStack Query adapter
- [`CngxQueryLike`](../interfaces/CngxQueryLike.html) - the structural input shape it accepts

**`@cngx/interop/signals`**

- [`withCngxAsyncState`](../miscellaneous/functions/withCngxAsyncState.html) - NgRx SignalStore feature
- [`CngxAsyncStateProps`](../miscellaneous/typealiases/CngxAsyncStateProps.html) - the store members it contributes

**`@cngx/common/data` - async observability**

- [`CngxAsyncRegistry`](../injectables/CngxAsyncRegistry.html) - the opt-in aggregation registry
- [`CngxAsyncOperation`](../interfaces/CngxAsyncOperation.html) - a registered-operation snapshot
- [`provideAsyncRegistry`](../miscellaneous/functions/provideAsyncRegistry.html) / [`injectAsyncRegistry`](../miscellaneous/functions/injectAsyncRegistry.html)
- [`cngxAsyncInterceptor`](../interceptors/cngxAsyncInterceptor.html) / [`provideAsyncHttpObservability`](../miscellaneous/functions/provideAsyncHttpObservability.html)
- [`withAsyncLabel`](../miscellaneous/functions/withAsyncLabel.html) / [`withAsyncSkip`](../miscellaneous/functions/withAsyncSkip.html), and the `CNGX_ASYNC_LABEL` / `CNGX_ASYNC_SKIP` [context tokens](../miscellaneous/variables.html)
