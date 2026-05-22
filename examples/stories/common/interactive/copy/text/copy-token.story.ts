import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCopyText: Copy token',
  subtitle:
    'Click the button to copy the API token. The <code>copied()</code> signal drives "Copied!" feedback.',
  description:
    'Atom: clipboard copy behavior without forms dependency. Uses the Clipboard API with an <code>execCommand</code> fallback. Consumer owns the surface and the optional SR live region.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxCopyText'],
  moduleImports: ["import { CngxCopyText } from '@cngx/common/interactive';"],
  imports: ['CngxCopyText'],
  setup: `protected readonly token = signal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');`,
  template: `
  <div style="display:flex;align-items:center;gap:8px;max-width:380px">
    <code class="demo-copy-token__code" style="flex:1;min-width:0">{{ token() }}</code>
    <button
      type="button"
      [cngxCopyText]="token()"
      #cp="cngxCopyText"
      class="chip"
      [class.demo-chip--copied]="cp.copied()"
    >
      {{ cp.copied() ? 'Copied!' : 'Copy' }}
    </button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
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
