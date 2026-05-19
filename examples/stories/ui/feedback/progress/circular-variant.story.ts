import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Circular Variant',
  subtitle: 'Indeterminate spinner (left) and determinate with value (right, click Start Upload above).',
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
  setup: `protected readonly progress = signal<number | undefined>(undefined);`,
  template: `
  <div style="display:flex;gap:24px;align-items:center">
    <cngx-progress variant="circular" label="Processing" />
    @if (progress() !== undefined) {
      <cngx-progress variant="circular" [progress]="progress()" [showLabel]="true" label="Upload" />
    } @else {
      <span style="color:var(--cngx-muted,#64748b);font-size:0.875rem">Click "Start Upload" to see determinate circle</span>
    }
  </div>`,
};
