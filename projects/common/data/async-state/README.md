# Async State System

The canonical system for managing async operation lifecycle across `@cngx`. Every async operation—data loading, mutations, HTTP requests, Web Worker tasks—flows through these unified factories and interfaces.

## Import

```typescript
import {
  createManualState,
  createAsyncState,
  injectAsyncState,
  fromResource,
  fromHttpResource,
  tapAsyncState,
  tapAsyncProgress,
  tapHttpAsyncState,
  resolveAsyncView,
  type ManualAsyncState,
  type MutableAsyncState,
  type ReactiveAsyncState,
  type CngxAsyncState,
} from '@cngx/common/data';
```

## Core Concepts

**All async state is Signal-first.** The system cannot become inconsistent because every derived value (loading, pending, refreshing, empty, error) is `computed()` from a single source of truth: the `status` signal.

**All state changes are communicated.** Status transitions (loading → success, success → error) automatically update ARIA attributes, focus management, and SR announcements for any consuming component.

**No manual synchronization.** The contract is single-direction: the consumer creates a state factory, reads from it, and (for mutations) calls methods on it. Everything else is derived.

## Factories

### `createManualState<T>(): ManualAsyncState<T>`

Create fully manual async state — no HTTP, no automatic loading. Use for:
- Heavy local computations
- Web Worker operations
- Complex choreography with multiple steps
- Testing without injection context

**Requires:** No injection context.

**Returns:** `ManualAsyncState<T>` with methods `set()`, `setSuccess()`, `setError()`, `setProgress()`, `reset()`.

```typescript
readonly processState = createManualState<ProcessResult>();

async handleHeavyWork() {
  this.processState.set('loading');
  this.processState.setProgress(0);
  const result = await heavyComputation((percent) => {
    this.processState.setProgress(percent);
  });
  this.processState.setSuccess(result);
}
```

### `createAsyncState<T>(): MutableAsyncState<T>`

Create mutation state for explicit user-triggered actions (POST/PUT/DELETE). Sets `pending` before execution, then `success` or `error` on completion. Cancels in-flight requests if superseded.

**Requires:** Injection context (field initializer or constructor).

**Returns:** `MutableAsyncState<T>` with `execute()` method plus `reportProgress()` and `reset()`.

```typescript
readonly saveResident = createAsyncState<Resident>();

async handleSave() {
  await this.saveResident.execute(
    () => this.http.post('/api/residents', this.form.value)
  );
  // .status() is now 'success' or 'error'
}
```

### `injectAsyncState<T>(fn, options?): ReactiveAsyncState<T>`

Create reactive query state that auto-loads when signal dependencies change. Sets `loading` on first load, `refreshing` on subsequent reloads (data stays visible). Debounces requests by default (50ms configurable).

**Requires:** Injection context. The function `fn` is tracked by Angular's `effect()` — any signal read inside triggers a reload.

**Returns:** `ReactiveAsyncState<T>` with `refresh()` method.

**Options:**
- `debounce?: number` (default 50) — ms delay before executing the query after dependencies change

```typescript
readonly residents = injectAsyncState(
  () => this.api.getResidents(this.filter()),
  { debounce: 100 }
);
// Auto-loads when filter() changes
// Caches last result during refresh
```

### `fromResource<T>(ref: Resource<T>): CngxAsyncState<T>`

Bridge an Angular `resource()` onto `CngxAsyncState`. Maps ResourceStatus → AsyncStatus, tracks first-load state (not present in Angular's Resource).

**Requires:** Injection context (uses `effect()` for `hadSuccess` tracking).

**Returns:** Read-only `CngxAsyncState<T>` (no mutations).

```typescript
private readonly res = resource({
  request: () => ({ filter: this.filter() }),
  loader: ({ request, abortSignal }) =>
    fetch(`/api/items?q=${request.filter}`, { signal: abortSignal })
      .then(r => r.json()),
});

readonly items = fromResource(this.res);
// items.status(), items.data(), items.isFirstLoad() — all work
```

### `fromHttpResource<T>(ref: HttpResourceRef<T>): CngxAsyncState<T>`

Same as `fromResource` but additionally maps HTTP progress (0–1 float) to `progress` (0–100 integer). Avoids hard `@angular/common/http` import via structural interface typing.

**Requires:** Injection context.

**Returns:** `CngxAsyncState<T>` with `progress` signal wired from HTTP events.

```typescript
private readonly res = httpResource<Item[]>({
  url: '/api/items',
  params: { q: this.filter() },
});

readonly items = fromHttpResource(this.res);
// items.progress() tracks upload/download 0–100
```

## RxJS Operators

All operators work with `ManualAsyncState` — they only need the write interface (`set`, `setSuccess`, `setError`, `setProgress`).

### `tapAsyncState<T>(state, options?): MonoTypeOperatorFunction<T>`

Wires an Observable's lifecycle to async state. On subscribe: sets loading (or refreshing if data loaded). On next: calls `setSuccess`. On error: calls `setError` and re-throws.

The Observable passes through unchanged — side-effect operator.

**Options:**
- `status?: 'loading' | 'refreshing' | 'pending'` (default `'loading'`)

```typescript
readonly residents = createManualState<Resident[]>();

load() {
  this.http.get<Resident[]>('/api/residents')
    .pipe(
      tapAsyncState(this.residents),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe();
}
```

### `tapAsyncProgress<E>(state): MonoTypeOperatorFunction<E>`

Extracts upload/download progress from `HttpEvent` streams. Filters progress events, calculates percentage, calls `setProgress(0–100)`.

Use with `{ observe: 'events', reportProgress: true }` on HttpClient.

```typescript
readonly upload = createManualState<UploadResult>();

handleUpload(file: File) {
  this.http.post('/api/upload', file, {
    reportProgress: true,
    observe: 'events',
  })
    .pipe(
      tapAsyncProgress(this.upload),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe();
}
```

### `tapHttpAsyncState<T>(state, options?): OperatorFunction<unknown, T>`

Combines `tapAsyncState` + `tapAsyncProgress`. Pipe onto HttpClient with `{ observe: 'events', reportProgress: true }`. Extracts response body, calls `setSuccess(body)`, re-throws on error.

Output Observable emits response body (not HttpEvents).

**Options:**
- `status?: 'loading' | 'refreshing' | 'pending'` (default `'loading'`)

```typescript
readonly upload = createManualState<UploadResult>();

handleUpload(file: File) {
  this.http.post('/api/upload', file, {
    reportProgress: true,
    observe: 'events',
  })
    .pipe(
      tapHttpAsyncState(this.upload),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe((result) => {
      // result is UploadResult, not HttpEvent
    });
}
```

## View Resolution

### `resolveAsyncView(status, firstLoad, empty): AsyncView`

Pure function state machine that returns which view to render (`'none' | 'skeleton' | 'content' | 'empty' | 'error' | 'content+error'`).

Used internally by `CngxAsync` and `CngxAsyncContainer` to select template slots. Exported for custom rendering logic.

```typescript
const view = resolveAsyncView(
  this.residents.status(),
  this.residents.isFirstLoad(),
  this.residents.isEmpty(),
);

// view === 'skeleton' → show loading placeholders
// view === 'content' → show data
// view === 'empty' → show empty state
// view === 'error' → show error
// view === 'content+error' → show data with error bar overlay
```

## CngxAsyncState Interface

All factories return this read-only interface. Every field is a `Signal`.

### Status & Data Signals

| Signal | Type | Description |
|-|-|-|
| `status()` | `AsyncStatus` | Current status: `'idle' \| 'loading' \| 'pending' \| 'refreshing' \| 'success' \| 'error'` |
| `data()` | `T \| undefined` | The loaded/computed data. `undefined` until first success. |
| `error()` | `unknown` | The error object (if status is `'error'`), `undefined` otherwise. |
| `progress()` | `number \| undefined` | Upload/download progress 0–100, or `undefined` if N/A. |
| `lastUpdated()` | `Date \| undefined` | Timestamp of last successful load. |

### Derived Booleans

| Signal | Meaning |
|-|-|
| `isLoading()` | First load in progress (status = `'loading'`). |
| `isPending()` | Mutation in progress (status = `'pending'`). |
| `isRefreshing()` | Reload with cached data visible (status = `'refreshing'`). |
| `isBusy()` | Any operation running (loading OR pending OR refreshing). |
| `isFirstLoad()` | First load never completed yet. |
| `isEmpty()` | Data is null/undefined/empty array AND no busy operation. |
| `hasData()` | Data exists AND not empty. |
| `isSettled()` | Status is `'success'` or `'error'` (operation complete). |

## Accessibility

Every component accepting `CngxAsyncState<unknown>` as a state input automatically:

- Updates `aria-busy` when `isBusy()` changes
- Hides interactive controls when `isPending()` (for mutation states)
- Announces status transitions to screen readers via an `aria-live` region
- Shows/hides loading indicators based on `isFirstLoad()` vs `isRefreshing()`
- Renders semantic error messages with proper ARIA roles

Example: A button with async action:

```html
<button [cngxAsyncClick]="action" [attr.aria-busy]="action.state().isBusy()">
  {{ action.pending() ? 'Loading...' : 'Save' }}
</button>
```

The state is fully communicated without extra ARIA attributes — the component handles that.

## Composition

All async state consumers follow the same pattern:

```typescript
readonly myState = injectAsyncState(() => this.load());

<div [cngxAsyncClick]="handleSave" [state]="myState()">
  <!-- myState.status(), myState.data(), etc. all available -->
</div>
```

**No manual subscriptions.** Signals handle cleanup via Angular's DestroyRef.

**No status watchers.** All UI derived via `computed()` from the state signals.

**Full Observable/Promise support.** All factories accept both — handled transparently.

## Error Handling

Every async state tracks errors:

```typescript
readonly data = injectAsyncState(() => this.fetch());

@if (data.error()) {
  <cngx-alert severity="error">
    {{ (data.error() as any).message }}
  </cngx-alert>
}
```

RxJS operators re-throw errors after updating state — subscriptions handle error handling:

```typescript
source.pipe(tapAsyncState(state)).subscribe({
  error: (err) => { /* optional: custom error handling */ }
});
```

## See Also

- [CngxSmartDataSource](../data-source/README.md) — integrates async state with table rendering
- [CngxAsyncContainer](../../ui/feedback/README.md) — built-in skeleton/error/empty templates for async state
- [CngxAsyncClick](../../interactive/README.md) — directive that wires async action buttons to this system
- Compodoc: Full type reference at `/docs`
