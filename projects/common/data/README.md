# @cngx/common/data — Async State System

Signal-based state machine for async operations. One typed source drives
skeleton, loading bar, empty state, error, toast, and ARIA — automatically.

## The Problem

```typescript
// Without cngx: 5 booleans, manual sync, no ARIA, no toast
isLoading = false;
isRefreshing = false;
hasError = false;
isEmpty = false;
errorMessage = '';
data: Resident[] = [];

async load() {
  this.isLoading = true;
  try {
    this.data = await firstValueFrom(this.http.get<Resident[]>('/api'));
    this.isEmpty = this.data.length === 0;
  } catch (e) {
    this.hasError = true;
    this.errorMessage = e.message;
  } finally {
    this.isLoading = false;
  }
}
```

## The Solution

```typescript
// With cngx: one source, everything derived
readonly residents = injectAtapAsyncState(() =>
  this.http.get<Resident[]>('/api/residents', {
    params: { filter: this.filter() },
  })
);
// residents.status(), residents.data(), residents.isFirstLoad(),
// residents.isEmpty(), residents.error(), residents.isBusy()
// — all computed(), all reactive, all consistent
```

---

## Five Factories

| Factory | Use Case | Injection Context |
|-|-|-|
| `injectAtapAsyncState(fn)` | Reactive query (GET) — auto-reloads on signal change | Required |
| `createAtapAsyncState()` | Mutation (POST/PUT/DELETE) — explicit `execute()` | Required |
| `createManualState()` | Full manual control — Web Workers, computations | Not needed |
| `fromResource(ref)` | Bridge for Angular `resource()` | Required |
| `fromHttpResource(ref)` | Bridge for Angular `httpResource()` with progress | Required |

All return `CngxAtapAsyncState<T>` — the same interface every UI component accepts.

---

## 1. injectAtapAsyncState — Reactive Query

Auto-loads when signal dependencies change. First load is `loading`,
subsequent loads are `refreshing` (old data stays visible).

### Basic GET

```typescript
private readonly http = inject(HttpClient);
private readonly filterText = signal('');

readonly residents = injectAtapAsyncState(() =>
  this.http.get<Resident[]>('/api/residents', {
    params: { q: this.filterText() },  // tracked — re-queries on change
  })
);
```

### With debounce

```typescript
readonly results = injectAtapAsyncState(
  () => this.http.get<Item[]>('/api/search', {
    params: { q: this.searchTerm() },
  }),
  { debounce: 300 },  // default: 50ms
);
```

### Manual refresh

```typescript
// In a "Refresh" button handler:
this.residents.refresh();
```

### Status lifecycle

```
Component init:     idle → loading → success
Filter changes:     success → refreshing → success  (data stays visible)
Network error:      loading → error
Refresh:            success → refreshing → success
```

### Template — Structural Directive

```html
<ul *cngxAsync="residents; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl">
  @for (r of data; track r.id) {
    <li>{{ r.name }}</li>
  }
</ul>

<ng-template #skelTpl>
  @for (i of [1,2,3]; track i) {
    <div class="skeleton-line"></div>
  }
</ng-template>

<ng-template #emptyTpl>
  <cngx-empty-state title="No residents" />
</ng-template>

<ng-template #errTpl let-err>
  <cngx-alert severity="error">{{ err }}</cngx-alert>
</ng-template>
```

### Template — Async Container (named slots)

```html
<cngx-async-container [state]="residents" ariaLabel="Residents"
  toastSuccess="Loaded" toastError="Failed to load">

  <ng-template cngxAsyncSkeleton>
    @for (i of [1,2,3]; track i) {
      <div class="skeleton-card"></div>
    }
  </ng-template>

  <ng-template cngxAsyncContent let-data>
    @for (r of data; track r.id) {
      <app-resident-card [resident]="r" />
    }
  </ng-template>

  <ng-template cngxAsyncEmpty>
    <cngx-empty-state title="No residents" />
  </ng-template>

  <ng-template cngxAsyncError let-err>
    <cngx-alert severity="error">
      {{ err }}
      <button cngxAlertAction (click)="residents.refresh()">Retry</button>
    </cngx-alert>
  </ng-template>
</cngx-async-container>
```

---

## 2. createAtapAsyncState — Mutation

For user-triggered actions (POST, PUT, DELETE). Uses `execute(fn)` which
sets `pending`, then `success` or `error`.

### Save form

```typescript
readonly saveAction = createAtapAsyncState<Resident>();

protected handleSave(): void {
  void this.saveAction.execute(() =>
    firstValueFrom(this.api.save(this.form.value()))
  );
}
```

### Template with action button

```html
<cngx-action-button [action]="handleSave" variant="primary"
  pendingLabel="Saving..." succeededLabel="Saved">
  Save Resident
</cngx-action-button>
```

### Template with manual status

```html
<button (click)="handleSave()"
  [disabled]="saveAction.isPending()">
  {{ saveAction.isPending() ? 'Saving...' : 'Save' }}
</button>

<cngx-toast severity="success" message="Saved"
  [when]="saveAction.status() === 'success'" />
<cngx-toast severity="error" message="Save failed"
  [when]="saveAction.status() === 'error'" />
```

### Delete with refresh

```typescript
readonly deleteAction = createAtapAsyncState<void>();

protected handleDelete(id: string): void {
  void this.deleteAction.execute(
    () => firstValueFrom(this.api.delete(id))
  ).then(() => this.residents.refresh());
}
```

### In a dialog

```html
<dialog cngxDialog #dlg="cngxDialog" [state]="saveAction">
  <h2 cngxDialogTitle>Edit Resident</h2>
  <!-- form content -->
  <button [cngxDialogClose]="true" [disabled]="saveAction.isPending()">
    Save
  </button>
</dialog>
```

When `saveAction` is `pending`: dialog prevents close, shows `aria-busy`.
When `saveAction` is `error`: dialog shows `cngx-dialog--error` class.

---

## 3. createManualState — Full Control

No HTTP, no injection context. For Web Workers, heavy computations,
WebSocket streams, or any scenario where you drive the state yourself.

### Web Worker

```typescript
readonly computation = createManualState<AnalysisResult>();

protected runAnalysis(): void {
  this.computation.set('loading');
  this.computation.setProgress(0);

  this.worker.postMessage({ type: 'analyze', data: this.dataset() });
}

// In worker message handler:
handleWorkerMessage(event: MessageEvent): void {
  switch (event.data.type) {
    case 'progress':
      this.computation.setProgress(event.data.value);
      break;
    case 'result':
      this.computation.setSuccess(event.data.result);
      break;
    case 'error':
      this.computation.setError(event.data.message);
      break;
  }
}
```

### Template with progress

```html
<cngx-progress [state]="computation" variant="linear" />

<cngx-async-container [state]="computation" ariaLabel="Analysis">
  <ng-template cngxAsyncSkeleton>
    <p>Running analysis...</p>
  </ng-template>

  <ng-template cngxAsyncContent let-result>
    <app-analysis-chart [data]="result" />
  </ng-template>
</cngx-async-container>
```

### WebSocket stream

```typescript
readonly liveData = createManualState<StockPrice[]>();

constructor() {
  this.liveData.set('loading');

  this.ws.messages$.pipe(
    takeUntilDestroyed(),
  ).subscribe({
    next: (prices) => this.liveData.setSuccess(prices),
    error: (err) => this.liveData.setError(err),
  });
}
```

---

## RxJS Operators

Three operators that wire Observable pipelines to `ManualAtapAsyncState`
automatically. No manual `subscribe({ next, error })` boilerplate.

| Operator | Input | Output | What it does |
|-|-|-|-|
| `tapAsyncState(state)` | `Observable<T>` | `Observable<T>` | `loading` on subscribe, `setSuccess` on next, `setError` on error |
| `tapAsyncProgress(state)` | `Observable<HttpEvent>` | `Observable<HttpEvent>` | Extracts progress events, calls `setProgress(0-100)` |
| `tapHttpAsyncState(state)` | `Observable<HttpEvent>` | `Observable<T>` | Combines: loading + progress + body extraction + success/error |

### tapAsyncState — Simple Observable Wiring

```typescript
readonly residents = createManualState<Resident[]>();

load(): void {
  this.http.get<Resident[]>('/api/residents').pipe(
    tapAsyncState(this.residents),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
  // residents.status() is 'loading', then 'success' or 'error'
  // No manual subscribe({ next, error }) needed
}
```

Works with any Observable, not just HTTP:

```typescript
// WebSocket
this.ws.messages$.pipe(
  tapAsyncState(this.liveData),
  takeUntilDestroyed(),
).subscribe();

// Timer-based polling
interval(5000).pipe(
  switchMap(() => this.http.get<Status>('/api/status')),
  tapAsyncState(this.status),
  takeUntilDestroyed(),
).subscribe();
```

Refresh mode — pass `{ status: 'refreshing' }` for subsequent loads:

```typescript
refresh(): void {
  this.http.get<Resident[]>('/api/residents').pipe(
    tapAsyncState(this.residents, { status: 'refreshing' }),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
  // Old data stays visible, loading bar appears
}
```

### tapAsyncProgress — HTTP Progress Tracking

Use with `{ observe: 'events', reportProgress: true }`:

```typescript
readonly upload = createManualState<UploadResult>();

handleUpload(file: File): void {
  this.upload.set('loading');

  this.http.post('/api/upload', file, {
    reportProgress: true,
    observe: 'events',
  }).pipe(
    tapAsyncProgress(this.upload),      // maps UploadProgress → setProgress(0-100)
    filter(e => e.type === HttpEventType.Response),
    map(e => (e as HttpResponse<UploadResult>).body!),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe({
    next: (result) => this.upload.setSuccess(result),
    error: (err) => this.upload.setError(err),
  });
}
```

### tapHttpAsyncState — All-in-One HTTP Operator

Combines `tapAsyncState` + `tapAsyncProgress` + response body extraction.
One operator, zero boilerplate:

```typescript
readonly upload = createManualState<UploadResult>();

handleUpload(file: File): void {
  this.http.post('/api/upload', file, {
    reportProgress: true,
    observe: 'events',
  }).pipe(
    tapHttpAsyncState(this.upload),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
  // upload.status()   → 'loading' → 'success'
  // upload.progress() → 0 → 25 → 50 → 75 → 100
  // upload.data()     → UploadResult
}
```

Template — everything wired from one source:

```html
<!-- Progress bar during upload -->
<cngx-progress [state]="upload" variant="linear" />

<!-- Status text -->
@if (upload.isBusy()) {
  <p>Uploading... {{ upload.progress() ?? 0 }}%</p>
}

<!-- Result -->
@if (upload.hasData()) {
  <p>Uploaded: {{ upload.data()!.filename }}</p>
}

<!-- Error -->
@if (upload.error(); as err) {
  <cngx-alert severity="error">Upload failed: {{ err }}</cngx-alert>
}

<!-- Toast -->
<cngx-toast severity="success" message="Upload complete"
  [when]="upload.status() === 'success'" />
```

### Comparison: With and Without Operators

**Without operators (manual wiring):**
```typescript
handleSave(): void {
  this.saveState.set('pending');
  this.http.put<Resident>('/api/residents', this.form.value()).pipe(
    takeUntilDestroyed(this.destroyRef),
  ).subscribe({
    next: (result) => {
      this.saveState.setSuccess(result);
      this.residents.refresh();
    },
    error: (err) => this.saveState.setError(err),
  });
}
```

**With `tapAsyncState` operator:**
```typescript
handleSave(): void {
  this.http.put<Resident>('/api/residents', this.form.value()).pipe(
    tapAsyncState(this.saveState, { status: 'pending' }),
    tap(() => this.residents.refresh()),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
}
```

---

## 4. fromResource — Angular resource() Bridge

Wraps Angular's `resource()` as `CngxAtapAsyncState<T>`. The resource stays
the single source of truth — all signals are derived projections.

```typescript
private readonly res = resource({
  request: () => ({ q: this.filter() }),
  loader: ({ request, abortSignal }) =>
    fetch(`/api/items?q=${request.q}`, { signal: abortSignal })
      .then(r => r.json()),
});

readonly items = fromResource(this.res);
```

### Template — same as any CngxAtapAsyncState

```html
<cngx-async-container [state]="items" ariaLabel="Items">
  <!-- identical template slots — UI doesn't know the source -->
</cngx-async-container>
```

---

## 5. fromHttpResource — Angular httpResource() Bridge

Like `fromResource` but maps HTTP progress (0-1 float) to
`CngxAtapAsyncState.progress` (0-100 integer).

```typescript
private readonly res = httpResource<Report>(() => ({
  url: '/api/reports/generate',
  method: 'POST',
  body: { params: this.reportParams() },
}));

readonly report = fromHttpResource(this.res);
```

### Template with progress bar

```html
<cngx-progress [state]="report" variant="linear" />

<cngx-async-container [state]="report" ariaLabel="Report">
  <ng-template cngxAsyncSkeleton>
    <p>Generating report... {{ report.progress() ?? 0 }}%</p>
  </ng-template>

  <ng-template cngxAsyncContent let-data>
    <app-report-viewer [report]="data" />
  </ng-template>
</cngx-async-container>
```

---

## Full Example: Resident Management

A complete, production-ready feature combining query, mutation, skeleton,
loading bar, error handling, toast, and empty state — all from typed sources.

### Service

```typescript
@Injectable({ providedIn: 'root' })
export class ResidentApi {
  private readonly http = inject(HttpClient);

  getAll(filter: string): Observable<Resident[]> {
    return this.http.get<Resident[]>('/api/residents', {
      params: filter ? { q: filter } : {},
    });
  }

  save(resident: Resident): Observable<Resident> {
    return this.http.put<Resident>(`/api/residents/${resident.id}`, resident);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/residents/${id}`);
  }
}
```

### Component

```typescript
@Component({
  selector: 'app-resident-list',
  template: `
    <input placeholder="Search..." (input)="setFilter($event)" />

    <cngx-async-container [state]="residents" ariaLabel="Residents"
      toastSuccess="Residents loaded" toastError="Failed to load">

      <ng-template cngxAsyncSkeleton>
        <cngx-card-grid minWidth="280px">
          @for (i of [1,2,3,4,5,6]; track i) {
            <cngx-card loading><cngx-card-skeleton /></cngx-card>
          }
        </cngx-card-grid>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <cngx-card-grid [items]="data" minWidth="280px">
          @for (r of data; track r.id) {
            <cngx-card>
              <header cngxCardHeader>{{ r.name }}</header>
              <div cngxCardBody>Room {{ r.room }}</div>
              <footer cngxCardFooter>
                <cngx-action-button [action]="makeDelete(r.id)"
                  variant="ghost" pendingLabel="Deleting...">
                  Delete
                </cngx-action-button>
              </footer>
            </cngx-card>
          }
        </cngx-card-grid>
      </ng-template>

      <ng-template cngxAsyncEmpty>
        <cngx-empty-state title="No residents"
          description="No residents match your search." />
      </ng-template>

      <ng-template cngxAsyncError let-err>
        <cngx-alert severity="error" title="Load failed">
          {{ err }}
          <button cngxAlertAction (click)="residents.refresh()">Retry</button>
        </cngx-alert>
      </ng-template>
    </cngx-async-container>

    <!-- Delete toasts (rising-edge trigger) -->
    <cngx-toast severity="success" message="Resident deleted"
      [when]="deleteState.status() === 'success'" />
    <cngx-toast severity="error" message="Delete failed"
      [when]="deleteState.status() === 'error'" />
  `,
  imports: [
    CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl,
    CngxAsyncEmptyTpl, CngxAsyncErrorTpl,
    CngxCardGrid, CngxCard, CngxCardHeader, CngxCardBody,
    CngxCardFooter, CngxCardSkeleton,
    CngxActionButton, CngxAlert, CngxEmptyState, CngxToast,
  ],
})
export class ResidentList {
  private readonly api = inject(ResidentApi);
  private readonly filterText = signal('');

  // Query — auto-reloads when filter changes
  readonly residents = injectAtapAsyncState(() =>
    this.api.getAll(this.filterText())
  );

  // Mutation — explicit execute()
  readonly deleteState = createAtapAsyncState<void>();

  protected makeDelete(id: string): () => Promise<void> {
    return () => this.deleteState.execute(
      () => firstValueFrom(this.api.delete(id))
    ).then(() => this.residents.refresh());
  }

  protected setFilter(event: Event): void {
    this.filterText.set((event.target as HTMLInputElement).value);
  }
}
```

### What happens automatically

| Moment | Status | UI Feedback |
|-|-|-|
| Component init | `idle` -> `loading` | 6 skeleton cards |
| Data loaded | `loading` -> `success` | Cards appear, toast "Residents loaded" |
| Empty array | `success` + `isEmpty` | Empty state with description |
| Type in filter | `success` -> `refreshing` | Loading bar at top, old cards stay visible |
| Filter results | `refreshing` -> `success` | New cards, bar disappears |
| Network error | `loading` -> `error` | Alert with retry button, toast "Failed to load" |
| Click delete | `idle` -> `pending` | Button shows "Deleting...", `aria-busy` |
| Delete OK | `pending` -> `success` | Toast "Resident deleted", list refreshes |
| Delete fails | `pending` -> `error` | Toast "Delete failed" |

### What you do NOT need to write

- No `isLoading` / `isRefreshing` / `hasError` booleans
- No `@if` / `@switch` chains for state management
- No manual `aria-busy` or screen reader announcements
- No manual toast timing or deduplication
- No manual subscription cleanup
- No manual error-to-UI mapping

Everything is derived from a single source. The state machine
cannot become inconsistent.

---

## CngxAtapAsyncState Interface

Every factory returns this interface — every UI component accepts it.

| Signal | Type | Description |
|-|-|-|
| `status` | `AsyncStatus` | `idle`, `loading`, `pending`, `refreshing`, `success`, `error` |
| `data` | `T \| undefined` | Most recent successful result |
| `error` | `unknown` | Most recent error |
| `progress` | `number \| undefined` | 0-100 or undefined |
| `isLoading` | `boolean` | `loading`, `pending`, or `refreshing` |
| `isPending` | `boolean` | Only `pending` (mutation in flight) |
| `isRefreshing` | `boolean` | Only `refreshing` (re-query, data visible) |
| `isBusy` | `boolean` | Same as `isLoading` — maps to `aria-busy` |
| `isFirstLoad` | `boolean` | No successful load yet |
| `isEmpty` | `boolean` | Data is `null`, `undefined`, or empty array |
| `hasData` | `boolean` | Inverse of `isEmpty` |
| `isSettled` | `boolean` | `success` or `error` |
| `lastUpdated` | `Date \| undefined` | Timestamp of last success |

## UI Components That Accept `[state]`

| Component | What it derives |
|-|-|
| `cngx-async-container` | Template slot selection, refresh bar, SR announcements, toast |
| `*cngxAsync` | Template slot selection via microsyntax |
| `cngx-skeleton` | `isLoading` from `isFirstLoad()` |
| `cngx-empty-state` | Auto-hides during loading and when data present |
| `cngx-loading-overlay` | `isBusy` or `isFirstLoad` (with `firstLoadOnly`) |
| `cngx-progress` | Determinate/indeterminate from `progress()` |
| `cngx-card-grid` | `isLoading` + `aria-busy`, empty override |
| `cngx-popover-panel` | Loading/error/empty slot selection |
| `cngx-treetable` | `aria-busy`, `isLoading`, `error`, `isEmpty` |
| `dialog[cngxDialog]` | `isPending` blocks close, `aria-busy`, error announcement |
