import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIcon: Sizes',
  subtitle: 'Five size presets driven by CSS custom properties. Default font size is 1.25em; override via <code>--cngx-icon-size</code>.',
  description: 'Five stars laid out on a baseline-aligned flex row, one per size preset (<code>xs</code>, <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>). Each preset toggles a host class that points <code>font-size</code> at a different <code>--cngx-icon-size-*</code> token, so consumers can re-tune the entire scale by overriding the variables instead of forking the component.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxIcon',
  ],
  moduleImports: [
    'import { CngxIcon } from \'@cngx/common/display\';',
  ],
  imports: ['CngxIcon'],
  template: `
  <div style="display:flex; align-items:baseline; gap:16px">
    <cngx-icon size="xs">★</cngx-icon>
    <cngx-icon size="sm">★</cngx-icon>
    <cngx-icon size="md">★</cngx-icon>
    <cngx-icon size="lg">★</cngx-icon>
    <cngx-icon size="xl">★</cngx-icon>
  </div>`,
};
