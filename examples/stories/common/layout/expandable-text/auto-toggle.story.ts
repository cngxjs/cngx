import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Auto-Toggle',
  subtitle: 'The "Show more" button appears only because the content exceeds 3 lines. Short text would show no button.',
  description: 'Molecule wrapping CngxTruncate with a built-in expand/collapse toggle and aria-expanded.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxExpandableText',
  ],
  moduleImports: [
    'import { CngxExpandableText } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxExpandableText'],
  template: `
  <div style="max-width:400px">
    <cngx-expandable-text [lines]="3" #exp="cngxExpandableText">
      Angular Signals represent a fundamental shift in how we think about reactivity.
      Instead of subscribing to streams and manually managing subscriptions, signals
      provide a synchronous, pull-based model where derived values are automatically
      tracked and updated. This eliminates entire categories of bugs related to
      subscription leaks, stale closures, and timing issues. The computed() function
      creates derived signals that update automatically when their dependencies change.
    </cngx-expandable-text>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">expanded</span>
      <span class="event-value">{{ exp.expanded() }}</span>
    </div>
  </div>`,
};
