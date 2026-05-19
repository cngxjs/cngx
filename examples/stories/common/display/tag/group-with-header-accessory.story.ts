import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Group with header + accessory',
  subtitle: 'Project <code>&lt;ng-template cngxTagGroupHeader&gt;</code> above the tag row and <code>&lt;ng-template cngxTagGroupAccessory&gt;</code> below it. Both slot contexts expose the live <code>count</code> of projected <code>cngxTag</code> children plus the group\'s reactive state — consumer "Filters ({{ count }})" patterns work without injecting the directive.',
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
    'import { CngxTag, CngxTagGroup, CngxTagGroupHeader, CngxTagGroupAccessory } from \'@cngx/common/display\';',
  ],
  imports: ['CngxTag', 'CngxTagGroup', 'CngxTagGroupHeader', 'CngxTagGroupAccessory'],
  template: `
  <cngx-tag-group [semanticList]="true" label="Active filters">
    <ng-template cngxTagGroupHeader let-count="count">
      <strong>Filters ({{ count }})</strong>
    </ng-template>
    <span cngxTag color="info">Frontend</span>
    <span cngxTag color="info">Backend</span>
    <span cngxTag color="success">Cleared</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
    <ng-template cngxTagGroupAccessory let-count="count">
      <button type="button">Clear all ({{ count }})</button>
    </ng-template>
  </cngx-tag-group>`,
  css: `/* Header / accessory zones flow through --cngx-tag-group-stack-gap; row layout untouched. */`,
};
