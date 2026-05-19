import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Live Search Highlighting',
  subtitle: 'Type a search term to see matches highlighted in real time. The <code>matchCount()</code> signal shows the number of matches.',
  description: 'Search-text highlighting via <mark> elements. Safe text-node walking, no innerHTML.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxHighlight',
  ],
  moduleImports: [
    'import { CngxHighlight } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxHighlight'],
  setup: `protected readonly searchTerm = signal('');`,
  template: `
  <div style="margin-bottom:12px">
    <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)"
           placeholder="Type to highlight..."
           style="padding:8px 12px;border:1px solid var(--cngx-color-border,#ddd);border-radius:6px;width:240px" />
  </div>

  <div [cngxHighlight]="searchTerm()" #hl="cngxHighlight"
       style="line-height:1.8;font-size:0.9375rem;max-width:500px">
    Angular Signals represent a fundamental shift in how we think about reactivity.
    Instead of subscribing to streams and manually managing subscriptions, signals
    provide a synchronous, pull-based model where derived values are automatically
    tracked and updated. This eliminates entire categories of bugs related to
    subscription leaks, stale closures, and timing issues.
  </div>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Match count</span>
      <span class="event-value">{{ hl.matchCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Term</span>
      <span class="event-value">{{ searchTerm() || '(empty)' }}</span>
    </div>
  </div>`,
};
