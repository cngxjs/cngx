import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Latency-selected indicator: spinner vs skeleton from observed duration',
  subtitle:
    'An app-shell indicator reads <code>injectLatencyProbe()</code> over <code>CngxAsyncRegistry</code> and picks a spinner (last aggregate load was fast) or a skeleton (last aggregate load was slow) by comparing <code>lastDuration()</code> against <code>CNGX_LOADING_CONFIG.spinnerVsSkeletonCutoff</code>. <code>createVisibilityGate</code> suppresses the flash on sub-threshold waits.',
  description:
    'The probe measures the registry busy-envelope (first start to last end). The next load\'s treatment is chosen from the previously observed duration: waits above the cutoff render a skeleton, shorter ones a spinner. Busy state and the chosen kind are announced to assistive technology via aria-busy and a polite live region.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  moduleImports: [
    "import { computed, inject, signal } from '@angular/core';",
    "import { createVisibilityGate, injectLoadingConfig } from '@cngx/core/utils';",
    "import { injectLatencyProbe, createManualState, CngxAsyncRegistry } from '@cngx/common/data';",
  ],
  viewProviders: ['CngxAsyncRegistry'],
  setup: `private readonly config = injectLoadingConfig();
  protected readonly cutoff = this.config.spinnerVsSkeletonCutoff;

  protected readonly probe = injectLatencyProbe();

  // Selection reflects the PREVIOUS busy-envelope duration: a slow last load
  // predicts a skeleton for this one, a fast last load predicts a spinner.
  protected readonly showSkeleton = computed(() => {
    const last = this.probe.lastDuration();
    return last !== undefined && last > this.cutoff;
  });

  // Flash gate: only surface the indicator once busy persists past showDelay.
  protected readonly gatedBusy = createVisibilityGate(
    computed(() => this.probe.isBusy()),
    signal(this.config.showDelay),
    signal(this.config.minDwell),
  );

  protected readonly announcement = computed(() => {
    if (!this.gatedBusy()) {
      return '';
    }
    return this.showSkeleton() ? 'Preparing content' : 'Loading';
  });`,
  setupChrome: `private readonly registry = inject(CngxAsyncRegistry);
  private readonly fastOp = createManualState<number>();
  private readonly slowOp = createManualState<number>();

  constructor() {
    this.registry.register(this.fastOp, 'fast');
    this.registry.register(this.slowOp, 'slow');
  }

  protected handleFast(): void {
    this.fastOp.set('loading');
    setTimeout(() => this.fastOp.setSuccess(1), 300);
  }

  protected handleSlow(): void {
    this.slowOp.set('loading');
    setTimeout(() => this.slowOp.setSuccess(1), 1500);
  }`,
  template: `  <div class="latency-indicator" [attr.aria-busy]="probe.isBusy()">
    @if (gatedBusy()) {
      @if (showSkeleton()) {
        <div class="demo-skeleton-row" style="height:48px" aria-hidden="true"></div>
        <div class="demo-skeleton-row" style="height:48px;width:70%" aria-hidden="true"></div>
      } @else {
        <div class="cngx-ex-demo-spinner" aria-hidden="true"></div>
      }
    }
    <span class="demo-sr-only" role="status" aria-live="polite">{{ announcement() }}</span>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button type="button" class="demo-icon-button" (click)="handleFast()">
      Run fast operation
    </button>
    <button type="button" class="demo-icon-button" (click)="handleSlow()">
      Run slow operation
    </button>
  </div>
  <div class="status-row" style="margin-bottom:12px">
    <span class="status-badge">Cutoff: {{ cutoff }}ms</span>
    <span class="status-badge">
      Last envelope: {{ probe.lastDuration() === undefined ? 'none yet' : probe.lastDuration() + 'ms' }}
    </span>
    <span class="status-badge">Next treatment: {{ showSkeleton() ? 'skeleton' : 'spinner' }}</span>
  </div>`,
};
