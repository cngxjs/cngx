import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncContainer: Loading config show delay min dwell',
  subtitle:
    'One <code>provideLoadingConfigAt(...)</code> retunes the loading timings for its subtree: <code>withShowDelay(400)</code> waits longer before a first-load skeleton or a refresh bar appears, <code>withMinDwell(1200)</code> keeps a shown indicator on screen longer, and <code>withSpinnerVsSkeletonCutoff(500)</code> moves the line between a spinner-worthy and a skeleton-worthy wait. Both containers load on the same click with the same duration; only the second one sits under the scoped config.',
  description:
    "The left container reads the library defaults (120ms show delay, 400ms min dwell, 800ms cutoff). A 250ms refresh flashes its bar for the 400ms dwell, while the scoped container never shows one because the refresh ends before its 400ms delay. A 600ms refresh shows both bars, but the scoped bar outlives the load by its 1200ms dwell. A 500ms first load shows the skeleton in both, and the content waits for the dwell: the left skeleton leaves at about +520ms, the scoped one at about +1600ms, long after the data arrived. An error during the hold would replace the skeleton at once. <code>CngxAsyncContainer</code> reads <code>showDelay</code> and <code>minDwell</code> as its input defaults; it does not read the cutoff. The cutoff is a threshold for the consumer: <code>createLatencyProbe</code> measures the last busy window and <code>resolveLoadingTreatment('auto', ...)</code> turns it into a spinner or a skeleton, read here once against the root config and once against the scoped one. The timeline readout records, per container, when the skeleton or bar appeared and when it left, relative to the click.",
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['async-state', 'behavior', 'composition'],
  apiComponents: ['CngxAsyncContainer'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CNGX_LOADING_CONFIG, createLatencyProbe, injectLoadingConfig, provideLoadingConfigAt, resolveLoadingTreatment, withMinDwell, withShowDelay, withSpinnerVsSkeletonCutoff } from '@cngx/core/utils';",
    "import { CngxAsyncContainer, CngxAsyncContentTpl, CngxAsyncSkeletonTpl } from '@cngx/ui/feedback';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'NgTemplateOutlet',
    'CngxAsyncContainer',
    'CngxAsyncSkeletonTpl',
    'CngxAsyncContentTpl',
  ],
  setup: `private readonly injector = inject(Injector);

  protected readonly loadingScope = Injector.create({
    parent: this.injector,
    providers: provideLoadingConfigAt(
      withShowDelay(400),
      withMinDwell(1200),
      withSpinnerVsSkeletonCutoff(500),
    ),
  });

  private readonly rootConfig = injectLoadingConfig();
  private readonly scopedConfig = this.loadingScope.get(CNGX_LOADING_CONFIG);

  protected readonly states = [createManualState<string[]>(), createManualState<string[]>()];
  private readonly probe = createLatencyProbe(() => this.states[0].isBusy());

  protected readonly treatments = computed(() => [
    resolveLoadingTreatment('auto', this.probe.lastDuration(), this.rootConfig.spinnerVsSkeletonCutoff),
    resolveLoadingTreatment('auto', this.probe.lastDuration(), this.scopedConfig.spinnerVsSkeletonCutoff),
  ]);

  constructor() {
    for (const state of this.states) {
      state.setSuccess(['Invoice 1042', 'Invoice 1043', 'Invoice 1044']);
    }
  }`,
  template: `  <ng-template #invoices let-side>
    <cngx-async-container [state]="states[side]" [ariaLabel]="side === 0 ? 'Invoices, library timings' : 'Invoices, scoped timings'">
      <ng-template cngxAsyncSkeleton>
        <div class="demo-skeleton-card demo-loading-config-skeleton">
          <div class="demo-skeleton-line demo-skeleton-line--md" style="width:40%"></div>
          <div class="demo-skeleton-line demo-skeleton-line--sm"></div>
        </div>
      </ng-template>
      <ng-template cngxAsyncContent let-rows>
        <ul class="demo-loading-config-list">
          @for (row of rows; track row) {
            <li>{{ row }}</li>
          }
        </ul>
      </ng-template>
    </cngx-async-container>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane demo-loading-config-pane">
      <h3 class="demo-config-compare-heading">Library defaults</h3>
      <ng-container *ngTemplateOutlet="invoices; context: { $implicit: 0 }" />
    </div>
    <div class="demo-config-compare-pane demo-loading-config-pane">
      <h3 class="demo-config-compare-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="invoices; context: { $implicit: 1 }; injector: loadingScope" />
    </div>
  </div>`,
  setupChrome: `private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private timer?: ReturnType<typeof setTimeout>;
  private startedAt = 0;
  private readonly visibleNow = [false, false];
  private readonly shownAt: (number | undefined)[] = [undefined, undefined];
  private readonly shownKind: (string | null)[] = [null, null];
  protected readonly loadMs = signal('-');
  protected readonly timeline = signal<readonly string[]>(['-', '-']);
  protected readonly cutoffs = computed(() => [
    this.rootConfig.spinnerVsSkeletonCutoff,
    this.scopedConfig.spinnerVsSkeletonCutoff,
  ]);

  protected refresh(durationMs: number): void {
    this.begin(durationMs, 'refresh');
    for (const state of this.states) {
      state.set('refreshing');
    }
    this.finishAfter(durationMs);
  }

  protected firstLoad(durationMs: number): void {
    this.begin(durationMs, 'first load');
    for (const state of this.states) {
      state.reset();
      state.set('loading');
    }
    this.finishAfter(durationMs);
  }

  private begin(durationMs: number, kind: string): void {
    clearTimeout(this.timer);
    this.startedAt = performance.now();
    this.loadMs.set(kind + ', ' + durationMs + 'ms');
    this.shownAt[0] = undefined;
    this.shownAt[1] = undefined;
    this.timeline.set(['never shown', 'never shown']);
  }

  private finishAfter(durationMs: number): void {
    this.timer = setTimeout(() => {
      for (const state of this.states) {
        state.setSuccess(['Invoice 1042', 'Invoice 1043', 'Invoice 1044']);
      }
    }, durationMs);
  }

  private sample(): void {
    const panes = this.hostEl.nativeElement.querySelectorAll('.demo-loading-config-pane');
    panes.forEach((pane, i) => {
      const indicator = this.indicatorIn(pane);
      const visible = indicator !== null;
      if (visible === this.visibleNow[i]) {
        return;
      }
      this.visibleNow[i] = visible;
      const at = Math.round(performance.now() - this.startedAt);
      if (visible) {
        this.shownAt[i] = at;
        this.shownKind[i] = indicator;
        this.setLine(i, indicator + ' shown at +' + at + 'ms');
        return;
      }
      const from = this.shownAt[i];
      if (from !== undefined) {
        this.setLine(i, this.shownKind[i] + ' shown at +' + from + 'ms, gone at +' + at + 'ms (' + (at - from) + 'ms on screen)');
      }
    });
  }

  private indicatorIn(pane: Element): string | null {
    if (pane.querySelector('.demo-loading-config-skeleton')) {
      return 'skeleton';
    }
    if (pane.querySelector('.cngx-async-container__refresh')) {
      return 'bar';
    }
    return null;
  }

  private setLine(i: number, text: string): void {
    this.timeline.update((lines) => lines.map((line, j) => (j === i ? text : line)));
  }

  private readonly watch = afterNextRender(() => {
    const observer = new MutationObserver(() => this.sample());
    observer.observe(this.hostEl.nativeElement, { childList: true, subtree: true });
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      clearTimeout(this.timer);
    });
  });`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="refresh(250)">Fast refresh (250ms)</button>
    <button type="button" class="chip" (click)="refresh(600)">Medium refresh (600ms)</button>
    <button type="button" class="chip" (click)="refresh(1500)">Slow refresh (1.5s)</button>
    <button type="button" class="chip" (click)="firstLoad(500)">First load (500ms)</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Last load</span><span class="event-value">{{ loadMs() }}</span></div>
    <div class="event-row"><span class="event-label">Defaults: indicator</span><span class="event-value">{{ timeline()[0] }}</span></div>
    <div class="event-row"><span class="event-label">Scoped: indicator</span><span class="event-value">{{ timeline()[1] }}</span></div>
    <div class="event-row"><span class="event-label">Defaults: treatment</span><span class="event-value">{{ treatments()[0] }} ({{ cutoffs()[0] }}ms cutoff)</span></div>
    <div class="event-row"><span class="event-label">Scoped: treatment</span><span class="event-value">{{ treatments()[1] }} ({{ cutoffs()[1] }}ms cutoff)</span></div>
  </div>`,
};
