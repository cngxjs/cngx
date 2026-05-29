<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Async State Machine

`CngxAsyncState<T>` is the standard interface for any value that arrives over time - HTTP responses, WebSocket pushes, user commits, server-driven autocompletes. It is **a bundle of signals**, not a single signal of an object. Every field on the interface is a `Signal<…>`, so consumers read what they care about and the reactive graph tracks only that field.

The interface lives in `@cngx/core/utils` (file: `projects/core/utils/async-state.ts`) and underpins the entire feedback layer (toasts, banners, alerts, skeletons, empty states, loading indicators, refresh bars, commit errors).

**UX state, not data state.** `CngxAsyncState<T>` answers "what should the user see right now?" - not "what is the data?". It drives skeleton, loading bar, toast, empty state, ARIA, focus. It does **not** replace SignalStore, NgRx, or any data store; it composes with them. A store still owns the canonical entity cache; `CngxAsyncState<T>` is the lifecycle view that a single UI surface reads.

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

|Concern|Statuses|
|-|-|
|**Read path**|`idle`, `loading`, `success`, `error`|
|**Re-fetch path**|`refreshing` (with prior `success` data still in `state.data()`)|
|**Write path**|`pending`, `success`, `error` (intentional commit, optimistic or pessimistic)|

The shape (every field is a `Signal<…>`):

```typescript
interface CngxAsyncState<T> {
  readonly status: Signal<AsyncStatus>;
  readonly data: Signal<T | undefined>;
  readonly error: Signal<unknown>;
  readonly progress: Signal<number | undefined>;

  // Derived booleans - every consumer can read these directly.
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

`data()` is `undefined` only while `status() === 'idle' | 'loading'`. After the first successful load, `data()` stays defined even while `status() === 'refreshing' | 'error'` - this is what enables stale-data + inline-error UX patterns. The `isFirstLoad` flag separates "never loaded" from "have data, just retrying".

Consumers never wrap `CngxAsyncState` in another `Signal`. The interface **is** the signal bundle - `inject(CNGX_STATEFUL).state.status()` works directly.

## Producers

A producer is anything that returns a `CngxAsyncState<T>`. The interface and the low-level `buildAsyncStateView` kernel live in `@cngx/core/utils`; the application-level producers live in `@cngx/common/data` (re-exported from the root entry; they physically sit under `projects/common/data/async-state/`).

|Producer|Lives in|Use when|
|-|-|-|
|`buildAsyncStateView<T>(sources)`|`@cngx/core/utils`|You already have separate `status`/`data`/`error` signals and want to assemble them into the standard interface. Used by `CngxActionButton`, the select family, and other bespoke organisms.|
|`createManualState<T>()`|`@cngx/common/data`|You drive status transitions imperatively (typical inside a commit controller or a Web Worker pipeline). No injection context required. Returns `ManualAsyncState<T>` with `set` / `setSuccess` / `setError` / `setProgress` / `reset`.|
|`createAsyncState<T>()`|`@cngx/common/data`|Explicit user-triggered mutation (POST/PUT/DELETE). Returns `MutableAsyncState<T>` with an `execute(fn)` method that runs the action, manages cancellation through an internal `AbortController`, and transitions through `pending` -> `success`/`error`. Requires an injection context.|
|`injectAsyncState<T>(fn, options?)`|`@cngx/common/data`|Auto-loading reactive query. Re-runs `fn` when any signal it reads changes, debounced (default 50 ms). First call -> `loading`, subsequent calls -> `refreshing`. Returns `ReactiveAsyncState<T>` with a `refresh()` method. Requires an injection context.|
|`fromResource<T>(resource)`|`@cngx/common/data`|Projects an Angular `Resource<T>` onto the CNGX shape. Maps `idle`/`loading`/`reloading`/`resolved`/`local`/`error` -> CNGX statuses; tracks `isFirstLoad` via an internal `hadSuccess` signal. Requires an injection context (uses `effect()`).|
|`fromHttpResource<T>(resource)`|`@cngx/common/data`|Same as `fromResource` plus the HTTP progress signal mapped to `progress` (0-100, clamped, rounded). Declared structurally against `HttpResourceLike<T>` so the entry point does not import `@angular/common/http`.|
|`tapAsyncState`, `tapAsyncProgress`, `tapHttpAsyncState`|`@cngx/common/data`|RxJS operators that update a `ManualAsyncState` alongside an existing pipeline. `tapAsyncState` sets `loading` on subscribe (override via `{ status }`), `setSuccess` on next, `setError` on error (re-throws, does not swallow). `tapHttpAsyncState` adds progress and filters down to the response body.|

Prefer `injectAsyncState` for reactive HTTP fetches, `createAsyncState` for explicit mutations, `createManualState` for choreographed pipelines, and `fromHttpResource` for anything already using Angular `httpResource`.

## Consumers

A consumer accepts `[state]` as an input. The `[state]` input **takes precedence** over equivalent boolean inputs (`[loading]`, `[hasError]`, `[empty]`) - wire state once and the consumer derives all the booleans internally.

Components and directives that accept `[state]`:

|Surface|Component|
|-|-|
|Loading scaffolds|`cngx-skeleton`, `cngx-loading-overlay`, `cngx-loading-indicator`, `cngx-progress`, `cngx-empty-state`|
|Async content containers|`cngx-async-container`, `*cngxAsync`, `cngx-card-grid`|
|Inline feedback|`cngx-alert`|
|Overlays|`cngx-popover-panel`, `dialog[cngxDialog]`|
|Tables|`cngx-treetable`|
|Form controls|`cngx-select`, `cngx-multi-select`, `cngx-combobox`, `cngx-typeahead`, `cngx-tree-select`, `cngx-reorderable-multi-select`, `cngx-action-select`, `cngx-action-multi-select`, plus the shared `cngx-select-shell`|
|Recycler|`injectRecycler({ state })`|

Each consumer derives its own concern from the bound `state`:

- `cngx-skeleton` shows placeholders when `state.isFirstLoad()` is `true`. The skeleton owns the first-load phase and steps aside on refresh - prior data stays visible while the underlying query re-runs.
- `cngx-empty-state` hides itself when `state.isLoading() || !state.isEmpty()` and shows the empty message otherwise. The skeleton owns the loading phase; empty-state defers to it.
- `*cngxAsync` and `cngx-async-container` switch view based on `resolveAsyncView(...)` (see below).
- The select family routes its panel through `createSelectCore<T,TCommit>` and `resolveAsyncView` for the panel content.
- A `[cngxToastOn]` / `[cngxAlertOn]` / `[cngxBannerOn]` bridge fires a transition handler on `success` / `error` / `idle`.

## resolveAsyncView()

`resolveAsyncView` is the function for deciding which UI surface to show. It is a pure function exported from `@cngx/common/data` (source: `projects/common/data/async-state/resolve-view.ts`) and a sibling to `AsyncView`, the discriminated union it returns.

```typescript
type AsyncView = 'none' | 'skeleton' | 'content' | 'empty' | 'error' | 'content+error';

function resolveAsyncView(status: AsyncStatus, firstLoad: boolean, empty: boolean): AsyncView;
```

The lookup table:

|status|firstLoad|empty|view|
|-|-|-|-|
|`idle`|true|\*|`none`|
|`loading` / `refreshing` / `pending`|true|\*|`skeleton`|
|`error`|true|\*|`error`|
|`success`|false|true|`empty`|
|`error`|false|\*|`content+error`|
|(all other)|false|\*|`content`|

No separate `'idle'` view exists. Idle on first load maps to `'none'`, which the consumer renders as a blank slate or a "press the button to load" prompt. After the first successful load, `isFirstLoad` flips to `false` and the lookup falls through to `content` / `empty` / `content+error`.

`'content+error'` is the stale-data-plus-inline-error case (`status === 'error'`, prior data still in `data()`). `'error'` is the no-data-failed case (first load, no prior data).

Consumers call `resolveAsyncView` from a `computed` and switch on the result. `*cngxAsync` collapses `content+error` to `content` because a structural directive cannot render two views at once; pair it with `[cngxAlertOn]` or `[cngxBannerOn]` for the inline-error half. The select family wires the full six-variant switch through `createSelectCore<T,TCommit>` (source: `projects/forms/select/shared/select-core.ts`) into the shared `panel-shell.component.ts`.

## Transition bridges

A **transition bridge** reacts to a status transition (`idle -> success`, `loading -> error`, `refreshing -> error`) and triggers an out-of-band notification. All three are implemented on top of `createTransitionTracker(() => effectiveState()?.status() ?? 'idle')`, guard `current() === previous()` to skip non-transitions, and run their side effects inside `untracked()`. CNGX ships three, all as **attribute directives** (live in `@cngx/ui/feedback`):

|Bridge|What it does|
|-|-|
|`[cngxToastOn]`|Fires a `CngxToaster.show(...)` on transition to `success` or `error`. Inputs: `toastSuccess`, `toastError`, `toastErrorDetail`, `toastSuccessDuration`, `toastErrorDuration` (default `'persistent'`).|
|`[cngxAlertOn]`|Pushes an alert into the nearest `CngxAlertStack` (scoped via the `alertScope` input). Fires on `success` and/or `error` depending on which message inputs are set.|
|`[cngxBannerOn]`|Calls `CngxBanner.show(...)` with a required `bannerId` dedup key on transition to `error`; dismisses the same `bannerId` on transition to `success` or `idle`.|

The state binding is the directive's primary input (aliased to the directive name itself):

```html
<button [cngxToastOn]="saveState" toastSuccess="Saved" toastError="Save failed">Save</button>
```

The state input is **optional**. When omitted (bare attribute `cngxToastOn`), the bridge falls back to `inject(CNGX_STATEFUL, { optional: true })?.state` from the host or any ancestor providing `CNGX_STATEFUL`. The select family (all seven controls + the shared `select-shell`), the tabs presenter, the stepper presenter, and `cngxChipInput` provide `CNGX_STATEFUL` directly, which means:

```html
<!-- cngx-select provides CNGX_STATEFUL - bridge auto-discovers state. -->
<cngx-select [commitAction]="save" [options]="options" cngxToastOn />
```

Resolution order: state input -> `CNGX_STATEFUL` from DI -> `afterNextRender` dev-mode error if neither resolves. (Note: `CngxActionButton` and `dialog[cngxDialog]` expose a public `state` property and accept `[state]` as input but do **not** provide `CNGX_STATEFUL` via DI - bind explicitly: `[cngxToastOn]="btn.state"`.)

A bare attribute (`cngxToastOn` with no value, or `[cngxToastOn]=""`) is treated as "no input bound" via the input's empty-string transform and triggers the fallback. The directive shape:

```typescript
readonly state = input<
  CngxAsyncState<unknown> | undefined,        // ReadT - what the directive sees
  CngxAsyncState<unknown> | '' | undefined    // WriteT - what templates may bind
>(undefined, {
  alias: 'cngxToastOn',
  transform: (v) => (typeof v === 'string' ? undefined : v),
});
```

The `| ''` in WriteT is mandatory - HTML attributes without a value bind the empty string, and signal inputs are stricter about that than legacy `@Input()`. The transform maps the empty string back to `undefined`, which the `effectiveState` `computed` then resolves to the `CNGX_STATEFUL` fallback. Never use `input.required` on a directive that supports DI fallback - required inputs contradict the "works with OR without an input" contract.

### The untracked rule for bridges

Transition bridges install an `effect()` that calls a service method (`toaster.show()`, `banner.show()`, `alerter.show()`). The service methods read signals internally. **Without `untracked()`, those reads register as effect dependencies and the bridge re-fires infinitely.** Every bridge implementation reads only the tracker pair as tracked dependencies and wraps everything else - including the message/duration inputs and the service call itself - inside `untracked()`:

```typescript
const tracker = createTransitionTracker(() => this.effectiveState()?.status() ?? 'idle');

effect(() => {
  const status = tracker.current();
  const previous = tracker.previous();
  if (status === previous) {
    return;
  }
  untracked(() => {
    if (status === 'success') {
      this.toaster.show({ message: this.toastSuccess() ?? '' });
    }
  });
});
```

A second trap: don't call `.set()` on any signal from inside a bridge effect that reads a transition tracker. The four feedback bridges are safe because they call external service methods (`toaster.show()`, etc.), not signal writes. The async-container is the documented exception - it writes an `announcement` signal from its tracker effect, and only stays loop-free because the tracker's `equal` short-circuits identical-status re-runs (`linkedSignal` with `equal: (a, b) => a.current === b.current && a.previous === b.previous`). When you add `createTransitionTracker` to new code, check that the effect body does not write any Angular signal.

## CNGX_STATEFUL

`CNGX_STATEFUL` is the DI token that exposes a host component's state surface to descendant bridges and consumers. The token and its interface live in `projects/core/utils/stateful.ts`:

```typescript
interface CngxStateful<T = unknown> {
  readonly state: CngxAsyncState<T>;
}

const CNGX_STATEFUL = new InjectionToken<CngxStateful>('CNGX_STATEFUL');
```

Note: `state` is a `CngxAsyncState<T>`, **not** a `Signal<CngxAsyncState<T>>`. The interface is the signal bundle - wrapping it is redundant.

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

This lets descendant bridges (`[cngxToastOn]`, `[cngxBannerOn]`, `[cngxAlertOn]`) and any custom consumer reach the state without an explicit binding. The current providers are the select family (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxReorderableMultiSelect`, `CngxActionSelect`, `CngxActionMultiSelect`, and the shared `CngxSelectShell`), the tabs presenter, the stepper presenter, and `CngxChipInput`. `CngxActionButton` and `dialog[cngxDialog]` are stateful too but do not currently provide the token - bind their `state` explicitly when wiring a bridge.

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

The producer emits transitions, the container picks the right view via `resolveAsyncView`, the bridge fires the toast on `error` - all from one `state` reference, with no subscriptions or manual flag wiring.

## Bootstrap: provideFeedback()

The bridges depend on services (`CngxToaster`, `CngxBanner`, `CngxAlerter`) that are **not** `providedIn: 'root'`. Wire them once at the application root with `provideFeedback` from `@cngx/ui/feedback`:

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(
      withToasts({ defaultDuration: 3000, dedupWindow: 500 }),
      withAlerts({ maxVisible: 3 }),
      withBanners(),
      withSpinnerTemplate(MySpinner),
      withAlertIcons({ success: SuccessIcon, error: ErrorIcon }),
      withLoadingDefaults({ delay: 300, minDuration: 600 }),
      withCloseIcon(MyCloseIcon),
    ),
  ],
});
```

Each feature is opt-in. Forgetting `withToasts()` while using `[cngxToastOn]` throws a constructor error with the fix in the message: *"CngxToaster not found. Add withToasts() to provideFeedback() or call provideToasts() in your providers."*

## What NOT to do

- Do not roll your own ad-hoc state shape (`isLoading$`, `errorMsg`, `data`) when `CngxAsyncState<T>` already covers it. The bundled `isLoading` / `isPending` / `isRefreshing` / `isFirstLoad` / `isSettled` signals are part of the interface.
- Do not bind `[loading]="state.isLoading()"` when `[state]="state"` works. The consumer derives loading/empty/error from `state` internally and selects the right view.
- Do not wrap a `CngxAsyncState` in another `Signal`. The interface IS the signal bundle - `Signal<CngxAsyncState<T>>` is one indirection too many.
- Do not forget `untracked()` inside a bridge effect or any effect that calls a service. The service reads signals internally and the missing `untracked` produces an infinite loop.
- Do not invent a new producer when `createManualState` or `injectAsyncState` covers the case. `createManualState` is the commit-controller default.
