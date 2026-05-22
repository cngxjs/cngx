import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckboxIndicator: Sizes',
  subtitle: 'Three presets driven by <code>--cngx-checkbox-size</code>. Default <code>md</code>; override via the host token.',
  description: 'Three indicators in the same checked state across the size scale. Each preset pins <code>--cngx-checkbox-size</code> to its tier token, which the glyph, the box stroke, and the focus padding all read through. Override <code>--cngx-checkbox-size-sm</code> / <code>--cngx-checkbox-size-md</code> / <code>--cngx-checkbox-size-lg</code> at any DOM level to retune the whole scale without forking the atom.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxCheckboxIndicator',
  ],
  moduleImports: [
    'import { CngxCheckboxIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxCheckboxIndicator'],
  template: `
  <div style="display:flex; align-items:center; gap:24px">
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px">
      <cngx-checkbox-indicator variant="checkbox" [checked]="true" size="sm" />
      <code>sm</code>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px">
      <cngx-checkbox-indicator variant="checkbox" [checked]="true" size="md" />
      <code>md</code>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px">
      <cngx-checkbox-indicator variant="checkbox" [checked]="true" size="lg" />
      <code>lg</code>
    </div>
  </div>`,
};
