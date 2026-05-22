import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTagGroup: gap variants',
  subtitle: 'Without <code>[semanticList]</code> the group is a decorative flex-wrap row; <code>[gap]</code> scales the spacing through <code>--cngx-tag-group-gap-{xs,sm,md}</code> custom properties.',
  description: 'Three steps: <code>xs</code> for tight chip strips, <code>sm</code> default, <code>md</code> for roomy taxonomy clusters.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTagGroup', 'CngxTag'],
  moduleImports: ["import { CngxTag, CngxTagGroup } from '@cngx/common/display';"],
  imports: ['CngxTag', 'CngxTagGroup'],
  template: `
  <div class="demo-tag-stack">
    <cngx-tag-group gap="xs">
      <span cngxTag color="neutral">xs</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">tight</span>
    </cngx-tag-group>
    <cngx-tag-group gap="sm">
      <span cngxTag color="neutral">sm</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">default</span>
    </cngx-tag-group>
    <cngx-tag-group gap="md">
      <span cngxTag color="neutral">md</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">roomy</span>
    </cngx-tag-group>
  </div>`,
};
