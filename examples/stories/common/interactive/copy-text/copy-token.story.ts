import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Copy Token',
  subtitle: 'Click the button to copy the API token. The <code>copied()</code> signal drives "Copied!" feedback.',
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
  setup: `protected readonly token = signal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');`,
  template: `
  <div style="display:flex;align-items:center;gap:8px">
    <code style="padding:6px 10px;background:var(--code-bg,#f5f5f5);border:1px solid var(--code-border,#ddd);
                 border-radius:4px;font-size:0.8125rem;overflow:hidden;text-overflow:ellipsis;max-width:280px">
      {{ token() }}
    </code>
    <button [cngxCopyText]="token()" #cp="cngxCopyText" class="chip"
            [style.background]="cp.copied() ? 'var(--cngx-color-success)' : ''"
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
};
