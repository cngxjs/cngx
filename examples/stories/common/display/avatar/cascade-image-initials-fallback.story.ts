import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Cascade: image, initials, fallback',
  subtitle: 'Image takes priority. If it errors (try the second one), initials render. The third falls back to projected content.',
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
    <cngx-avatar src="https://i.pravatar.cc/80?u=jane" alt="Jane" initials="JD"></cngx-avatar>
    <cngx-avatar src="https://example.com/broken.jpg" initials="JD"></cngx-avatar>
    <cngx-avatar>
      <span aria-hidden="true" style="font-size:1.25em">?</span>
    </cngx-avatar>
  </div>`,
};
