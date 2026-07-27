import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStatCard: Error and refresh',
  subtitle:
    'The tile switches its body from the single <code>[state]</code> source. A failed first load replaces the stat; a failed refresh keeps the last known figure on screen and adds a stale note.',
  description:
    'Both branches come from resolveAsyncView, the same lookup table every other async surface in cngx uses, so the tile cannot drift from them. The accessible name drops while the stat is not rendered - the slot ids live inside the content branch, and pointing at ids that are out of the DOM reads as unnamed anyway. Set live="polite" for a tile that refreshes on a timer so the new figure is announced instead of changing silently.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling'],
  apiComponents: ['CngxStatCard'],
  moduleImports: [
    "import { CngxStatCard, CngxStatLabel, CngxStatValue, CngxStatCaption } from '@cngx/ui/stat-card';",
    "import { CngxMetric, createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxStatCard', 'CngxStatLabel', 'CngxStatValue', 'CngxStatCaption', 'CngxMetric'],
  setup: `protected readonly revenue = createManualState<number>();`,
  setupChrome: `protected showLoading(): void {
    this.revenue.reset();
    this.revenue.set('loading');
  }
  protected showSuccess(): void {
    this.revenue.setSuccess(1.2);
  }
  protected showFirstError(): void {
    this.revenue.reset();
    this.revenue.set('loading');
    this.revenue.setError(new Error('Warehouse unreachable'));
  }
  protected showStale(): void {
    // Error after a prior success: the figure stays, a stale note appears.
    this.revenue.setSuccess(1.2);
    this.revenue.setError(new Error('Refresh failed'));
  }
  protected showRefreshing(): void {
    this.revenue.setSuccess(1.2);
    this.revenue.set('refreshing');
  }`,
  template: `<cngx-stat-card [state]="revenue" live="polite" style="max-width:260px">
    <span cngxStatLabel>Revenue</span>
    <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
    <span cngxStatCaption>vs. last quarter</span>
  </cngx-stat-card>`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showLoading()">loading</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showRefreshing()">refreshing</button>
    <button type="button" class="chip" (click)="showFirstError()">error (first load)</button>
    <button type="button" class="chip" (click)="showStale()">error (keeps figure)</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ revenue.status() }}</span>
    <span class="cngx-ex-status-readout">first load: {{ revenue.isFirstLoad() }}</span>
  </div>`,
};
