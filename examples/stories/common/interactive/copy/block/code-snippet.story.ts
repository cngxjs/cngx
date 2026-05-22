import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Code Snippet',
  subtitle: 'Click "Copy" to copy the install command. The button shows "Copied!" for 2 seconds.',
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
  setup: `protected readonly installCmd = 'npm install @cngx/common';`,
  template: `
  <cngx-copy-block [value]="installCmd">
    {{ installCmd }}
  </cngx-copy-block>`,
};
