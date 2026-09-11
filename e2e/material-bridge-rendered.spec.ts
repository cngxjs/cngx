import { expect, test } from '@playwright/test';

import { compileBridge, computedValue, matSys, renderFixture } from './support/material-bridge-page';

/**
 * Rendered-value tier for the Material bridges - one describe per family.
 * Proves in a real browser that a bridge token LANDS: (a) the custom property
 * computes to its `--mat-sys-*` stand-in on the read element, (b) the painted
 * property carries it. The compileString name contracts pin the emitted name
 * set and the text-level locks pin selector shapes, but neither can see the
 * cascade - jsdom ignores `@property`, so only this tier catches a token
 * assigned where its read site never receives it.
 */

// Firefox mis-scopes `:scope[attr]` rules across sibling @scope roots: with
// two roots, an earlier root's attribute rule paints a later sibling root.
// Verified with a minimal two-div repro (2026-09, Playwright 1.59 Firefox);
// Chromium and WebKit resolve it correctly. The component CSS under test is
// @scope-based throughout, so the whole tier skips Firefox.
test.skip(
  ({ browserName }) => browserName === 'firefox',
  'Firefox @scope sibling-root bug - see the header comment',
);

test.describe('material-bridge rendered values: timeline', () => {
  const TIMELINE_CSS = [
    'projects/common/timeline/timeline-tokens.css',
    'projects/common/timeline/connector.component.css',
    'projects/common/timeline/marker.component.css',
    'projects/common/timeline/timeline-item.component.css',
    'projects/ui/timeline/timeline.component.css',
  ] as const;

  // Shipped host classes + data attributes; the bridge assigns on
  // :where(cngx-timeline, cngx-timeline-item, cngx-timeline-marker,
  // cngx-timeline-connector), so the organism subtree and the standalone
  // atoms are both read sites.
  const TIMELINE_HTML = `
<cngx-timeline class="cngx-timeline">
  <div class="cngx-timeline__list">
    <section class="cngx-timeline__group">
      <h3 class="cngx-timeline__date-header">Today</h3>
      <div class="cngx-timeline__rows">
        <div class="cngx-timeline__item">
          <cngx-timeline-item class="cngx-timeline-item" data-status="active">
            <cngx-timeline-marker id="marker-active" class="cngx-timeline-marker" data-status="active"></cngx-timeline-marker>
            <cngx-timeline-connector id="connector-default" class="cngx-timeline-connector" data-position="first"></cngx-timeline-connector>
            <div class="cngx-timeline-item__content">Deploy started</div>
          </cngx-timeline-item>
        </div>
        <div class="cngx-timeline__item">
          <cngx-timeline-item class="cngx-timeline-item" data-status="done">
            <cngx-timeline-marker id="marker-done" class="cngx-timeline-marker" data-status="done"></cngx-timeline-marker>
            <cngx-timeline-connector id="connector-upcoming" class="cngx-timeline-connector" data-status="upcoming" data-position="last"></cngx-timeline-connector>
          </cngx-timeline-item>
        </div>
      </div>
    </section>
  </div>
</cngx-timeline>`;

  const BRIDGE_CSS = compileBridge('timeline-theme');

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: TIMELINE_CSS,
      bridgeCss: BRIDGE_CSS,
      html: TIMELINE_HTML,
    });
  });

  test('the connector color token computes to its stand-in on the read element', async ({
    page,
  }) => {
    // The bridge block (@layer cngx.components, on the host) must beat the
    // registered @property initial-value AND the :root chain from the tokens
    // stylesheet (@layer cngx.tokens).
    const token = await computedValue(page, '#connector-default', '--cngx-timeline-connector-color');
    expect(token).toBe(matSys('outline-variant'));
  });

  test('the themed rail color lands on the painted border', async ({ page }) => {
    // Vertical timeline in LTR: the rail is border-inline-start = left.
    const painted = await computedValue(page, '#connector-default', 'border-left-color');
    expect(painted).toBe(matSys('outline-variant'));
  });

  test('status recolours paint from Material roles', async ({ page }) => {
    // active marker: primary fill, on-primary glyph ink
    expect(await computedValue(page, '#marker-active', 'background-color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#marker-active', 'color')).toBe(matSys('on-primary'));
    // done marker: tertiary (M3's positive-accent stand-in; M3 has no success role)
    expect(await computedValue(page, '#marker-done', 'background-color')).toBe(matSys('tertiary'));
    // upcoming rail: outline
    expect(await computedValue(page, '#connector-upcoming', 'border-left-color')).toBe(
      matSys('outline'),
    );
  });

  test('an inherited token reaches a read site below the assignment host', async ({ page }) => {
    // The timeline family registers every token `inherits: true`, so its
    // landing proof is the host-to-descendant cascade (the inherits:false
    // placement class is exercised by the button-toggle block). The content
    // div and the date header carry no assignment of their own - the value
    // must arrive by inheritance from the bridged hosts.
    const inherited = await computedValue(
      page,
      '.cngx-timeline-item__content',
      '--cngx-timeline-text-color',
    );
    expect(inherited).toBe(matSys('on-surface'));
    expect(await computedValue(page, '.cngx-timeline__date-header', 'color')).toBe(
      matSys('on-surface-variant'),
    );
  });
});
