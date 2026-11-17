---
title: "CngxAsyncBoundary: content renders when every source settles"
whenToUse: "The boundary derives one aggregate state from N sources via computed(). The content template renders only on the aggregate content view, where every source has reached success, and receives the per-source data in input order."
symbols: [CngxAsyncBoundary, CngxAsync]
---

# CngxAsyncBoundary: content renders when every source settles

The boundary derives one aggregate state from N sources via computed(). The content template renders only on the aggregate content view, where every source has reached success, and receives the per-source data in input order.

## Symbols

- `CngxAsyncBoundary`
- `CngxAsync`

## Setup

```ts
protected readonly user = createManualState<string>();
protected readonly permissions = createManualState<string[]>();
protected readonly flags = createManualState<string>();

protected readonly sources = signal<readonly AggregateSource[]>([
  { key: 'user', label: 'User', state: this.user },
  { key: 'permissions', label: 'Permissions', state: this.permissions },
  { key: 'flags', label: 'Feature flags', state: this.flags },
]);
```

## Wiring

```html
<div [cngxAsyncBoundary]="sources()" #b="cngxAsyncBoundary" [attr.aria-busy]="b.state.isBusy()">
  <ul
    *cngxAsync="b.state; let data; skeleton: skeletonTpl"
    class="demo-stack"
    aria-label="Account bootstrap"
    style="list-style:none;padding:0;margin:0;gap:6px">
    <li class="demo-card-tile">User: {{ data[0] }}</li>
    <li class="demo-card-tile">Permissions: {{ data[1] }}</li>
    <li class="demo-card-tile">Feature flags: {{ data[2] }}</li>
  </ul>

  <ng-template #skeletonTpl>
    <div class="demo-stack" style="display:flex;flex-direction:column;gap:8px">
      @for (i of [1,2,3]; track i) {
        <div class="demo-skeleton-bar" style="height:20px"></div>
      }
    </div>
  </ng-template>
</div>
```
