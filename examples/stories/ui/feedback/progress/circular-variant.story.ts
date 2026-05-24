import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxProgress: circular variant',
  subtitle: 'Indeterminate spinner (left) and determinate with value (right). Click Start Upload below to drive the determinate circle.',
  description: 'Circular variant matrix: indeterminate by default; turns determinate the moment <code>[progress]</code> is bound. Side-by-side comparison makes the API contract obvious.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'async-state', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - progressbar', href: 'https://www.w3.org/TR/wai-aria-1.2/#progressbar' },
  ],
  apiComponents: [
    'CngxProgress',
  ],
  moduleImports: [
    'import { CngxProgress } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxProgress'],
  setup: `protected readonly progress = signal<number | undefined>(undefined);
  private interval: ReturnType<typeof setInterval> | undefined;
  protected startDeterminate(): void {
    this.progress.set(0);
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      const p = this.progress() ?? 0;
      if (p >= 100) {
        clearInterval(this.interval);
        this.progress.set(undefined);
        return;
      }
      this.progress.set(p + 10);
    }, 500);
  }`,
  template: `
  <div class="demo-row-center" style="gap:24px">
    <cngx-progress variant="circular" label="Processing" />
    @if (progress() !== undefined) {
      <cngx-progress variant="circular" [progress]="progress()" [showLabel]="true" label="Upload" />
    } @else {
      <span class="demo-hint">Click "Start Upload" below to see determinate circle</span>
    }
  </div>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button (click)="startDeterminate()" class="chip" type="button">
      {{ progress() !== undefined ? progress() + '%' : 'Start Upload' }}
    </button>
  </div>`,
};
