import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHighlight: Live search highlighting',
  subtitle:
    'Type a search term to see matches highlighted in real time. The <code>matchCount()</code> signal exposes the number of matches.',
  description:
    'Binds [cngxHighlight] to a live search-term signal. Each keystroke walks the text nodes, restores the original DOM, and wraps matches in <mark>. The host directive exposes matchCount() for the count readout.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxHighlight'],
  moduleImports: ["import { CngxHighlight } from '@cngx/common/layout';"],
  imports: ['CngxHighlight'],
  setup: `protected readonly searchTerm = signal('');`,
  template: `  <div style="margin-bottom:12px;display:flex;flex-direction:column;gap:4px;max-width:240px">
    <label for="highlight-term" class="event-label">Search term</label>
    <input id="highlight-term"
           class="demo-highlight-input"
           [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)"
           placeholder="Type to highlight..." />
  </div>

  <div [cngxHighlight]="searchTerm()" #hl="cngxHighlight"
       class="demo-highlight-passage"
       style="max-width:500px">
    Angular Signals represent a fundamental shift in how we think about reactivity.
    Instead of subscribing to streams and manually managing subscriptions, signals
    provide a synchronous, pull-based model where derived values are automatically
    tracked and updated. This eliminates entire categories of bugs related to
    subscription leaks, stale closures, and timing issues.
  </div>`,
  css: `.demo-highlight-input {
  padding: 8px 12px;
  border: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #d0d5dd));
  border-radius: var(--cngx-radius-sm, 6px);
  background: var(--cngx-color-surface, var(--cngx-ex-surface, #ffffff));
  color: inherit;
  font: inherit;
}

.demo-highlight-passage {
  font-size: 0.9375rem;
  line-height: 1.8;
}

.demo-highlight-passage p {
  margin: 0 0 8px;
}

.demo-highlight-passage p:last-child {
  margin-bottom: 0;
}`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
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
