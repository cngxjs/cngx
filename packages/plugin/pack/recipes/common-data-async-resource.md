---
title: "fromResource: from resource and http resource"
whenToUse: "Status mapping: idle stays idle, loading stays loading, reloading becomes refreshing, resolved and local both become success, error stays error. Angular has no first-load concept, so the bridge latches the first resolved or local value for isFirstLoad and stamps lastUpdated on every resolved or local value; it must be called in an injection context for that reason. A resource drops its value on error, so after an error that follows a success the view is content+error: *cngxAsync renders one template and keeps the last content, so the story surfaces that error in its own alert line; the content template still guards on data for the views that reach it without a value. Pick a region to load, reload to see refreshing, turn on failures to see error, and set a value locally to see local map to success. fromHttpResource(ref) is the same bridge for an httpResource() ref and additionally maps its download progress to a 0-100 progress; it needs an HttpClient backend, which this examples app does not have, so only fromResource runs here."
symbols: [CngxAsync]
---

# fromResource: from resource and http resource

Status mapping: idle stays idle, loading stays loading, reloading becomes refreshing, resolved and local both become success, error stays error. Angular has no first-load concept, so the bridge latches the first resolved or local value for isFirstLoad and stamps lastUpdated on every resolved or local value; it must be called in an injection context for that reason. A resource drops its value on error, so after an error that follows a success the view is content+error: *cngxAsync renders one template and keeps the last content, so the story surfaces that error in its own alert line; the content template still guards on data for the views that reach it without a value. Pick a region to load, reload to see refreshing, turn on failures to see error, and set a value locally to see local map to success. fromHttpResource(ref) is the same bridge for an httpResource() ref and additionally maps its download progress to a 0-100 progress; it needs an HttpClient backend, which this examples app does not have, so only fromResource runs here.

## Symbols

- `CngxAsync`

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

protected readonly failRequests = signal(false);
private requestCount = 0;

// Stand-in for an HttpClient call: answers after 900 ms or fails when the
// failure toggle is on.
private fetchOrders(region: string) {
  const request = ++this.requestCount;
  return timer(900).pipe(
    map(() => {
      if (this.failRequests()) {
        throw new Error('503 Service Unavailable (' + region + ')');
      }
      return { region, open: 10 + request, shipped: 40 + request * 2 };
    }),
  );
}
```

## Wiring

```html
<section aria-label="Open orders" [attr.aria-busy]="orders.isBusy()">
  <div *cngxAsync="orders; let data; skeleton: skeletonTpl; empty: emptyTpl; error: errorTpl">
    @if (data) {
      <p>{{ data.region }}: {{ data.open }} open, {{ data.shipped }} shipped</p>
    }
  </div>
  @if (orders.status() === 'error' && !orders.isFirstLoad()) {
    <p class="demo-error-block" role="alert">Reload failed: {{ orders.error() }}</p>
  }
</section>

<ng-template #skeletonTpl>
  <div class="demo-skeleton-line"></div>
</ng-template>
<ng-template #emptyTpl>
  <p class="demo-empty-state-block">No orders.</p>
</ng-template>
<ng-template #errorTpl let-err>
  <p class="demo-error-block" role="alert">{{ err }}</p>
</ng-template>
```
