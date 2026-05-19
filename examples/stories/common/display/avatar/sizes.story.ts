import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sizes',
  subtitle: 'Five presets controlled by <code>size</code>. Override <code>--cngx-avatar-size</code> for custom values.',
  description: 'Avatar display atom with image / initials / content fallback cascade and optional status indicator.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxAvatar',
  ],
  moduleImports: [
    'import { CngxAvatar } from \'@cngx/common/display\';',
  ],
  imports: ['CngxAvatar'],
  template: `
  <div class="row">
    <cngx-avatar size="xs" initials="A"></cngx-avatar>
    <cngx-avatar size="sm" initials="AB"></cngx-avatar>
    <cngx-avatar size="md" initials="AB"></cngx-avatar>
    <cngx-avatar size="lg" initials="ABC"></cngx-avatar>
    <cngx-avatar size="xl" initials="ABC"></cngx-avatar>
  </div>`,
  css: `.row { display: flex; gap: 12px; align-items: center; }`,
};
