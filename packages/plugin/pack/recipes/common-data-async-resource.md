---
title: "fromResource: from resource and http resource"
whenToUse: "Status mapping: idle stays idle, loading stays loading, reloading becomes refreshing, resolved and local both become success, error stays error. Angular has no first-load concept, so the bridge latches the first resolved or local value for isFirstLoad and stamps lastUpdated on every resolved or local value; it must be called in an injection context for that reason. A resource drops its value on error, so after an error that follows a success the container keeps its content slot with data undefined, which is why the content template guards on data. Pick a region to load, reload to see refreshing, turn on failures to see error, and set a value locally to see local map to success. fromHttpResource(ref) is the same bridge for an httpResource() ref and additionally maps its download progress to a 0-100 progress; it needs an HttpClient backend, which this examples app does not have, so only fromResource runs here."
symbols: [CngxAsyncContainer]
---

# fromResource: from resource and http resource

Status mapping: idle stays idle, loading stays loading, reloading becomes refreshing, resolved and local both become success, error stays error. Angular has no first-load concept, so the bridge latches the first resolved or local value for isFirstLoad and stamps lastUpdated on every resolved or local value; it must be called in an injection context for that reason. A resource drops its value on error, so after an error that follows a success the container keeps its content slot with data undefined, which is why the content template guards on data. Pick a region to load, reload to see refreshing, turn on failures to see error, and set a value locally to see local map to success. fromHttpResource(ref) is the same bridge for an httpResource() ref and additionally maps its download progress to a 0-100 progress; it needs an HttpClient backend, which this examples app does not have, so only fromResource runs here.

## Symbols

- `CngxAsyncContainer`

## Setup

```ts
protected readonly region = signal<string | undefined>(undefined);

// undefined params keep the resource idle until a region is picked;
// fetchOrders() stands in for an HttpClient call returning an Observable.
protected readonly ordersResource = rxResource({
  params: () => this.region(),
  stream: ({ params }) => this.fetchOrders(params),
});

protected readonly orders = fromResource(this.ordersResource);
```

## Wiring

```html
<cngx-async-container [state]="orders" ariaLabel="Open orders">
  <ng-template cngxAsyncSkeleton>
    <div class="demo-skeleton-line"></div>
  </ng-template>
  <ng-template cngxAsyncContent let-data>
    @if (data) {
      <p>{{ data.region }}: {{ data.open }} open, {{ data.shipped }} shipped</p>
    }
  </ng-template>
  <ng-template cngxAsyncEmpty>
    <p class="demo-empty-state-block">No orders.</p>
  </ng-template>
  <ng-template cngxAsyncError let-err>
    <p class="demo-error-block">{{ err }}</p>
  </ng-template>
</cngx-async-container>
```
