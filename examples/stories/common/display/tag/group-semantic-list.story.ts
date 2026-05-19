import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Group + semantic list',
  subtitle: 'Wrap projected tags in <code>&lt;cngx-tag-group [semanticList]="true" label="…"&gt;</code> to expose a real <code>role="list"</code> with reactive <code>role="listitem"</code> children — AT reads "Filters, list, 5 items".',
  description: 'Decorative label / badge / status indicator. Dual selector ([cngxTag] and <cngx-tag>) so it composes onto any host element including <a> for link-mode tags. Removable affordances live in CngxChip; clickable interactions live on native <button cngxTag> / <a cngxTag>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxTag',
    'CngxTagLabel',
    'CngxTagPrefix',
    'CngxTagSuffix',
    'CngxIcon',
    'CngxTagGroup',
    'CngxTagGroupHeader',
    'CngxTagGroupAccessory',
  ],
  moduleImports: [
    'import { CngxTag, CngxTagGroup } from \'@cngx/common/display\';',
  ],
  imports: ['CngxTag', 'CngxTagGroup'],
  template: `
  <cngx-tag-group [semanticList]="true" label="Filters">
    <span cngxTag color="info">Frontend</span>
    <span cngxTag color="info">Backend</span>
    <span cngxTag color="success">Cleared</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
  </cngx-tag-group>`,
  css: `cngx-tag-group { /* role="list", aria-label="Filters" applied automatically */ }`,
};
