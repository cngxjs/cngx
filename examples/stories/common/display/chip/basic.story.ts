import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChip: Basic',
  subtitle: 'Default-styled pill rendering projected content. No close button, no group context.',
  description: 'The minimal surface: <code>&lt;cngx-chip&gt;Label&lt;/cngx-chip&gt;</code>. The host renders the pill chrome (radius, padding, focus outline tokens) and reads its <code>resolvedId</code> so consumer ARIA wiring (<code>aria-describedby</code>, <code>aria-labelledby</code>) has a stable target. Without <code>[removable]="true"</code> the close button is not rendered. Without <code>[attr.data-color]</code> the chip uses the neutral palette.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxChip',
  ],
  moduleImports: [
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChip'],
  template: `
  <div style="display:flex; gap:8px; flex-wrap:wrap">
    <cngx-chip>Frontend</cngx-chip>
    <cngx-chip>Cleared</cngx-chip>
    <cngx-chip>Pending review</cngx-chip>
  </div>`,
};
