import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Short Text — No Toggle',
  subtitle: 'When content fits within the line limit, <code>isClamped()</code> is <code>false</code> and no toggle appears.',
  description: 'Text truncation with expand/collapse and clamped-state detection. Shows a toggle only when content actually overflows.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxTruncate',
  ],
  moduleImports: [
    'import { CngxTruncate } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxTruncate'],
  setup: `protected readonly expanded2 = signal(false);`,
  template: `  <div style="max-width:400px">
    <p [cngxTruncate]="3" [(expanded)]="expanded2" #trunc2="cngxTruncate"
       style="margin:0;line-height:1.6;font-size:0.875rem">
      This text is short enough to fit in 3 lines.
    </p>
    @if (trunc2.isClamped() || expanded2()) {
      <button (click)="expanded2.set(!expanded2())"
              style="margin-top:4px;background:none;border:none;color:var(--interactive,#f5a623);cursor:pointer;padding:0;font-size:0.8125rem">
        {{ expanded2() ? 'Show less' : 'Show more' }}
      </button>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isClamped</span>
      <span class="event-value">{{ trunc2.isClamped() }}</span>
    </div>
  </div>`,
};
