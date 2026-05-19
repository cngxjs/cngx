import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Linear — Indeterminate',
  subtitle: 'Default state when no progress value is set.',
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
  <cngx-progress label="Loading" />`,
};
