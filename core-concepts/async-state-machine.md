# Async State Machine

`CngxAsyncState<T>` is the standard interface for any value that arrives over time — HTTP responses, WebSocket pushes, user commits, server-driven autocompletes. It is **a bundle of signals**, not a single signal of an object. Every field on the interface is a `Signal<…>`, so consumers read what they care about and the reactive graph tracks only that field.

The interface lives in `@cngx/core/utils` and underpins the entire feedback layer (toasts, banners, alerts, skeletons, empty states, loading indicators, refresh bars, commit errors).

## The status enum

```typescript
type AsyncStatus =
  | 'idle' // never loaded, no data, no error
  | 'loading' // first load in flight, no data yet
  | 'pending' // commit/mutation in flight (write path)
  | 'refreshing' // re-fetch in flight, prior data still valid
  | 'success' // data is current
  | 'error'; // last operation failed
```

Six values, three concerns:

| Concern           | Statuses                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| **Read path**     | `idle`, `loading`, `success`, `error`                                         |
| **Re-fetch path** | `refreshing` (with prior `success` data still in `state.data()`)              |
| **Write path**    | `pending`, `success`, `error` (intentional commit, optimistic or pessimistic) |

The shape (every field is a `Signal<…>`):

```typescript
interface CngxAsyncState<T> {
  readonly status: Signal<AsyncStatus>;
  readonly data: Signal<T | undefined>;
  readonly error: Signal<unknown>;
  readonly progress: Signal<number | undefined>;

  // Derived booleans — every consumer can read these directly.
  readonly isLoading: Signal<boolean>; // loading | pending | refreshing
  readonly isPending: Signal<boolean>; // pending only
  readonly isRefreshing: Signal<boolean>; // refreshing only
  readonly isBusy: Signal<boolean>; // aria-busy alias for isLoading
  readonly isFirstLoad: Signal<boolean>; // no successful load has completed
  readonly isEmpty: Signal<boolean>; // data is empty / undefined
  readonly hasData: Signal<boolean>; // data is present and non-empty
  readonly isSettled: Signal<boolean>; // success | error

  readonly lastUpdated: Signal<Date | undefined>;
}
```

`data()` is `undefined` only while `status() === 'idle' | 'loading'`. After the first successful load, `data()` stays defined even while `status() === 'refreshing' | 'error'` — this is what enables stale-data + inline-error UX patterns. The `isFirstLoad` flag separates "never loaded" from "have data, just retrying".

Consumers never wrap `CngxAsyncState` in another `Signal`. The interface **is** the signal bundle — `inject(CNGX_STATEFUL).state.status()` works directly.

## Producers

A producer is anything that returns a `CngxAsyncState<T>`. The interface and the low-level `buildAsyncStateView` factory live in `@cngx/core/utils`; the application-level producers live in `@cngx/common/data` (secondary entry `@cngx/common/data/async-state`, re-exported from `@cngx/common/data`).

| Producer                                                 | Lives in            | Use when                                                                                                                                                                                      |
| -------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildAsyncStateView<T>(sources)`                        | `@cngx/core/utils`  | You already have separate `status`/`data`/`error` signals and want to assemble them into the standard interface. Used by `CngxActionButton`, `dialog[cngxDialog]`, and the optimistic helper. |
| `createManualState<T>()`                                 | `@cngx/common/data` | You drive status transitions imperatively (typical inside a commit controller). Returns `ManualAsyncState<T>` with explicit `setLoading`/`setSuccess`/`setError` methods.                     |
| `createAsyncState<T>()`                                  | `@cngx/common/data` | Same as manual, but the producer also exposes setters appropriate for ad-hoc orchestration. Returns `MutableAsyncState<T>`.                                                                   |
| `injectAsyncState<T>(fn)`                                | `@cngx/common/data` | Injection-context producer. Handles teardown via `DestroyRef`. Returns `ReactiveAsyncState<T>`.                                                                                               |
| `fromResource<T>(resource)`                              | `@cngx/common/data` | Wraps an Angular `resource()` into the CNGX shape.                                                                                                                                            |
| `fromHttpResource<T>(resource)`                          | `@cngx/common/data` | Wraps an Angular `httpResource()` with proper error mapping.                                                                                                                                  |
| `tapAsyncState`, `tapAsyncProgress`, `tapHttpAsyncState` | `@cngx/common/data` | RxJS operators that update a `ManualAsyncState` alongside an existing pipeline.                                                                                                               |

Prefer `injectAsyncState` for HTTP fetches, `createManualState` for commit controllers, and `fromHttpResource` for anything already using Angular `httpResource`.

## Consumers

A consumer accepts `[state]` as an input. The `[state]` input **takes precedence** over equivalent boolean inputs (`[loading]`, `[hasError]`) — wire state once and the consumer derives all the booleans internally.

Components that accept `[state]`:

| Surface                  | Component                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Loading scaffolds        | `cngx-skeleton`, `cngx-loading-overlay`, `cngx-loading-indicator`, `cngx-empty-state`                                      |
| Async content containers | `cngx-async-container`, `*cngxAsync`, `cngx-card-grid`                                                                     |
| Overlays                 | `cngx-popover-panel`, `dialog[cngxDialog]`                                                                                 |
| Tables                   | `cngx-treetable`, `cngx-mat-treetable`                                                                                     |
| Form controls            | `cngx-select`, `cngx-multi-select`, `cngx-combobox`, `cngx-typeahead`, `cngx-tree-select`, `cngx-reorderable-multi-select` |
| Recycler                 | `injectRecycler`                                                                                                           |

Each consumer derives its own concern from the bound `state`:

- `cngx-skeleton` shows placeholders when `state.status() === 'loading'`.
- `cngx-empty-state` shows the empty message when `state.status() === 'success'` and data is empty.
- `cngx-select` panel switches view based on `resolveAsyncView(...)` (see below).
- A `[cngxToastOn]` bridge fires a transition handler on `success`/`error`.

## resolveAsyncView()

`resolveAsyncView` is the function for deciding which UI surface to show. It is a pure function exported from `@cngx/common/data/async-state` and a sibling to `AsyncView`, the discriminated union it returns.

```typescript
type AsyncView = 'none' | 'skeleton' | 'content' | 'empty' | 'error' | 'content+error';

function resolveAsyncView(status: AsyncStatus, firstLoad: boolean, empty: boolean): AsyncView;
```

The lookup table:

| status                               | firstLoad | empty | view            |
| ------------------------------------ | --------- | ----- | --------------- |
| `idle`                               | true      | \*    | `none`          |
| `loading` / `refreshing` / `pending` | true      | \*    | `skeleton`      |
| `error`                              | true      | \*    | `error`         |
| `success`                            | \*        | true  | `empty`         |
| `error`                              | false     | \*    | `content+error` |
| (all other)                          | \*        | \*    | `content`       |

No separate `'idle'` view exists. Idle on first load maps to `'none'`, which the consumer renders as a blank slate or a "press the button to load" prompt. After the first successful load, the view never goes back to `'none'`.

`'content+error'` is the stale-data-plus-inline-error case (`status === 'error'`, prior data still in `data()`). `'error'` is the no-data-failed case (first load, no prior data).

Consumers call `resolveAsyncView` from a `computed` and switch on the result. The select family's panel-shell wires this into a single template switch covering all six variants — see `@cngx/forms/select/shared/panel-shell`.

## Transition bridges

A **transition bridge** reacts to a status transition (`idle → success`, `loading → error`, `refreshing → error`) and triggers an out-of-band notification. CNGX ships three, all as **attribute directives** (live in `@cngx/ui/feedback`):

| Bridge           | What it does                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| `[cngxToastOn]`  | Fires a toast on the configured transition.                                   |
| `[cngxAlertOn]`  | Renders an inline alert tied to the host component.                           |
| `[cngxBannerOn]` | Renders a top-of-page banner. Auto-dismisses on the next `success` or `idle`. |

The state binding is the directive's primary input (aliased to the directive name itself):

```html
<button [cngxToastOn]="saveState" toastSuccess="Saved" toastError="Save failed">Save</button>
```

The state input is **optional**. When omitted (bare attribute `cngxToastOn`), the bridge falls back to `inject(CNGX_STATEFUL, { optional: true })?.state` from the host or any ancestor providing `CNGX_STATEFUL`. The select family and `CngxActionButton` provide `CNGX_STATEFUL` directly, which means:

```html
<!-- cngx-select provides CNGX_STATEFUL — bridge auto-discovers state. -->
<cngx-select [commitAction]="save" [options]="options" cngxToastOn />
```

Resolution order: state input → `CNGX_STATEFUL` from DI → dev-mode error if neither resolves.

A bare attribute (`cngxToastOn` with no value, or `[cngxToastOn]=""`) is treated as "no input bound" via the input's empty-string transform and triggers the fallback. The directive shape:

```typescript
readonly state = input<
  CngxAsyncState<unknown> | undefined,        // ReadT — what the directive sees
  CngxAsyncState<unknown> | '' | undefined    // WriteT — what templates may bind
>(undefined, {
  alias: 'cngxToastOn',
  transform: (v) => (typeof v === 'string' ? undefined : v),
});
```

The `| ''` in WriteT is mandatory — HTML attributes without a value bind the empty string, and signal inputs are stricter about that than legacy `@Input()`. The transform maps the empty string back to `undefined`, which the `effectiveState` `computed` then resolves to the `CNGX_STATEFUL` fallback. Never use `input.required` on a directive that supports DI fallback — required inputs contradict the "works with OR without an input" contract.

### The untracked rule for bridges

Transition bridges install an `effect()` that calls a service method (`toaster.show()`, `banner.show()`, `alerter.show()`). The service methods read signals internally. **Without `untracked()`, those reads register as effect dependencies and the bridge re-fires infinitely.** Every bridge implementation wraps the service call:

```typescript
effect(() => {
  const t = tracker();
  if (t?.kind === 'success') {
    untracked(() => this.toaster.show({ message: 'Saved' }));
  }
});
```

A second trap: don't call `.set()` on any signal from inside a bridge effect that reads a transition tracker. The four feedback bridges are safe because they call external service methods (`toaster.show()`, etc.), not signal writes. The async-container is the documented exception — it writes an `announcement` signal from its tracker effect, and only stays loop-free because the tracker's structural `equal` short-circuits identical-status re-runs. When you add `createTransitionTracker` to new code, check that the effect body does not write any Angular signal.

## CNGX_STATEFUL

`CNGX_STATEFUL` is the DI token that exposes a host component's state surface to descendant bridges and consumers. The interface is intentionally minimal:

```typescript
interface CngxStateful<T = unknown> {
  readonly state: CngxAsyncState<T>;
}

const CNGX_STATEFUL = new InjectionToken<CngxStateful>('CNGX_STATEFUL');
```

Note: `state` is a `CngxAsyncState<T>`, **not** a `Signal<CngxAsyncState<T>>`. The interface is the signal bundle — wrapping it is redundant.

Components that own an async state surface provide the token:

```typescript
@Component({
  selector: 'cngx-select',
  providers: [{ provide: CNGX_STATEFUL, useExisting: CngxSelect }],
  ...
})
export class CngxSelect<T> implements CngxStateful<unknown> {
  readonly state = ...; // a CngxAsyncState<unknown>
}
```

This lets descendant bridges (`[cngxToastOn]`, `[cngxBannerOn]`, `[cngxAlertOn]`) and any custom consumer reach the state without an explicit binding. The select family, `dialog[cngxDialog]`, `CngxActionButton`, and other stateful organisms all provide it.

## Producer-consumer composition

The common pattern: a producer creates a state, a consumer renders it, a bridge handles notifications. They are wired by composition, not by configuration.

```typescript
// Producer (component code)
readonly users = injectAsyncState(() => this.api.listUsers());

// Consumer + bridge (template)
<cngx-async-container [state]="users" [cngxToastOn]="users" toastError="Could not load users.">
  <ng-template cngxAsyncContent let-data>
    @for (u of data; track u.id) { <user-row [user]="u" /> }
  </ng-template>
</cngx-async-container>
```

The producer emits transitions, the container picks the right view via `resolveAsyncView`, the bridge fires the toast on `error` — all from one `state` reference, with no subscriptions or manual flag wiring.

## What NOT to do

- Do not roll your own ad-hoc state shape (`isLoading$`, `errorMsg`, `data`) when `CngxAsyncState<T>` already covers it. The bundled `isLoading` / `isPending` / `isRefreshing` / `isFirstLoad` / `isSettled` signals are part of the interface.
- Do not bind `[loading]="state.isLoading()"` when `[state]="state"` works. The consumer derives loading/empty/error from `state` internally and selects the right view.
- Do not wrap a `CngxAsyncState` in another `Signal`. The interface IS the signal bundle — `Signal<CngxAsyncState<T>>` is one indirection too many.
- Do not forget `untracked()` inside a bridge effect or any effect that calls a service. The service reads signals internally and the missing `untracked` produces an infinite loop.
- Do not invent a new producer when `createManualState` or `injectAsyncState` covers the case. `createManualState` is the commit-controller default.
