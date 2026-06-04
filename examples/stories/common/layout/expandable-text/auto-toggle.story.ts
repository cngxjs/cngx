import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxExpandableText: Auto toggle',
  subtitle:
    'The "Show more" button appears only because the content exceeds 3 lines. Short text would render with no button.',
  description:
    'Disclosure pattern that wraps long copy in a three-line clamp and renders the toggle only when CngxTruncate reports the content as actually clamped. The button carries aria-expanded and writes the [(expanded)] model.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
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
  apiComponents: ['CngxExpandableText'],
  moduleImports: ["import { CngxExpandableText } from '@cngx/common/layout';"],
  imports: ['CngxExpandableText'],
  template: `  <div style="max-width:400px">
    <cngx-expandable-text [lines]="3" #exp="cngxExpandableText">
      Angular Signals represent a fundamental shift in how we think about reactivity.
      Instead of subscribing to streams and manually managing subscriptions, signals
      provide a synchronous, pull-based model where derived values are automatically
      tracked and updated. This eliminates entire categories of bugs related to
      subscription leaks, stale closures, and timing issues. The computed() function
      creates derived signals that update automatically when their dependencies change.
    </cngx-expandable-text>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">expanded</span>
      <span class="event-value">{{ exp.expanded() }}</span>
    </div>
  </div>`,
};
