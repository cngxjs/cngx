import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCopyText: Copy URL with SR announcement',
  subtitle:
    'Pair with an <code>aria-live="polite"</code> region so screen readers announce the copy.',
  description:
    'Atom: the directive itself ships no live region. This story shows the canonical consumer pattern - an always-present visually-hidden <code>aria-live</code> span whose text becomes non-empty only after a successful copy.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WCAG 2.1 SC 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html',
    },
    {
      label: 'WAI-ARIA Authoring Practices: Live Regions',
      href: 'https://www.w3.org/WAI/ARIA/apg/practices/live-regions/',
    },
  ],
  apiComponents: ['CngxCopyText'],
  moduleImports: ["import { CngxCopyText } from '@cngx/common/interactive';"],
  imports: ['CngxCopyText'],
  setup: `protected readonly shareUrl = signal('https://cngx.dev/docs/copy-text');`,
  template: `
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    <span class="demo-copy-url__label">{{ shareUrl() }}</span>
    <button
      type="button"
      [cngxCopyText]="shareUrl()"
      #cp2="cngxCopyText"
      class="chip"
      [class.demo-chip--copied]="cp2.copied()"
    >
      {{ cp2.copied() ? 'Link copied!' : 'Copy Link' }}
    </button>
    <span aria-live="polite" class="demo-sr-only">
      {{ cp2.copied() ? 'Link copied to clipboard' : '' }}
    </span>
  </div>`,
};
