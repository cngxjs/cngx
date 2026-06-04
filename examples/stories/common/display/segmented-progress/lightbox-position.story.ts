import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSegmentedProgress: lightbox position dots',
  subtitle:
    'The same atom outside any stepper - a carousel position indicator. An explicit <code>[segments]</code> array marks the current slide <code>active</code> and the rest <code>done</code> / <code>todo</code>, proving the indicator is reusable for lightboxes and onboarding flows.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxSegmentedProgress'],
  moduleImports: [
    "import { CngxSegmentedProgress, type SegmentState } from '@cngx/common/display';",
  ],
  imports: ['CngxSegmentedProgress'],
  setup: `protected readonly slides = ['Cover', 'Details', 'Gallery', 'Reviews', 'Checkout'];
  protected readonly index = signal(0);
  protected readonly segments = computed<readonly SegmentState[]>(() =>
    this.slides.map((_, i) => (i < this.index() ? 'done' : i === this.index() ? 'active' : 'todo')),
  );`,
  setupChrome: `protected prev(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }
  protected next(): void {
    this.index.update((i) => Math.min(this.slides.length - 1, i + 1));
  }`,
  template: `  <figure style="margin:0;display:flex;flex-direction:column;gap:0.75rem;max-inline-size:24rem">
    <div
      style="display:grid;place-items:center;block-size:7rem;border-radius:0.5rem;background:var(--mat-sys-surface-variant, #eee)"
    >
      {{ slides[index()] }}
    </div>
    <cngx-segmented-progress
      [segments]="segments()"
      [attr.aria-label]="'Slide ' + (index() + 1) + ' of ' + slides.length"
    />
  </figure>`,
  templateChrome: `  <div class="event-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="prev()">Previous slide</button>
    <button type="button" class="chip" (click)="next()">Next slide</button>
  </div>`,
};
