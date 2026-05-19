import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — two-way binding',
  subtitle: 'Click anywhere on the row, or focus and press <strong>Space</strong>/<strong>Enter</strong>. The host signal updates via <code>[(value)]</code>.',
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
  <cngx-toggle [(value)]="notifications">Receive e-mail notifications</cngx-toggle>
  <p class="caption">Bound: <code>{{ notifications() }}</code></p>`,
  css: `.caption { font-size: 0.875em; color: var(--cngx-text-muted, #6b7280); margin-top: 8px; }`,
};
