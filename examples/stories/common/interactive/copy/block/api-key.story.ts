import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCopyBlock: API key',
  subtitle: 'Custom labels for copy and copied states.',
  description:
    'Overrides <code>buttonLabel</code> and <code>copiedLabel</code>. The built-in <code>aria-live="polite"</code> region keeps assistive tech informed without consumer wiring.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxCopyBlock'],
  moduleImports: ["import { CngxCopyBlock } from '@cngx/common/interactive';"],
  imports: ['CngxCopyBlock'],
  setup: `protected readonly apiKey = signal('sk_test_EXAMPLE_KEY_1234567890');`,
  template: `
  <div style="max-width:380px">
    <cngx-copy-block [value]="apiKey()" buttonLabel="Copy Key" copiedLabel="Key copied!">
      {{ apiKey() }}
    </cngx-copy-block>
  </div>`,
};
