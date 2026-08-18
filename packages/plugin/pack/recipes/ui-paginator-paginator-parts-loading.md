---
title: "CngxPaginatorLoading: Busy-indicator slot"
whenToUse: "The *cngxPaginatorLoading structural slot in isolation - project a template inside cngx-paginator and the shell renders it (instead of the default cngx-progress bar) while the bound async [state] is busy."
symbols: [CngxPaginatorLoading, CngxPaginator, CngxPaginatorPages]
---

# CngxPaginatorLoading: Busy-indicator slot

The *cngxPaginatorLoading structural slot in isolation - project a template inside cngx-paginator and the shell renders it (instead of the default cngx-progress bar) while the bound async [state] is busy.

## Symbols

- `CngxPaginatorLoading`
- `CngxPaginator`
- `CngxPaginatorPages`

## Setup

```ts
protected readonly pageIndex = signal(2);
  protected readonly loading = createManualState<unknown>();

  constructor() {
    this.loading.set('loading');
  }
```

## Wiring

```html
<cngx-paginator
    [total]="120"
    [state]="loading"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
  >
    <ng-template cngxPaginatorLoading>
      <span class="event-value">Loading rows…</span>
    </ng-template>
    <cngx-pgn-pages />
  </cngx-paginator>
```
