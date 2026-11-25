# CngxAsync

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
import { Component, inject } from '@angular/core';
import { CngxAsync, injectAsyncState } from '@cngx/common/data';

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
  private readonly api = inject(ApiService);
  readonly residents = injectAsyncState(() => this.api.getResidents());
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
  <li>Error: {{ messageOf(err) }}</li>
</ng-template>
```

## CngxAsync Directive

Structural directive that renders different template slots based on `CngxAsyncState` status.

### Microsyntax

```
*cngxAsync="state; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl"
```

- `state` - required, the `CngxAsyncState<T>`
- `let data` - binds `$implicit` to template as `data` variable
- `skeleton: tpl` - (optional) template shown during first load
- `empty: tpl` - (optional) template shown when data empty after success
- `error: tpl` - (optional) template shown on error (first load only)

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

No optional templates - skeleton and error hidden:

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
    Failed to load: {{ messageOf(err) }}
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

The directive itself binds no ARIA attribute. It does two things a consumer relies on:

- **Focus across a view switch.** When a switch destroys the view that holds focus, focus moves to the first focusable element (outside any `inert` subtree) of the next rendered view, so a focused Retry button does not drop keyboard users onto `<body>`. One view without a focusable element (a skeleton) is bridged; after that the hand-off lapses. Focus outside the directive, or moved elsewhere by the user in the meantime, is never touched.
- **Content data can be `undefined`.** The content template is typed `T`, but it receives `data()` as is: a producer whose data goes `undefined` while it stays in the content view (e.g. `refreshing` after a cleared value) passes `undefined` through. Guard with `@if` / `?.` when the producer can do that.

The hosting component/element handles:

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
  <ng-template cngxAsyncContent let-data>
    <ul>
      @for (item of data; track item.id) { <li>{{ item.name }}</li> }
    </ul>
  </ng-template>
  <ng-template cngxAsyncSkeleton><!-- skeleton --></ng-template>
</cngx-async-container>
```

Choose based on preference. Microsyntax is more compact; named slots allow multiple content areas.

## Error Handling

Error template receives the error as context. The error is `unknown`, and an `HttpErrorResponse` is no `Error`, so interpolating it directly prints `[object Object]` into the region a screen reader announces. Read the message through a helper the component exposes (`protected readonly messageOf = messageOf;`); the templates on this page use it:

```html
<ng-template #errTpl let-err>
  <div>{{ messageOf(err) }}</div>
</ng-template>
```

Error template only shows on error during first load. If error occurs after data loads (refresh error), the error template is not shown - data stays visible. Error should be communicated via an alert or toast separately in that case.

```typescript
// Show error alert for refresh errors
effect(() => {
  const err = this.state.error();
  if (!this.state.isFirstLoad() && err) {
    untracked(() =>
      this.alerter.show({ severity: 'error', message: messageOf(err) }),
    );
  }
});

function messageOf(err: unknown): string {
  return typeof err === 'object' && err !== null && 'message' in err
    ? String(err.message)
    : String(err);
}
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

- [Async State System](../async-state/README.md) - `CngxAsyncState<T>`, factories, operators
- [CngxAsyncContainer](../../../ui/feedback/README.md) - component alternative with named slots
- [resolveAsyncView](../async-state/README.md#view-resolution) - view state machine
- [API on compodocx](https://cngxjs.github.io/cngx/main/common/data/async/) for type details.
