import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStatCard: Latency-aware loading',
  subtitle:
    'With <code>loadingTreatment="auto"</code> the tile picks its own placeholder from the latency it observed: a spinner after a fast last load, a skeleton after a slow one.',
  description:
    'The selection is a pure computed over createLatencyProbe and the cascaded spinnerVsSkeletonCutoff - no hardcoded millisecond threshold lives in the component. Run a fast load, then reload: the treatment flips to a spinner. Run a slow load and reload: it flips back to a skeleton. The cutoff comes from CNGX_LOADING_CONFIG, so one provideLoadingConfig retunes every tile in the app.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior'],
  apiComponents: ['CngxStatCard'],
  moduleImports: [
    "import { CngxStatCard, CngxStatLabel, CngxStatValue, CngxStatCaption } from '@cngx/ui/stat-card';",
    "import { CngxMetric } from '@cngx/common/data';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxStatCard', 'CngxStatLabel', 'CngxStatValue', 'CngxStatCaption', 'CngxMetric'],
  setup: `protected readonly revenue = createManualState<number>();`,
  setupChrome: `protected readonly lastRunMs = signal<number | undefined>(undefined);

  private run(ms: number): void {
    this.revenue.reset();
    this.revenue.set('loading');
    this.lastRunMs.set(ms);
    setTimeout(() => this.revenue.setSuccess(1.2), ms);
  }

  protected runFast(): void {
    this.run(150);
  }

  protected runSlow(): void {
    // Past the 800ms default cutoff, so the next load resolves to a skeleton.
    this.run(1600);
  }`,
  template: `<cngx-stat-card [state]="revenue" loadingTreatment="auto" style="max-width:260px">
    <span cngxStatLabel>Revenue</span>
    <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
    <span cngxStatCaption>vs. last quarter</span>
  </cngx-stat-card>`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="runFast()">fast load (150ms)</button>
    <button type="button" class="chip" (click)="runSlow()">slow load (1600ms)</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ revenue.status() }}</span>
    <span class="cngx-ex-status-readout">last run: {{ lastRunMs() === undefined ? 'none yet' : lastRunMs() + 'ms' }}</span>
  </div>`,
};
