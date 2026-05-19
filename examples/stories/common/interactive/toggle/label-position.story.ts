import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Label position',
  subtitle: '<code>[labelPosition]="\'before\'"</code> renders the label to the left of the track via <code>flex-direction: row-reverse</code> on the host class.',
  description: 'Single-value boolean switch atom. role="switch" with reactive aria-checked, aria-disabled, aria-describedby for the consumer-supplied disabled reason. Click + Space + Enter all flip. Provides CNGX_CONTROL_VALUE so CngxFormBridge (Phase 7) can bind to it without per-atom CVA.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxToggle',
  ],
  moduleImports: [
    'import { CngxToggle } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxToggle'],
  setup: `protected readonly notifications = signal(false);`,
  template: `
  <cngx-toggle [(value)]="notifications" labelPosition="before">Label before</cngx-toggle>
  <cngx-toggle [(value)]="notifications">Label after (default)</cngx-toggle>`,
  css: `cngx-toggle { display: inline-flex; margin-right: 24px; }`,
};
