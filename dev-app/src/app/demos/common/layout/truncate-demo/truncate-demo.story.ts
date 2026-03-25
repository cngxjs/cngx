import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Truncate',
  navLabel: 'Truncate',
  navCategory: 'layout',
  description:
    'Text truncation with expand/collapse and clamped-state detection. Shows a toggle only when content actually overflows.',
  apiComponents: ['CngxTruncate'],
  overview:
    '<p><code>[cngxTruncate]</code> applies <code>-webkit-line-clamp</code> when collapsed and uses ' +
    '<code>ResizeObserver</code> to detect whether the text actually overflows. The <code>isClamped()</code> signal ' +
    'lets you conditionally show a "Show more" button only when needed.</p>',
  moduleImports: [
    "import { CngxTruncate } from '@cngx/common/layout';",
  ],
  setup: `
  protected readonly expanded1 = signal(false);
  protected readonly expanded2 = signal(false);
  `,
  sections: [
    {
      title: 'Truncated Text with Toggle',
      subtitle:
        'Long text clamped to 3 lines. The "Show more" button appears only because <code>isClamped()</code> is <code>true</code>.',
      imports: ['CngxTruncate'],
      template: `
  <div style="max-width:400px">
    <p [cngxTruncate]="3" [(expanded)]="expanded1" #trunc="cngxTruncate"
       style="margin:0;line-height:1.6;font-size:0.875rem">
      Angular Signals represent a fundamental shift in how we think about reactivity.
      Instead of subscribing to streams and manually managing subscriptions, signals
      provide a synchronous, pull-based model where derived values are automatically
      tracked and updated. This eliminates entire categories of bugs related to
      subscription leaks, stale closures, and timing issues. The computed() function
      creates derived signals that update automatically when their dependencies change,
      making the entire state graph declarative and self-consistent.
    </p>
    @if (trunc.isClamped() || expanded1()) {
      <button (click)="expanded1.set(!expanded1())"
              [attr.aria-expanded]="expanded1()"
              style="margin-top:4px;background:none;border:none;color:var(--interactive,#f5a623);
                     cursor:pointer;padding:0;font-size:0.8125rem">
        {{ expanded1() ? 'Show less' : 'Show more' }}
      </button>
    }
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isClamped</span>
      <span class="event-value">{{ trunc.isClamped() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">expanded</span>
      <span class="event-value">{{ expanded1() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Short Text — No Toggle',
      subtitle:
        'When content fits within the line limit, <code>isClamped()</code> is <code>false</code> and no toggle appears.',
      imports: ['CngxTruncate'],
      template: `
  <div style="max-width:400px">
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
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isClamped</span>
      <span class="event-value">{{ trunc2.isClamped() }}</span>
    </div>
  </div>`,
    },
  ],
};
