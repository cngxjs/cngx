import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCopyBlock: Code snippet',
  subtitle: 'Default labels copying a static install command.',
  description:
    'Drop-in usage with the default <code>Copy</code> / <code>Copied!</code> labels. Demonstrates that <code>[value]</code> accepts a plain string, not just a signal call.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxCopyBlock'],
  moduleImports: ["import { CngxCopyBlock } from '@cngx/common/interactive';"],
  imports: ['CngxCopyBlock'],
  setup: `protected readonly installCmd = 'npm install @cngx/common';`,
  template: `
  <div style="max-width:380px">
    <cngx-copy-block [value]="installCmd">
      {{ installCmd }}
    </cngx-copy-block>
  </div>`,
};
