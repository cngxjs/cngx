import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTagGroup: alignment',
  subtitle: 'When the group has more horizontal room than its tags, <code>[align]</code> picks the cross-axis distribution. <code>between</code> resolves to <code>justify-content: space-between</code>.',
  description: 'The four values map onto flex-axis distributions: <code>start</code>, <code>center</code>, <code>end</code>, <code>between</code>. The dashed frames in this demo are the example app\'s helper class; the group itself ships no border.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTagGroup', 'CngxTag'],
  moduleImports: ["import { CngxTag, CngxTagGroup } from '@cngx/common/display';"],
  imports: ['CngxTag', 'CngxTagGroup'],
  template: `
  <div class="demo-tag-stack">
    <cngx-tag-group align="start" class="demo-tag-group-frame" style="min-width: 24rem;">
      <span cngxTag color="info">start</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="center" class="demo-tag-group-frame" style="min-width: 24rem;">
      <span cngxTag color="info">center</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="end" class="demo-tag-group-frame" style="min-width: 24rem;">
      <span cngxTag color="info">end</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="between" class="demo-tag-group-frame" style="min-width: 24rem;">
      <span cngxTag color="info">between</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
  </div>`,
};
