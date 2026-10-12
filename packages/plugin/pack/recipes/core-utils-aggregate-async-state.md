---
title: "createAggregateAsyncState: create aggregate async state"
whenToUse: "Combined status, first match wins: any error gives error; else any loading or pending gives loading; else any refreshing gives refreshing; else all success gives success; otherwise idle. data is the per-source data in input order, error is the first error in input order, isEmpty holds only when every source is empty, isFirstLoad when any source has not loaded yet, and lastUpdated is the newest source timestamp. Pending collapses into loading, so isPending is always false, and progress is always undefined. Drive each source independently and watch the aggregate readout."
symbols: [CngxAsyncContainer]
---

# createAggregateAsyncState: create aggregate async state

Combined status, first match wins: any error gives error; else any loading or pending gives loading; else any refreshing gives refreshing; else all success gives success; otherwise idle. data is the per-source data in input order, error is the first error in input order, isEmpty holds only when every source is empty, isFirstLoad when any source has not loaded yet, and lastUpdated is the newest source timestamp. Pending collapses into loading, so isPending is always false, and progress is always undefined. Drive each source independently and watch the aggregate readout.

## Symbols

- `CngxAsyncContainer`

## Setup

```ts
protected readonly orders = createManualState<string[]>();
protected readonly invoices = createManualState<string[]>();
protected readonly messages = createManualState<string[]>();

protected readonly inbox = createAggregateAsyncState<string[]>(
  computed(() => [this.orders, this.invoices, this.messages]),
);
```

## Wiring

```html
<cngx-async-container [state]="inbox" ariaLabel="Inbox overview">
  <ng-template cngxAsyncSkeleton>
    <div class="demo-skeleton-line"></div>
  </ng-template>
  <ng-template cngxAsyncContent let-data>
    <ul class="demo-stack demo-stack--tight demo-loading-config-list">
      <li>Orders: {{ data[0]?.length ?? 0 }}</li>
      <li>Invoices: {{ data[1]?.length ?? 0 }}</li>
      <li>Messages: {{ data[2]?.length ?? 0 }}</li>
    </ul>
  </ng-template>
  <ng-template cngxAsyncEmpty>
    <p class="demo-empty-state-block">Nothing in the inbox.</p>
  </ng-template>
  <ng-template cngxAsyncError let-err>
    <p class="demo-error-block">{{ err }}</p>
  </ng-template>
</cngx-async-container>
```
