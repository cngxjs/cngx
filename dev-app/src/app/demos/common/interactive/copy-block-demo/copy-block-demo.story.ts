import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Copy Block',
  navLabel: 'CopyBlock',
  navCategory: 'interactive',
  description:
    'Molecule: code/text block with built-in copy button and SR announcement.',
  apiComponents: ['CngxCopyBlock'],
  overview:
    '<p><code>cngx-copy-block</code> combines a content container with a <code>CngxCopyText</code>-powered ' +
    'copy button. "Copied!" feedback and screen reader announcement are built in.</p>',
  moduleImports: [
    "import { CngxCopyBlock } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly installCmd = 'npm install @cngx/common';
  protected readonly apiKey = signal('sk_test_EXAMPLE_KEY_1234567890');
  `,
  sections: [
    {
      title: 'Code Snippet',
      subtitle:
        'Click "Copy" to copy the install command. The button shows "Copied!" for 2 seconds.',
      imports: ['CngxCopyBlock'],
      template: `
  <cngx-copy-block [value]="installCmd">
    {{ installCmd }}
  </cngx-copy-block>`,
    },
    {
      title: 'API Key',
      subtitle:
        'Custom labels for copy and copied states.',
      imports: ['CngxCopyBlock'],
      template: `
  <cngx-copy-block [value]="apiKey()" buttonLabel="Copy Key" copiedLabel="Key copied!">
    {{ apiKey() }}
  </cngx-copy-block>`,
    },
  ],
};
