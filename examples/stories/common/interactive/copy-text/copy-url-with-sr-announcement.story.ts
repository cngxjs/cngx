import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Copy URL with SR Announcement',
  subtitle: 'Pair with an <code>aria-live</code> region so screen readers announce the copy.',
  description: 'Clipboard copy behavior without forms dependency. Clipboard API with execCommand fallback.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxCopyText',
  ],
  moduleImports: [
    'import { CngxCopyText } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCopyText'],
  setup: `protected readonly shareUrl = signal('https://cngx.dev/docs/copy-text');`,
  template: `
  <div style="display:flex;align-items:center;gap:8px">
    <span style="font-size:0.875rem;color:var(--cngx-text-secondary,#666)">{{ shareUrl() }}</span>
    <button [cngxCopyText]="shareUrl()" #cp2="cngxCopyText" class="chip">
      {{ cp2.copied() ? 'Link copied!' : 'Copy Link' }}
    </button>
    <span aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">
      {{ cp2.copied() ? 'Link copied to clipboard' : '' }}
    </span>
  </div>`,
};
