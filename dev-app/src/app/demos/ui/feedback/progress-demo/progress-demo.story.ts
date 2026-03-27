import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Progress',
  navLabel: 'Progress',
  navCategory: 'feedback',
  description: 'Determinate/indeterminate progress indicator. Linear bar or circular variant. CSS transition smoothing for jumpy updates.',
  apiComponents: ['CngxProgress'],
  moduleImports: [
    "import { CngxProgress } from '@cngx/ui/feedback';",
  ],
  setup: `
  protected readonly progress = signal<number | undefined>(undefined);
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
  }
  `,
  sections: [
    {
      title: 'Linear — Indeterminate',
      subtitle: 'Default state when no progress value is set.',
      imports: ['CngxProgress'],
      template: `
  <cngx-progress label="Loading" />`,
    },
    {
      title: 'Linear — Determinate',
      subtitle: 'Click to simulate upload progress (0-100% in steps of 10).',
      imports: ['CngxProgress'],
      template: `
  <button (click)="startDeterminate()" class="chip" style="margin-bottom:16px">
    {{ progress() !== undefined ? progress() + '%' : 'Start Upload' }}
  </button>
  @if (progress() !== undefined) {
    <cngx-progress [progress]="progress()" [showLabel]="true" label="File upload" />
  }`,
    },
    {
      title: 'Circular Variant',
      subtitle: 'Indeterminate spinner (left) and determinate with value (right, click Start Upload above).',
      imports: ['CngxProgress'],
      template: `
  <div style="display:flex;gap:24px;align-items:center">
    <cngx-progress variant="circular" label="Processing" />
    @if (progress() !== undefined) {
      <cngx-progress variant="circular" [progress]="progress()" [showLabel]="true" label="Upload" />
    } @else {
      <span style="color:var(--cngx-muted,#64748b);font-size:0.875rem">Click "Start Upload" to see determinate circle</span>
    }
  </div>`,
    },
  ],
};
