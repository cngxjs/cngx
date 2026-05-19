import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Bar Variant',
  subtitle: 'YouTube-style thin line. Place at the top of a container.',
  description: 'Purely visual loading indicator — spinner or bar variant. Delay + minDuration prevent flash.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'async-state'],
  apiComponents: [
    'CngxLoadingIndicator',
  ],
  moduleImports: [
    'import { CngxLoadingIndicator } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxLoadingIndicator'],
  setup: `protected readonly isLoading = signal(false);`,
  template: `
  <div style="position:relative;border:1px solid var(--cngx-color-border,#ddd);border-radius:8px;padding:24px;min-height:80px">
    <cngx-loading-indicator [loading]="isLoading()" variant="bar" label="Refreshing"
      style="position:absolute;top:0;left:0;right:0" />
    <p>Container content. Click "Start Loading" above to see the bar.</p>
  </div>`,
};
