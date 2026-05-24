import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxProgress: linear indeterminate',
  subtitle: 'Default state when no progress value is set.',
  description: 'Indeterminate linear bar: the default rendering when <code>[progress]</code> is left unbound. Used for unknown-duration work where any percentage would be misleading.',
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
  setup: `protected readonly progress = signal<number | undefined>(undefined);`,
  template: `
  <cngx-progress label="Loading" />`,
};
