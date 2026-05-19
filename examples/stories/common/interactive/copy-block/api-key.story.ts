import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'API Key',
  subtitle: 'Custom labels for copy and copied states.',
  description: 'Molecule: code/text block with built-in copy button and SR announcement.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxCopyBlock',
  ],
  moduleImports: [
    'import { CngxCopyBlock } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCopyBlock'],
  setup: `protected readonly apiKey = signal('sk_test_EXAMPLE_KEY_1234567890');`,
  template: `
  <cngx-copy-block [value]="apiKey()" buttonLabel="Copy Key" copiedLabel="Key copied!">
    {{ apiKey() }}
  </cngx-copy-block>`,
};
