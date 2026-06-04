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
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isSticky</span>
      <span class="event-value">{{ sh.isSticky() }}</span>
    </div>
  </div>`,
};
