import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Highlight',
  navLabel: 'Highlight',
  navCategory: 'layout',
  description:
    'Search-text highlighting via <mark> elements. Safe text-node walking, no innerHTML.',
  apiComponents: ['CngxHighlight'],
  overview:
    '<p><code>[cngxHighlight]</code> wraps matching text in <code>&lt;mark&gt;</code> elements ' +
    'with correct native SR semantics. Case-insensitive by default. Original DOM restored on change or destroy.</p>',
  moduleImports: [
    "import { CngxHighlight } from '@cngx/common/layout';",
  ],
  setup: `
  protected readonly searchTerm = signal('');
  `,
  sections: [
    {
      title: 'Live Search Highlighting',
      subtitle:
        'Type a search term to see matches highlighted in real time. The <code>matchCount()</code> signal shows the number of matches.',
      imports: ['CngxHighlight'],
      template: `
  <div style="margin-bottom:12px">
    <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)"
           placeholder="Type to highlight..."
           style="padding:8px 12px;border:1px solid var(--cngx-border,#ddd);border-radius:6px;width:240px" />
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
    },
    {
      title: 'Multiple Paragraphs',
      subtitle:
        'Highlight works across nested elements — it walks all text nodes recursively.',
      imports: ['CngxHighlight'],
      template: `
  <div [cngxHighlight]="'angular'" #hl2="cngxHighlight"
       style="max-width:500px;font-size:0.9375rem">
    <p style="margin:0 0 8px"><strong>Angular</strong> is a platform for building web applications.</p>
    <p style="margin:0 0 8px">The Angular CLI makes it easy to create and maintain Angular apps.</p>
    <p style="margin:0">Use Angular with TypeScript for type safety.</p>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Matches for "angular"</span>
      <span class="event-value">{{ hl2.matchCount() }}</span>
    </div>
  </div>`,
    },
  ],
};
