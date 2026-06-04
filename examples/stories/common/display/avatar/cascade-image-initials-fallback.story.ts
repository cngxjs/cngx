import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAvatar: Cascade image, initials, fallback',
  subtitle: 'Image takes priority. If it errors (try the second one), initials render. The third falls back to projected content.',
  description: 'Three avatars demonstrate the rendering cascade in priority order. The first loads a real image with an explicit `alt` so screen readers announce the name. The second points at a broken URL so the host `(error)` handler flips to the initials block, which is rendered `aria-hidden` (initials are a glyph, not a name). The third has neither `src` nor `initials` and falls through to the projected `<ng-content>` glyph.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxAvatar',
  ],
  moduleImports: [
    'import { CngxAvatar } from \'@cngx/common/display\';',
  ],
  imports: ['CngxAvatar'],
  references: [
    { label: 'WCAG 2.1 SC 1.1.1 Non-text Content', href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html' },
    { label: 'HTML Living Standard: the `alt` attribute', href: 'https://html.spec.whatwg.org/multipage/images.html#alt' },
    { label: 'WAI-ARIA 1.2: `aria-hidden`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden' },
  ],
  template: `
  <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
    <cngx-avatar src="https://i.pravatar.cc/80?u=jane" alt="Jane" initials="JD"></cngx-avatar>
    <cngx-avatar src="https://example.com/broken.jpg" initials="JD"></cngx-avatar>
    <cngx-avatar>
      <span aria-hidden="true">?</span>
    </cngx-avatar>
  </div>`,
};
