import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSegmentedProgress: error segment',
  subtitle:
    'The explicit <code>[segments]</code> array reaches every <code>SegmentState</code>, including <code>error</code>. Here a four-step upload marks step 2 as failed; "Retry" flips it back to <code>active</code>. The error segment paints from its own <code>[data-state="error"]</code> CSS.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'error-handling'],
  apiComponents: ['CngxSegmentedProgress'],
  moduleImports: [
    "import { CngxSegmentedProgress, type SegmentState } from '@cngx/common/display';",
  ],
  imports: ['CngxSegmentedProgress'],
  setup: `protected readonly failed = signal(true);
  protected readonly segments = computed<readonly SegmentState[]>(() => [
    'done',
    this.failed() ? 'error' : 'done',
    this.failed() ? 'todo' : 'active',
    'todo',
  ]);`,
  setupChrome: `protected retry(): void {
    this.failed.set(false);
  }
  protected reset(): void {
    this.failed.set(true);
  }`,
  template: `  <cngx-segmented-progress
    [segments]="segments()"
    aria-label="Upload status"
    style="max-inline-size:24rem"
  />`,
  templateChrome: `  <div class="event-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="retry()">Retry</button>
    <button type="button" class="chip" (click)="reset()">Reset</button>
    <span class="event-label">Step 2</span>
    <span class="event-value">{{ failed() ? 'error' : 'recovered' }}</span>
  </div>`,
};
