import { expect, test, type Page } from '@playwright/test';

import {
  compileBridge,
  compileEntry,
  computedValue,
  MAT_SYS_STANDINS,
  matSys,
  matSysExtra,
  renderFixture,
} from './support/material-bridge-page';

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

test.describe('material-bridge rendered values: button-toggle', () => {
  const BUTTON_TOGGLE_CSS = [
    'projects/common/theming/components/cngx-button-toggle.css',
    'projects/common/interactive/button-toggle/button-toggle-group.component.css',
  ] as const;

  // The bridge routes the cngx foundation knobs (the leaf chrome reads no
  // component-level color token); the density chain runs through
  // density-bridge -> --cngx-space-* -> the SET-from-scale rule at the
  // toggle host. density: -2 maps sm -> 6px and md -> 12px.
  const BRIDGE_CSS = compileBridge('button-toggle-theme');
  const DENSITY_CSS = compileEntry(`
@use '@angular/material' as mat;
@use 'material/density-bridge' as cngx-density;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
  density: (scale: -2),
));

html { @include cngx-density.density($theme); }
`);

  const BUTTON_TOGGLE_HTML = `
<cngx-button-toggle-group class="cngx-button-toggle-group cngx-button-toggle-group--horizontal" role="radiogroup">
  <button id="toggle-checked" type="button" cngxbuttontoggle class="cngx-button-toggle cngx-button-toggle--checked" role="radio" aria-checked="true">Day</button>
  <button id="toggle-idle" type="button" cngxbuttontoggle class="cngx-button-toggle" role="radio" aria-checked="false">Week</button>
</cngx-button-toggle-group>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: BUTTON_TOGGLE_CSS,
      bridgeCss: BRIDGE_CSS + DENSITY_CSS,
      html: BUTTON_TOGGLE_HTML,
    });
  });

  test('the routed foundation knobs paint the idle segment', async ({ page }) => {
    expect(await computedValue(page, '#toggle-idle', 'background-color')).toBe(matSys('surface'));
    expect(await computedValue(page, '#toggle-idle', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#toggle-idle', 'border-top-color')).toBe(
      matSys('outline-variant'),
    );
  });

  test('the checked segment paints the primary pair', async ({ page }) => {
    expect(await computedValue(page, '#toggle-checked', 'background-color')).toBe(
      matSys('primary'),
    );
    expect(await computedValue(page, '#toggle-checked', 'color')).toBe(matSys('on-primary'));
    expect(await computedValue(page, '#toggle-checked', 'border-top-color')).toBe(
      matSys('primary'),
    );
  });

  test('the inherits:false padding token lands ON the toggle element via the density chain', async ({
    page,
  }) => {
    // The class of proof compileString structurally cannot give: the
    // registered (inherits: false, @property in cngx-button-toggle.css)
    // padding token must compute on the toggle itself - density-bridge sets
    // --cngx-space-sm/-md on html, the SET-from-scale rule at the toggle
    // host derives the padding token from it, and the paint carries it.
    // A bridged density fork would never land here (the :scope SET rule
    // out-specifies :where in the same layer), which is why the bridge
    // ships none.
    expect(
      await computedValue(page, '#toggle-idle', '--cngx-button-toggle-padding-block'),
    ).toBe('6px');
    expect(await computedValue(page, '#toggle-idle', 'padding-top')).toBe('6px');
    expect(await computedValue(page, '#toggle-idle', 'padding-left')).toBe('12px');
  });
});

test.describe('material-bridge rendered values: rating', () => {
  const RATING_CSS = ['projects/forms/input/rating/rating.component.css'] as const;
  const BRIDGE_CSS = compileBridge('rating-theme');

  // The :host block (spacing SETs, host layout) sits behind Angular's
  // emulated encapsulation and cannot match in a static fixture; every
  // assertion below runs on the class-based read sites, which apply as-is.
  const RATING_HTML = `
<cngx-rating id="rating">
  <span class="cngx-rating__items">
    <button id="star-idle" type="button" class="cngx-rating__item" role="radio" aria-checked="false">&#9733;</button>
    <button id="star-active" type="button" class="cngx-rating__item" role="radio" aria-checked="true">&#9733;</button>
  </span>
</cngx-rating>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: RATING_CSS,
      bridgeCss: BRIDGE_CSS,
      html: RATING_HTML,
    });
  });

  test('idle and active stars paint their Material roles', async ({ page }) => {
    expect(await computedValue(page, '#star-idle', 'color')).toBe(matSys('on-surface-variant'));
    expect(await computedValue(page, '#star-active', 'color')).toBe(matSys('primary'));
  });

  test('the focus-ring token reaches the item read site', async ({ page }) => {
    // Unregistered token: assigned on the cngx-rating host, inherits into
    // the item, where :focus-visible reads it for the outline.
    expect(await computedValue(page, '#star-idle', '--cngx-rating-focus-ring')).toBe(
      matSys('primary'),
    );
  });
});

test.describe('material-bridge rendered values: rating, disabled on the real component', () => {
  // The disabled class sits on the cngx-rating host, so the disabled rule is
  // a :host() selector that a static fixture cannot match (an unencapsulated
  // fixture once kept a dead descendant selector green). This block runs the
  // real story route, where the stylesheet is encapsulated as shipped, and
  // layers the system bridge, the rating bridge and the stand-ins on top.
  const SYSTEM_CSS = compileEntry(`
@use '@angular/material' as mat;
@use 'material/system-bridge' as cngx-system;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

html { @include cngx-system.theme($theme); }
`);
  const BRIDGE_CSS = compileBridge('rating-theme');

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/forms/input/rating/disabled');
    await page.locator('cngx-rating.cngx-rating--disabled').waitFor();
    await page.addStyleTag({ content: SYSTEM_CSS + BRIDGE_CSS });
    await page.addStyleTag({ content: MAT_SYS_STANDINS });
    await page.addStyleTag({
      content:
        '*, *::before, *::after { transition: none !important; animation: none !important; }',
    });
  });

  // Colour of a probe span appended next to the rating, so it resolves in the
  // same cascade context as the stars.
  async function probeColour(page: Page, color: string): Promise<string> {
    return page
      .locator('cngx-rating')
      .first()
      .evaluate((host, value) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        host.parentElement!.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      }, color);
  }

  async function starColours(page: Page): Promise<{ color: string; opacity: string }[]> {
    return page.locator('cngx-rating .cngx-rating__item').evaluateAll((items) =>
      items.map((item) => {
        let opacity = 1;
        for (let node: Element | null = item; node; node = node.parentElement) {
          opacity *= parseFloat(getComputedStyle(node).opacity);
        }
        return { color: getComputedStyle(item).color, opacity: String(opacity) };
      }),
    );
  }

  test('every star paints 38% of on-surface, not an opacity', async ({ page }) => {
    const expected = await probeColour(
      page,
      `color-mix(in oklab, ${matSys('on-surface')} 38%, transparent)`,
    );
    const stars = await starColours(page);
    expect(stars).toHaveLength(5);
    for (const star of stars) {
      expect(star).toEqual({ color: expected, opacity: '1' });
    }
  });

  test('every star reads GrayText under forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const gray = await probeColour(page, 'GrayText');
    expect(gray).not.toBe(await probeColour(page, 'CanvasText'));
    for (const star of await starColours(page)) {
      expect(star.color).toBe(gray);
    }
  });
});

test.describe('material-bridge rendered values: phone-input, disabled on the real component', () => {
  // The phone-input bridge is an intentional no-op: a disabled phone input
  // fades its country select and number input by the disabled field recipe,
  // which the system bridge maps to on-surface. The group host adds no fade
  // on top, so each part paints 38% on-surface at full opacity. Runs the real
  // story route, where the component styles are encapsulated as shipped.
  const SYSTEM_CSS = compileEntry(`
@use '@angular/material' as mat;
@use 'material/system-bridge' as cngx-system;

$theme: mat.define-theme((
  color: (theme-type: light, primary: mat.$azure-palette, tertiary: mat.$blue-palette),
));

html { @include cngx-system.theme($theme); }
`);
  const PARTS = [
    'cngx-phone-input .cngx-phone-input__number',
    'cngx-phone-input .cngx-phone-input__country .cngx-field-trigger',
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/forms/input/phone/disabled');
    await page.locator('cngx-phone-input.cngx-phone-input--disabled').waitFor();
    await page.addStyleTag({ content: SYSTEM_CSS + compileBridge('phone-input-theme') });
    await page.addStyleTag({ content: MAT_SYS_STANDINS });
    await page.addStyleTag({
      content:
        '*, *::before, *::after { transition: none !important; animation: none !important; }',
    });
  });

  // Colour of a probe span appended next to the phone input, so it resolves
  // in the same cascade context as the parts.
  async function probeColour(page: Page, color: string): Promise<string> {
    return page
      .locator('cngx-phone-input')
      .first()
      .evaluate((host, value) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        host.parentElement!.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      }, color);
  }

  async function paint(page: Page, selector: string): Promise<{ color: string; opacity: string }> {
    return page
      .locator(selector)
      .first()
      .evaluate((el) => {
        let opacity = 1;
        for (let node: Element | null = el; node; node = node.parentElement) {
          opacity *= parseFloat(getComputedStyle(node).opacity);
        }
        return { color: getComputedStyle(el).color, opacity: String(opacity) };
      });
  }

  test('both parts paint 38% of on-surface once, not an opacity', async ({ page }) => {
    const expected = await probeColour(
      page,
      `color-mix(in oklab, ${matSys('on-surface')} 38%, transparent)`,
    );
    for (const part of PARTS) {
      expect(await paint(page, part)).toEqual({ color: expected, opacity: '1' });
    }
  });

  test('both parts read GrayText under forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const gray = await probeColour(page, 'GrayText');
    expect(gray).not.toBe(await probeColour(page, 'CanvasText'));
    for (const part of PARTS) {
      expect((await paint(page, part)).color).toBe(gray);
    }
  });
});

test.describe('material-bridge rendered values: command-palette', () => {
  const PALETTE_CSS = [
    'projects/ui/command-palette/palette/command-palette.component.css',
    'projects/ui/command-palette/panel/command-panel.component.css',
  ] as const;
  const BRIDGE_CSS = compileBridge('command-palette-theme');

  // The dialog carries .cngx-command-palette and is a DOM descendant of the
  // cngx-command-palette host - top-layer promotion (showModal) does not
  // change ancestry, so the host-level :where() assignment must reach the
  // whole dialog subtree AND its ::backdrop (which inherits from the dialog
  // element). That placement is exactly what this block exists to prove.
  const PALETTE_HTML = `
<cngx-command-palette>
  <dialog id="palette" class="cngx-command-palette" aria-label="Command palette">
    <cngx-command-panel class="cngx-command-panel">
      <div class="cngx-command-panel-input-row">
        <span id="chip" class="cngx-command-scope-chip">Files</span>
        <input id="palette-input" class="cngx-command-panel-input" placeholder="Type a command" aria-label="Command search" />
      </div>
      <div class="cngx-command-panel-listbox" role="listbox" aria-label="Commands">
        <div id="group-header" class="cngx-command-group-header">Recent</div>
        <div id="row-active" class="cngx-command-row cngx-option--highlighted" role="option" aria-selected="true">
          <span class="cngx-command-row-label">Open <mark id="mark">set</mark>tings</span>
        </div>
        <div id="row-idle" class="cngx-command-row" role="option" aria-selected="false">
          <span class="cngx-command-row-label">Reload window</span>
        </div>
      </div>
      <footer id="palette-footer" class="cngx-command-footer">
        <span class="cngx-command-legend"><kbd id="kbd">Enter</kbd> to select</span>
      </footer>
    </cngx-command-panel>
  </dialog>
</cngx-command-palette>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: PALETTE_CSS,
      bridgeCss: BRIDGE_CSS,
      html: PALETTE_HTML,
    });
    await page.evaluate(() => {
      (document.getElementById('palette') as HTMLDialogElement).showModal();
    });
  });

  test('the modal surface paints the M3 dialog roles inside the open dialog', async ({ page }) => {
    expect(await computedValue(page, '#palette', 'background-color')).toBe(
      matSys('surface-container-high'),
    );
    expect(await computedValue(page, '#palette', 'border-top-color')).toBe(
      matSys('outline-variant'),
    );
    expect(await computedValue(page, '#palette', 'border-top-left-radius')).toBe(
      matSysExtra('corner-large'),
    );
    expect(await computedValue(page, '#palette-input', 'color')).toBe(matSys('on-surface'));
  });

  test('the active row paints the secondary-container pair inside the open dialog', async ({
    page,
  }) => {
    expect(await computedValue(page, '#row-active', 'background-color')).toBe(
      matSys('secondary-container'),
    );
    expect(await computedValue(page, '#row-active', 'color')).toBe(
      matSys('on-secondary-container'),
    );
    expect(await computedValue(page, '#row-idle', 'color')).toBe(matSys('on-surface'));
  });

  test('the sub-surfaces paint container tones', async ({ page }) => {
    expect(await computedValue(page, '#chip', 'background-color')).toBe(
      matSys('secondary-container'),
    );
    expect(await computedValue(page, '#kbd', 'background-color')).toBe(
      matSys('surface-container-highest'),
    );
    expect(await computedValue(page, '#mark', 'background-color')).toBe(
      matSys('tertiary-container'),
    );
  });

  test('the meta typography lands on the label scale', async ({ page }) => {
    expect(await computedValue(page, '#group-header', 'font-size')).toBe(
      matSysExtra('label-small-size'),
    );
    expect(await computedValue(page, '#group-header', 'font-weight')).toBe(
      matSysExtra('label-small-weight'),
    );
    expect(await computedValue(page, '#palette-footer', 'font-size')).toBe(
      matSysExtra('label-medium-size'),
    );
  });

  test('the backdrop token lands on the ::backdrop pseudo of the top-layer dialog', async ({
    page,
  }) => {
    // ::backdrop inherits from the originating dialog element, which in turn
    // inherits the unregistered token from the cngx-command-palette host -
    // the placement this bridge's MEDIUM risk rested on. The expected value
    // is computed in-page from the same color-mix() the bridge emits, so the
    // assertion is independent of each engine's color serialization.
    const { backdrop, expected } = await page.evaluate((scrim) => {
      const dialog = document.getElementById('palette') as HTMLDialogElement;
      const probe = document.createElement('div');
      probe.style.backgroundColor = `color-mix(in srgb, ${scrim} 32%, transparent)`;
      document.body.append(probe);
      const expectedColor = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        backdrop: getComputedStyle(dialog, '::backdrop').backgroundColor,
        expected: expectedColor,
      };
    }, matSys('scrim'));
    expect(backdrop).toBe(expected);
    // and not the un-themed fallback
    expect(backdrop).not.toBe('rgba(0, 0, 0, 0.4)');
  });
});
