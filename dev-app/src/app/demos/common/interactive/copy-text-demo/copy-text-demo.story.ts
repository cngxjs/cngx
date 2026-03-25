import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Copy Text',
  navLabel: 'CopyText',
  navCategory: 'interactive',
  description:
    'Clipboard copy behavior without forms dependency. Clipboard API with execCommand fallback.',
  apiComponents: ['CngxCopyText'],
  overview:
    '<p><code>[cngxCopyText]</code> copies text to the clipboard on click. Shows a <code>copied()</code> ' +
    'signal for visual feedback that auto-resets after <code>resetDelay</code> ms. Falls back to ' +
    '<code>execCommand("copy")</code> when the Clipboard API is unavailable.</p>',
  moduleImports: [
    "import { CngxCopyText } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly token = signal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  protected readonly shareUrl = signal('https://cngx.dev/docs/copy-text');
  `,
  sections: [
    {
      title: 'Copy Token',
      subtitle:
        'Click the button to copy the API token. The <code>copied()</code> signal drives "Copied!" feedback.',
      imports: ['CngxCopyText'],
      template: `
  <div style="display:flex;align-items:center;gap:8px">
    <code style="padding:6px 10px;background:var(--code-bg,#f5f5f5);border:1px solid var(--code-border,#ddd);
                 border-radius:4px;font-size:0.8125rem;overflow:hidden;text-overflow:ellipsis;max-width:280px">
      {{ token() }}
    </code>
    <button [cngxCopyText]="token()" #cp="cngxCopyText" class="chip"
            [style.background]="cp.copied() ? 'var(--success-bg, #e8f5e9)' : ''"
            [style.borderColor]="cp.copied() ? 'var(--success-fg, #2e7d32)' : ''">
      {{ cp.copied() ? 'Copied!' : 'Copy' }}
    </button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">copied</span>
      <span class="event-value">{{ cp.copied() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">supported</span>
      <span class="event-value">{{ cp.supported }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Copy URL with SR Announcement',
      subtitle:
        'Pair with an <code>aria-live</code> region so screen readers announce the copy.',
      imports: ['CngxCopyText'],
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
    },
  ],
};
