import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSegmentedProgress: value / total',
  subtitle:
    'A discrete progress bar split into N segments. Drive it positionally with <code>[value]</code> / <code>[total]</code> - the per-segment <code>done</code> / <code>active</code> / <code>todo</code> states derive automatically. No stepper, no async semantics: a generic indicator for uploads, wizards, or onboarding.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxSegmentedProgress'],
  moduleImports: ["import { CngxSegmentedProgress } from '@cngx/common/display';"],
  imports: ['CngxSegmentedProgress'],
  setup: `protected readonly position = signal(3);`,
  setupChrome: `protected prev(): void {
    this.position.update((p) => Math.max(0, p - 1));
  }
  protected next(): void {
    this.position.update((p) => Math.min(8, p + 1));
  }`,
  template: `  <cngx-segmented-progress
    [value]="position()"
    [total]="8"
    aria-label="Upload progress"
    style="max-inline-size:24rem"
  />`,
  templateChrome: `  <div class="event-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="prev()">Prev</button>
    <button type="button" class="chip" (click)="next()">Next</button>
    <span class="event-label">Value</span><span class="event-value">{{ position() }} / 8</span>
  </div>`,
};
