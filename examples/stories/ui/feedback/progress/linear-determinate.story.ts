import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Linear — Determinate',
  subtitle: 'Click to simulate upload progress (0-100% in steps of 10).',
  description: 'Determinate/indeterminate progress indicator. Linear bar or circular variant. CSS transition smoothing for jumpy updates.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'async-state', 'a11y-pattern'],
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
  <button (click)="startDeterminate()" class="chip" style="margin-bottom:16px">
    {{ progress() !== undefined ? progress() + '%' : 'Start Upload' }}
  </button>
  @if (progress() !== undefined) {
    <cngx-progress [progress]="progress()" [showLabel]="true" label="File upload" />
  }`,
};
