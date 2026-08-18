---
title: "CngxPaginator: Async loading"
whenToUse: "The paginator is an async-state consumer. While busy, setPage is a no-op, so a page click cannot race an in-flight load."
symbols: [CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext]
---

# CngxPaginator: Async loading

The paginator is an async-state consumer. While busy, setPage is a no-op, so a page click cannot race an in-flight load.

## Symbols

- `CngxPaginator`
- `CngxPaginatorPrev`
- `CngxPaginatorPages`
- `CngxPaginatorNext`

## Setup

```ts
protected readonly pageIndex = signal(2);
  protected readonly loading = createManualState<unknown>();
```

## Wiring

```html
<cngx-paginator skin="numbered" [total]="120" [state]="loading" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)">
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
  </cngx-paginator>
```
