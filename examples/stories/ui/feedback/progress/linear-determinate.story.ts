import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxProgress: linear determinate',
  subtitle: 'Click to simulate upload progress (0-100% in steps of 10).',
  description: 'Determinate linear bar: a click steps the signal through 0 to 100 in 10% jumps with a 500ms interval. CSS transitions absorb jumpy updates so the bar always reads smoothly.',
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
  <button (click)="startDeterminate()" class="chip" type="button" style="margin-bottom:16px">
    {{ progress() !== undefined ? progress() + '%' : 'Start Upload' }}
  </button>
  @if (progress() !== undefined) {
    <cngx-progress [progress]="progress()" [showLabel]="true" label="File upload" />
  }`,
};
