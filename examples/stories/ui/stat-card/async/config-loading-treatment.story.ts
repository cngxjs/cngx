import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStatCard: Config loading treatment',
  subtitle:
    "One <code>provideStatCardConfigAt(...)</code> in <code>viewProviders</code> moves the defaults for every tile below it: <code>withStatCardLoadingTreatment('spinner')</code> pins the placeholder, <code>withStatCardAriaLabels(...)</code> replaces the busy name, the error headline and adds an error description. A per-instance input still wins over the scoped value.",
  description:
    'Both tiles sit under the same scoped config. The left tile binds nothing, so it shows a spinner named by the configured <code>busy</code> label on every load, and the configured error copy when a load fails. The right tile binds <code>loadingTreatment="auto"</code> and its own <code>errorText</code>, so it keeps the latency-based choice (a skeleton here, since every load takes longer than the 800ms cutoff) and its own headline, while the key it leaves unbound, the error description, still comes from the config. The busy name is not visible, so the readout mirrors the spinner&apos;s <code>aria-label</code> from the DOM.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxStatCard'],
  moduleImports: [
    "import { DestroyRef, ElementRef } from '@angular/core';",
    "import { CngxStatCard, CngxStatLabel, CngxStatValue, CngxStatCaption, provideStatCardConfigAt, withStatCardAriaLabels, withStatCardLoadingTreatment } from '@cngx/ui/stat-card';",
    "import { CngxMetric, createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxStatCard', 'CngxStatLabel', 'CngxStatValue', 'CngxStatCaption', 'CngxMetric'],
  viewProviders: [
    `provideStatCardConfigAt(
      withStatCardLoadingTreatment('spinner'),
      withStatCardAriaLabels({
        busy: 'Fetching revenue',
        errorFallback: 'Revenue is unavailable',
        errorDescription: 'The figure refreshes on its own in a minute.',
      }),
    )`,
  ],
  setup: `protected readonly revenue = createManualState<number>();`,
  template: `  <div class="demo-stat-config-grid">
    <cngx-stat-card [state]="revenue">
      <span cngxStatLabel>Revenue (config defaults)</span>
      <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
      <span cngxStatCaption>vs. last quarter</span>
    </cngx-stat-card>
    <cngx-stat-card [state]="revenue" loadingTreatment="auto" errorText="Could not reach the ledger">
      <span cngxStatLabel>Revenue (instance inputs)</span>
      <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
      <span cngxStatCaption>vs. last quarter</span>
    </cngx-stat-card>
  </div>`,
  setupChrome: `private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly placeholders = signal<readonly string[]>(['-', '-']);
  protected readonly busyNames = signal<readonly string[]>(['-', '-']);

  constructor() {
    this.revenue.setSuccess(1.2);
  }

  private readonly mirror = afterNextRender(() => {
    const read = () => {
      const tiles = Array.from(this.hostEl.nativeElement.querySelectorAll('cngx-stat-card'));
      this.placeholders.set(tiles.map((tile) => this.placeholderOf(tile)));
      this.busyNames.set(
        tiles.map((tile) => tile.querySelector('cngx-loading-indicator[aria-label]')?.getAttribute('aria-label') ?? '-'),
      );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(this.hostEl.nativeElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label'] });
    this.destroyRef.onDestroy(() => observer.disconnect());
  });

  private placeholderOf(tile: Element): string {
    if (tile.querySelector('.cngx-stat-card__stat--skeleton')) {
      return 'skeleton';
    }
    if (tile.querySelector('.cngx-stat-card__spinner')) {
      return 'spinner';
    }
    return 'none';
  }

  private run(fail: boolean): void {
    this.revenue.reset();
    this.revenue.set('loading');
    setTimeout(() => (fail ? this.revenue.setError(new Error('ledger offline')) : this.revenue.setSuccess(1.2)), 1600);
  }

  protected load(): void {
    this.run(false);
  }

  protected loadAndFail(): void {
    this.run(true);
  }`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" (click)="load()">Load (1600ms)</button>
    <button type="button" (click)="loadAndFail()">Load and fail</button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Status</span><span class="event-value">{{ revenue.status() }}</span></div>
    <div class="event-row"><span class="event-label">Left placeholder</span><span class="event-value">{{ placeholders()[0] }}</span></div>
    <div class="event-row"><span class="event-label">Left busy name</span><span class="event-value">{{ busyNames()[0] }}</span></div>
    <div class="event-row"><span class="event-label">Right placeholder</span><span class="event-value">{{ placeholders()[1] }}</span></div>
    <div class="event-row"><span class="event-label">Right busy name</span><span class="event-value">{{ busyNames()[1] }}</span></div>
  </div>`,
};
