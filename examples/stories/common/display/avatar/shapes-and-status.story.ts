import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Shapes and status',
  subtitle: 'Circle (default) or square. Optional presence status with <code>aria-label</code>.',
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
    <cngx-avatar initials="ON" status="online"></cngx-avatar>
    <cngx-avatar initials="BS" status="busy"></cngx-avatar>
    <cngx-avatar initials="AW" status="away"></cngx-avatar>
    <cngx-avatar initials="OF" status="offline" shape="square"></cngx-avatar>
  </div>`,
};
