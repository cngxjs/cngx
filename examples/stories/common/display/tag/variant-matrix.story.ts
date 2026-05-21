import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: variant matrix',
  subtitle: 'Same colour, three visual variants: <code>filled</code>, <code>outline</code>, <code>subtle</code>.',
  description: 'Filled is the solid tinted pill, outline swaps fill for a coloured border, subtle softens both. All three resolve through the same <code>[data-color]</code> cascade so a single colour key drives the three surfaces.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTag'],
  moduleImports: ["import { CngxTag } from '@cngx/common/display';"],
  imports: ['CngxTag'],
  template: `
  <div class="demo-tag-row">
    <span cngxTag variant="filled" color="success">Filled</span>
    <span cngxTag variant="outline" color="success">Outline</span>
    <span cngxTag variant="subtle" color="success">Subtle</span>
  </div>`,
};
