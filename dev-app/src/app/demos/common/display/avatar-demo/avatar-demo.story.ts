import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Avatar',
  navLabel: 'Avatar',
  navCategory: 'display',
  description:
    'Avatar display atom with image / initials / content fallback cascade and optional status indicator.',
  apiComponents: ['CngxAvatar'],
  overview:
    '<p><code>cngx-avatar</code> renders an image when provided, falls back to initials, and finally to projected content. ' +
    'Status dot and sizes are driven by CSS custom properties.</p>',
  moduleImports: ["import { CngxAvatar } from '@cngx/common/display';"],
  sections: [
    {
      title: 'Sizes',
      subtitle: 'Five presets controlled by <code>size</code>. Override <code>--cngx-avatar-size</code> for custom values.',
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
    },
    {
      title: 'Cascade: image, initials, fallback',
      subtitle:
        'Image takes priority. If it errors (try the second one), initials render. The third falls back to projected content.',
      imports: ['CngxAvatar'],
      template: `
  <div class="row">
    <cngx-avatar src="https://i.pravatar.cc/80?u=jane" alt="Jane" initials="JD"></cngx-avatar>
    <cngx-avatar src="https://example.com/broken.jpg" initials="JD"></cngx-avatar>
    <cngx-avatar>
      <span aria-hidden="true" style="font-size:1.25em">?</span>
    </cngx-avatar>
  </div>`,
    },
    {
      title: 'Shapes and status',
      subtitle:
        'Circle (default) or square. Optional presence status with <code>aria-label</code>.',
      imports: ['CngxAvatar'],
      template: `
  <div class="row">
    <cngx-avatar initials="ON" status="online"></cngx-avatar>
    <cngx-avatar initials="BS" status="busy"></cngx-avatar>
    <cngx-avatar initials="AW" status="away"></cngx-avatar>
    <cngx-avatar initials="OF" status="offline" shape="square"></cngx-avatar>
  </div>`,
    },
  ],
};
