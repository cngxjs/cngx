import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTruncate: Short text no toggle',
  subtitle:
    'When content fits within the line limit, <code>isClamped()</code> is <code>false</code> and the toggle stays hidden.',
  description:
    'Renders a paragraph that already fits in three lines. CngxTruncate still applies the line-clamp host styles, but isClamped() reports false, so the conditional toggle never enters the template - no dead UI for already-short copy.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Disclosure Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    },
  ],
  apiComponents: ['CngxTruncate'],
  moduleImports: ["import { CngxTruncate } from '@cngx/common/layout';"],
  imports: ['CngxTruncate'],
  setup: `protected readonly expanded2 = signal(false);`,
  template: `  <div style="max-width:400px">
    <p [cngxTruncate]="3" [(expanded)]="expanded2" #trunc2="cngxTruncate"
       class="demo-truncate-text">
      This text is short enough to fit in 3 lines.
    </p>
    @if (trunc2.isClamped() || expanded2()) {
      <button type="button" class="demo-truncate-toggle"
              [attr.aria-expanded]="expanded2()"
              (click)="expanded2.set(!expanded2())">
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
