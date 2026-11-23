import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'fromResource: from resource and http resource',
  subtitle:
    '<code>fromResource(ref)</code> projects any Angular <code>Resource&lt;T&gt;</code> onto <code>CngxAsyncState&lt;T&gt;</code>, so a <code>resource()</code> or <code>rxResource()</code> binds straight into <code>*cngxAsync</code>. The resource stays the single source of truth; every flag is derived from it.',
  description:
    'Status mapping: <code>idle</code> stays <code>idle</code>, <code>loading</code> stays <code>loading</code>, <code>reloading</code> becomes <code>refreshing</code>, <code>resolved</code> and <code>local</code> both become <code>success</code>, <code>error</code> stays <code>error</code>. Angular has no first-load concept, so the bridge latches the first resolved or local value for <code>isFirstLoad</code> and stamps <code>lastUpdated</code> on every resolved or local value; it must be called in an injection context for that reason. A resource drops its value on error, so after an error that follows a success the view is <code>content+error</code>: <code>*cngxAsync</code> renders one template and keeps the last content, so the story surfaces that error in its own alert line; the content template still guards on <code>data</code> for the views that reach it without a value. Pick a region to load, reload to see <code>refreshing</code>, turn on failures to see <code>error</code>, and set a value locally to see <code>local</code> map to <code>success</code>. <code>fromHttpResource(ref)</code> is the same bridge for an <code>httpResource()</code> ref and additionally maps its download progress to a 0-100 <code>progress</code>; it needs an <code>HttpClient</code> backend, which this examples app does not have, so only <code>fromResource</code> runs here.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'integration'],
  apiComponents: ['CngxAsync'],
  moduleImports: [
    "import { rxResource } from '@angular/core/rxjs-interop';",
    "import { map, timer } from 'rxjs';",
    "import { CngxAsync, fromResource } from '@cngx/common/data';",
  ],
  imports: ['CngxAsync'],
  setup: `protected readonly region = signal<string | undefined>(undefined);

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
  }`,
  template: `  <section aria-label="Open orders" [attr.aria-busy]="orders.isBusy()">
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
  </ng-template>`,
  setupChrome: `protected readonly regions = ['North', 'South'] as const;

  protected setLocally(): void {
    this.ordersResource.set({ region: 'Local draft', open: 0, shipped: 0 });
  }

  protected formatTime(date: Date | undefined): string {
    return date ? date.toLocaleTimeString() : 'undefined';
  }`,
  templateChromeBefore: `<div class="button-row" role="radiogroup" aria-label="Region (resource params)" style="margin-bottom:8px">
    <label>
      <input type="radio" name="from-resource-region" [checked]="region() === undefined" (change)="region.set(undefined)" />
      None (idle)
    </label>
    @for (r of regions; track r) {
      <label>
        <input type="radio" name="from-resource-region" [checked]="region() === r" (change)="region.set(r)" />
        {{ r }}
      </label>
    }
  </div>
  <div class="button-row" style="margin-bottom:16px">
    <label>
      <input type="checkbox" [checked]="failRequests()" (change)="failRequests.set($any($event.target).checked)" />
      Fail requests
    </label>
    <button type="button" class="chip" (click)="ordersResource.reload()">Reload</button>
    <button type="button" class="chip" (click)="setLocally()">Set value locally</button>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">ordersResource.status()</span>
      <span class="event-value">{{ ordersResource.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">orders.status()</span>
      <span class="event-value">{{ orders.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad()</span>
      <span class="event-value">{{ orders.isFirstLoad() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isLoading() / isRefreshing()</span>
      <span class="event-value">{{ orders.isLoading() }} / {{ orders.isRefreshing() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isBusy() / isSettled()</span>
      <span class="event-value">{{ orders.isBusy() }} / {{ orders.isSettled() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">hasData()</span>
      <span class="event-value">{{ orders.hasData() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">data()</span>
      <span class="event-value">{{ orders.data() ? orders.data().region + ', ' + orders.data().open + ' open' : 'undefined' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">error()</span>
      <span class="event-value">{{ orders.error() ?? 'undefined' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">lastUpdated()</span>
      <span class="event-value">{{ formatTime(orders.lastUpdated()) }}</span>
    </div>
  </div>`,
};
