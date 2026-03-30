# Async Container

Slot-based async state rendering with integrated loading skeletons, empty states, error states, and refresh indicators.

## Component

### CngxAsyncContainer

Renders different template slots based on async state lifecycle. Replaces the microsyntax approach (`*cngxAsync`) with named content slots and automatic refresh UI.

#### Import

```typescript
import {
  CngxAsyncContainer,
  CngxAsyncSkeletonTpl,
  CngxAsyncContentTpl,
  CngxAsyncEmptyTpl,
  CngxAsyncErrorTpl
} from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `state` | `CngxAsyncState<T>` | Required | Async state controlling which template renders. |
| `toastSuccess` | `string \| undefined` | `undefined` | Show success toast on state transition to `success`. |
| `toastError` | `string \| undefined` | `undefined` | Show error toast on state transition to `error`. |
| `toastErrorDetail` | `boolean` | `false` | Append `error.message` to error toast. |
| `toastSuccessDuration` | `number` | `3000` | Auto-dismiss duration for success toast (ms). |
| `toastErrorDuration` | `number \| 'persistent'` | `'persistent'` | Auto-dismiss duration for error toast. |

#### Rendering Rules

| State | Template |
|-|-|
| `idle` (no data) | skeleton if `isFirstLoad()`, nothing otherwise |
| `loading` + first load | skeleton |
| `loading` + has data (refresh) | content + refresh indicator |
| `success` + has data | content |
| `success` + no data | empty |
| `error` + no data | error |
| `error` + has data | content + error overlay |

#### Slot Directives

```typescript
// Skeleton template (first load)
<ng-template cngxAsyncSkeletonTpl>
  <cngx-skeleton></cngx-skeleton>
</ng-template>

// Content template (has data)
<ng-template cngxAsyncContentTpl let-data>
  <div>{{ data }}</div>
</ng-template>

// Empty state (no data after load)
<ng-template cngxAsyncEmptyTpl>
  <cngx-empty-state>No results</cngx-empty-state>
</ng-template>

// Error state (failed to load)
<ng-template cngxAsyncErrorTpl let-error="error">
  <cngx-alert severity="error" [message]="error.message"></cngx-alert>
</ng-template>
```

#### Example

```typescript
readonly state = injectAsyncState(() => this.loadItems$);

<cngx-async-container [state]="state()"
                      toastSuccess="Loaded"
                      toastError="Load failed"
                      [toastErrorDetail]="true">
  <ng-template cngxAsyncSkeletonTpl>
    <div class="skeleton">Loading…</div>
  </ng-template>

  <ng-template cngxAsyncContentTpl let-items>
    @for (item of items(); track item.id) {
      <div>{{ item.name }}</div>
    }
  </ng-template>

  <ng-template cngxAsyncEmptyTpl>
    <p>No items found.</p>
  </ng-template>

  <ng-template cngxAsyncErrorTpl let-error="error">
    <cngx-alert severity="error" [message]="error.message"></cngx-alert>
  </ng-template>
</cngx-async-container>
```

#### CSS Classes

| Class | When Applied |
|-|-|
| `cngx-async-container` | Always on host |
| `cngx-async-container--skeleton` | Skeleton template visible |
| `cngx-async-container--content` | Content template visible |
| `cngx-async-container--empty` | Empty template visible |
| `cngx-async-container--error` | Error template visible |
| `cngx-async-container--refreshing` | Data visible + refresh in progress |

#### Refresh Indicator

A built-in refresh bar appears when data is visible but loading (refresh scenario). Customization via CSS:

```scss
.cngx-async-container--refreshing::before {
  content: '';
  display: block;
  height: 2px;
  background: var(--cngx-progress-color, #1976d2);
  animation: progress 2s infinite;
}
```

---

## Toast Integration

When `[toastSuccess]` or `[toastError]` are set, toasts fire on state transitions:

- Success toast: fires when state transitions to `success`
- Error toast: fires when state transitions to `error`
- Requires `CngxToaster` in the dependency tree (must be provided)

---

## Comparison to *cngxAsync Microsyntax

| Aspect | Microsyntax | Async Container |
|-|-|-|
| Syntax | `*cngxAsync="state; let data"` | Named content slots |
| Readability | Compact, learns curve | Explicit, verbose |
| Toast integration | Manual `cngxToastOn` | Built-in `[toastSuccess]` |
| Refresh indicator | Manual CSS | Built-in `cngx-async-container--refreshing` |
| Flexibility | Limited | Full |

Both approaches are valid. Use microsyntax for simple cases; use `CngxAsyncContainer` for complex UIs with toasts.

---

## Advanced Patterns

### With Pagination

```typescript
readonly pageState = injectAsyncState(
  () => this.loadPage(this.currentPage()),
  { debounce: 200 }
);

<cngx-async-container [state]="pageState()">
  <ng-template cngxAsyncContentTpl let-items>
    @for (item of items(); track item.id) {
      <div>{{ item }}</div>
    }
    <button (click)="nextPage()">Next</button>
  </ng-template>
</cngx-async-container>
```

### With Refresh Button

```typescript
readonly state = injectAsyncState(() => this.loadData$);

<cngx-async-container [state]="state()">
  <ng-template cngxAsyncContentTpl>
    <button (click)="state.refresh()">Refresh</button>
  </ng-template>
</cngx-async-container>
```

### Error Recovery

```typescript
readonly state = injectAsyncState(() => this.loadData$);

<cngx-async-container [state]="state()">
  <ng-template cngxAsyncErrorTpl let-error="error">
    <p>{{ error.message }}</p>
    <button (click)="state.refresh()">Try again</button>
  </ng-template>
</cngx-async-container>
```

---

## Accessibility

- **ARIA live**: Refresh indicator announced via live region
- **ARIA busy**: Set during loading phases
- **Error announcements**: Error template content announced
- **Semantic HTML**: Uses native elements (no custom roles)

---

## See Also

- [CngxAsync (microsyntax)](../README.md) — Structural directive alternative
- [CngxAsyncState](https://github.com/cngxjs/cngx) — State management
- [CngxAlert](../alert/README.md) — Error display
- [CngxToaster](../toast/README.md) — Toast notifications
- Compodoc API documentation: `npm run docs:serve`
