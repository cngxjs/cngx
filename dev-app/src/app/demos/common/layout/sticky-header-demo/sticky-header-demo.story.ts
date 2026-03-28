import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sticky Header',
  navLabel: 'StickyHeader',
  navCategory: 'layout',
  description:
    'Detects when a sticky-positioned element becomes stuck. Toggles a CSS class for shadow or style changes.',
  apiComponents: ['CngxStickyHeader'],
  overview:
    '<p><code>[cngxStickyHeader]</code> applies <code>position: sticky; top: 0</code> on the host and ' +
    'inserts an invisible sentinel element to detect when the header becomes stuck. ' +
    'Toggles the <code>cngx-sticky--active</code> CSS class and exposes <code>isSticky()</code> signal. ' +
    'Override z-index via <code>--cngx-sticky-z-index</code>.</p>',
  moduleImports: [
    "import { CngxStickyHeader } from '@cngx/common/layout';",
  ],
  sections: [
    {
      title: 'Sticky Header with Shadow',
      subtitle:
        'Scroll the container below. When the header becomes stuck, a box shadow appears via the <code>cngx-sticky--active</code> class.',
      imports: ['CngxStickyHeader'],
      template: `
  <div style="height:250px;overflow-y:auto;border:1px solid var(--cngx-border,#ddd);border-radius:8px">
    <div style="padding:16px">
      <p style="margin:0 0 8px;color:var(--cngx-text-secondary,#666);font-size:0.875rem">Scroll down to see the sticky header activate.</p>
    </div>
    <header cngxStickyHeader #sh="cngxStickyHeader"
            style="padding:12px 16px;background:var(--card-bg,#fff);transition:box-shadow 200ms ease;border-bottom:1px solid var(--cngx-border,#eee)"
            [style.box-shadow]="sh.isSticky() ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'">
      <strong>{{ sh.isSticky() ? 'Stuck!' : 'Header' }}</strong>
    </header>
    @for (i of [1,2,3,4,5,6,7,8,9,10,11,12]; track i) {
      <div style="padding:12px 16px;border-bottom:1px solid var(--cngx-border,#f0f0f0)">
        Item {{ i }}
      </div>
    }
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isSticky</span>
      <span class="event-value">{{ sh.isSticky() }}</span>
    </div>
  </div>`,
    },
  ],
};
