import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Sizes',
  subtitle: '<code>xs</code> to <code>lg</code>; <code>md</code> is exactly the form-control row.',
  description: 'Every size step derives its padding from the <code>--cngx-space-*</code> scale and its text from the font tokens, so <code>[data-density]</code> and the root font size re-scale all four steps without a button input. On a coarse pointer each step floors to <code>--cngx-target-min</code> (44px). <code>md</code> shares its height with <code>cngxInput</code> and every select trigger.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxButton'],
  moduleImports: ["import { CngxButton } from '@cngx/common/button';"],
  imports: ['CngxButton'],
  template: `
  <div style="display:flex; flex-direction:column; gap:16px">
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px">
      <button cngxButton size="xs">Extra small</button>
      <button cngxButton size="sm">Small</button>
      <button cngxButton size="md">Medium</button>
      <button cngxButton size="lg">Large</button>
    </div>
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px">
      <button cngxButton="outline" size="xs">Extra small</button>
      <button cngxButton="outline" size="sm">Small</button>
      <button cngxButton="outline" size="md">Medium</button>
      <button cngxButton="outline" size="lg">Large</button>
    </div>
  </div>`,
};
