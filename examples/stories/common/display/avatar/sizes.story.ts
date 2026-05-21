import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAvatar: Sizes',
  subtitle: 'Five presets controlled by <code>size</code>. Override <code>--cngx-avatar-size</code> for custom values.',
  description: 'Five avatars step through the `xs` / `sm` / `md` / `lg` / `xl` presets. Each preset pins `--cngx-avatar-size` and `--cngx-avatar-font-size` to its tier token so the initials scale with the plate. Set `--cngx-avatar-size` on the host to break out of the preset grid.',
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
  <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
    <cngx-avatar size="xs" initials="A"></cngx-avatar>
    <cngx-avatar size="sm" initials="AB"></cngx-avatar>
    <cngx-avatar size="md" initials="AB"></cngx-avatar>
    <cngx-avatar size="lg" initials="ABC"></cngx-avatar>
    <cngx-avatar size="xl" initials="ABC"></cngx-avatar>
  </div>`,
};
