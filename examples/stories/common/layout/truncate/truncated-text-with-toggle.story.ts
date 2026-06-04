import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTruncate: Truncated text with toggle',
  subtitle:
    'Long text clamped to 3 lines. The "Show more" button appears only because <code>isClamped()</code> is <code>true</code>.',
  description:
    'Renders a long paragraph clamped to three lines by CngxTruncate. ResizeObserver re-checks the clamped flag, the disclosure button shows up only when isClamped() is true, and the toggle writes the two-way [(expanded)] model with aria-expanded.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
    {
      label: 'WAI-ARIA aria-expanded',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-expanded',
    },
  ],
  apiComponents: ['CngxTruncate'],
  moduleImports: ["import { CngxTruncate } from '@cngx/common/layout';"],
  imports: ['CngxTruncate'],
  setup: `protected readonly expanded1 = signal(false);`,
  template: `  <div style="max-width:400px">
    <p [cngxTruncate]="3" [(expanded)]="expanded1" #trunc="cngxTruncate"
       class="demo-truncate-text">
      Angular Signals represent a fundamental shift in how we think about reactivity.
      Instead of subscribing to streams and manually managing subscriptions, signals
      provide a synchronous, pull-based model where derived values are automatically
      tracked and updated. This eliminates entire categories of bugs related to
      subscription leaks, stale closures, and timing issues. The computed() function
      creates derived signals that update automatically when their dependencies change,
      making the entire state graph declarative and self-consistent.
    </p>
    @if (trunc.isClamped() || expanded1()) {
      <button type="button" class="demo-truncate-toggle"
              [attr.aria-expanded]="expanded1()"
              (click)="expanded1.set(!expanded1())">
        {{ expanded1() ? 'Show less' : 'Show more' }}
      </button>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isClamped</span>
      <span class="event-value">{{ trunc.isClamped() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">expanded</span>
      <span class="event-value">{{ expanded1() }}</span>
    </div>
  </div>`,
};
