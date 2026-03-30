# CngxAsync — Async Structural Directive

Template-level async state rendering with microsyntax. Renders different views based on `CngxAsyncState` status: skeleton (loading), content (success), empty, or error.

## Import

```typescript
import {
  CngxAsync,
  type CngxAsyncContext,
} from '@cngx/common/data';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxAsync } from '@cngx/common/data';
import { injectAsyncState } from '@cngx/common/data';

@Component({
  selector: 'app-residents',
  template: `
    <ul *cngxAsync="residents; let data">
      @for (r of data; track r.id) {
        <li>{{ r.name }}</li>
      }
    </ul>
  `,
  imports: [CngxAsync],
})
export class ResidentsComponent {
  readonly residents = injectAsyncState(() => this.api.getResidents());

  constructor(private api: ApiService) {}
}
```

## With Custom Templates

```html
<ul
  *cngxAsync="residents;
    let data;
    skeleton: skelTpl;
    empty: emptyTpl;
    error: errTpl"
>
  @for (r of data; track r.id) {
    <li>{{ r.name }}</li>
  }
</ul>

<ng-template #skelTpl>
  @for (i of [1,2,3]; track i) {
    <li class="skeleton-line"></li>
  }
</ng-template>

<ng-template #emptyTpl>
  <li>No residents found.</li>
</ng-template>

<ng-template #errTpl let-err>
  <li>Error: {{ err }}</li>
</ng-template>
```

## CngxAsync Directive

Structural directive that renders different template slots based on `CngxAsyncState` status.

### Inputs

| Input | Type | Description |
|-|-|-|
| `cngxAsync` | `CngxAsyncState<T>` | **Required.** The async state to render. |
| `cngxAsyncSkeleton` | `TemplateRef<unknown> \| undefined` | Optional skeleton template shown during first load. |
| `cngxAsyncEmpty` | `TemplateRef<unknown> \| undefined` | Optional empty template shown when data is empty after success. |
| `cngxAsyncError` | `TemplateRef<{ $implicit: unknown }> \| undefined` | Optional error template shown on error during first load. Context: `{ $implicit: error }`. |

### Microsyntax

```
*cngxAsync="state; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl"
```

- `state` — required, the `CngxAsyncState<T>`
- `let data` — binds `$implicit` to template as `data` variable
- `skeleton: tpl` — (optional) template shown during first load
- `empty: tpl` — (optional) template shown when data empty after success
- `error: tpl` — (optional) template shown on error (first load only)

## Rendering Logic

The directive uses `resolveAsyncView()` state machine to select which view to render:

| Status | First Load | Empty | View Rendered |
|-|-|-|-|
| idle | true | * | nothing |
| loading | true | * | skeleton |
| refreshing | true | * | skeleton |
| pending | true | * | skeleton |
| error | true | * | error template |
| success | * | true | empty template |
| error | false | * | **content (data stays visible)** |
| (any other) | * | * | content |

**Key behaviors:**

1. **First load:** While `isFirstLoad()`, show skeleton or error template. Content not yet visible.
2. **Refresh:** Once `isFirstLoad()` = false, always show content (skeleton hidden), even if status is `refreshing`.
3. **Error with data:** If error occurs after successful load, the content template still renders (old data visible). Error communicated separately via error bar, toast, or alert.
4. **Empty:** After success, if data is null/undefined or empty array, show empty template (unless error also occurred).

## Context Type

### CngxAsyncContext<T>

```typescript
interface CngxAsyncContext<T> {
  $implicit: T;      // Default binding via 'let data'
  cngxAsync: T;      // Explicit named binding
}
```

**Usage:**

```html
<!-- Default binding -->
<ul *cngxAsync="state; let data">
  @for (item of data; track item.id) {
    <li>{{ item.name }}</li>
  }
</ul>

<!-- Explicit binding -->
<ul *cngxAsync="state as items">
  @for (item of items; track item.id) {
    <li>{{ item.name }}</li>
  }
</ul>
```

## Minimal Usage (Content Only)

No optional templates — skeleton and error hidden:

```html
<ul *cngxAsync="residents; let data">
  @for (r of data; track r.id) {
    <li>{{ r.name }}</li>
  }
</ul>

<!-- During first load: nothing (skips skeleton)
     During success: list renders
     On error: nothing (skips error template)
     If empty: nothing (skips empty template)
-->
```

## With Skeleton

```html
<div *cngxAsync="residents; let data; skeleton: skelTpl">
  @for (r of data; track r.id) {
    <div>{{ r.name }}</div>
  }
</div>

<ng-template #skelTpl>
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
</ng-template>

<!-- During first load: 3 skeleton cards
     During success: actual data
     On error: nothing (skips error)
-->
```

## With All Templates

```html
<div *cngxAsync="residents; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl">
  <header>Residents</header>
  <ul>
    @for (r of data; track r.id) {
      <li>{{ r.name }}</li>
    }
  </ul>
</div>

<ng-template #skelTpl>
  <div class="loading-spinner"></div>
</ng-template>

<ng-template #emptyTpl>
  <p>No residents found.</p>
</ng-template>

<ng-template #errTpl let-err>
  <cngx-alert severity="error">
    Failed to load: {{ (err as any).message }}
  </cngx-alert>
</ng-template>

<!-- Full UX lifecycle:
     1. First load: skeleton shown
     2. Success with data: list shown
     3. Success no data: empty template shown
     4. Error on first load: error template shown
     5. Error after data loaded: data stays, error template NOT shown
-->
```

## Accessibility

The directive itself does not manage ARIA attributes. The hosting component/element handles:

- `role="status"` or `role="alert"` on loading/error states
- `aria-live="polite"` for status announcements
- `aria-label` for context

Example:

```html
<div
  *cngxAsync="residents; let data; error: errTpl"
  role="region"
  [attr.aria-label]="residents.isLoading() ? 'Loading residents' : 'Residents list'"
  [attr.aria-busy]="residents.isBusy()"
>
  <!-- ... -->
</div>
```

## Composition

Use `CngxAsync` when you prefer microsyntax over named content slots. Both approaches render identically:

**Microsyntax (CngxAsync):**

```html
<ul *cngxAsync="state; let data; skeleton: skel; empty: empty; error: err">
  @for (item of data; track item.id) { <li>{{ item.name }}</li> }
</ul>
```

**Named slots (CngxAsyncContainer / custom):**

```html
<cngx-async-container [state]="state">
  <ng-template cngxAsyncContentTpl let-data>
    <ul>
      @for (item of data; track item.id) { <li>{{ item.name }}</li> }
    </ul>
  </ng-template>
  <ng-template cngxAsyncSkeletonTpl><!-- skeleton --></ng-template>
</cngx-async-container>
```

Choose based on preference. Microsyntax is more compact; named slots allow multiple content areas.

## Error Handling

Error template receives the error as context:

```html
<ng-template #errTpl let-err>
  <div>{{ (err as any).message }}</div>
</ng-template>
```

**Important:** Error template only shows on error during **first load**. If error occurs after data loads (refresh error), the error template is **not** shown — data stays visible. Error should be communicated via an alert or toast separately in that case.

```typescript
// Show error alert for refresh errors
effect(() => {
  if (!this.state.isFirstLoad() && this.state.error()) {
    this.alerter.show({
      severity: 'error',
      message: (this.state.error() as any).message,
    });
  }
});
```

## Type Inference

The directive includes `ngTemplateContextGuard` for template type inference:

```html
<!-- TypeScript knows 'data' is Item[] -->
<ul *cngxAsync="state; let data">
  @for (item of data; track item.id) {
    <!-- 'item' inferred as Item -->
    <li>{{ item.name }}</li>
  }
</ul>
```

## See Also

- [Async State System](../async-state/README.md) — `CngxAsyncState<T>`, factories, operators
- [CngxAsyncContainer](../../ui/feedback/README.md) — component alternative with named slots
- [resolveAsyncView](../async-state/README.md#view-resolution) — view state machine
- Compodoc: Full API reference at `/docs`
