import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStickyHeader: Sticky header with shadow',
  subtitle:
    'Scroll the container below. When the header becomes stuck, the <code>cngx-sticky--active</code> host class fires and the demo style hooks the box shadow onto that class.',
  description:
    'Scrollable container with a sticky header that elevates once it is actually stuck. CngxStickyHeader inserts an invisible sentinel before the host and toggles `.cngx-sticky--active` when the sentinel leaves; the demo stylesheet binds the shadow to that class instead of style-binding inline.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxStickyHeader'],
  moduleImports: ["import { CngxStickyHeader } from '@cngx/common/layout';"],
  imports: ['CngxStickyHeader'],
  template: `  <div class="demo-sticky-frame">
    <div class="demo-sticky-intro">
      <p class="demo-sticky-hint">Scroll down to see the sticky header activate.</p>
    </div>
    <header cngxStickyHeader #sh="cngxStickyHeader" class="demo-sticky-header">
      <strong>{{ sh.isSticky() ? 'Stuck!' : 'Header' }}</strong>
    </header>
    @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
      <div class="demo-sticky-item">
        Item {{ i }}
      </div>
    }
  </div>`,
  css: `.demo-sticky-frame {
  height: 250px;
  overflow-y: auto;
  border: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #d0d5dd));
  border-radius: var(--cngx-radius-md, 8px);
}

.demo-sticky-intro {
  padding: 16px;
}

.demo-sticky-hint {
  margin: 0 0 8px;
  color: var(--cngx-color-text-muted, var(--cngx-ex-muted, #6b7280));
  font-size: 0.875rem;
}

.demo-sticky-header {
  padding: 12px 16px;
  background: var(--cngx-color-surface, var(--cngx-ex-surface, #ffffff));
  border-bottom: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #eaeaea));
  transition: box-shadow 200ms ease;
}

.demo-sticky-header.cngx-sticky--active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-sticky-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--cngx-color-border, var(--cngx-ex-border, #f0f0f0));
}`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isSticky</span>
      <span class="event-value">{{ sh.isSticky() }}</span>
    </div>
  </div>`,
};
