import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonGroup: Vertical',
  subtitle: '<code>orientation="vertical"</code> stacks the segments; seams and radii follow the block axis.',
  description: 'A vertical group stacks its segments into one column of equal width. The seams collapse along the block axis, the first segment keeps its top corners and the last its bottom corners, all on logical properties so the frame also holds under <code>dir="rtl"</code>. The orientation is a layout choice only: the group stays <code>role="group"</code>, and the buttons keep their own Tab stops.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxButtonGroup', 'CngxButton'],
  moduleImports: ["import { CngxButton, CngxButtonGroup } from '@cngx/common/button';"],
  imports: ['CngxButton', 'CngxButtonGroup'],
  template: `
  <div cngxButtonGroup orientation="vertical" variant="outline" aria-label="Sort by">
    <button cngxButton>Newest first</button>
    <button cngxButton>Oldest first</button>
    <button cngxButton>Name</button>
    <button cngxButton>Size</button>
  </div>`,
};
