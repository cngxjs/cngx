import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
    const token = await computedValue(
      page,
      '#connector-default',
      '--cngx-timeline-connector-color',
    );
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

test.describe('material-bridge rendered values: checkbox box corner', () => {
  // The indicator SETs --cngx-checkbox-radius from --cngx-radius-sm in
  // cngx.tokens; the stand-in below plays the system bridge, which maps
  // radius-sm to corner-extra-small (4px). mat-checkbox draws a fixed 2px
  // box corner, so the bridge has to win over the derived 4px.
  const CHECKBOX_CSS = [
    'projects/common/display/checkbox-indicator/checkbox-indicator.component.css',
  ] as const;
  const SYSTEM_RADIUS = ':root { --cngx-radius-sm: 4px; }';
  const CHECKBOX_HTML = `
<cngx-checkbox-indicator class="cngx-checkbox-indicator cngx-checkbox-indicator--checkbox">
  <span id="box" class="cngx-checkbox-indicator__box"></span>
</cngx-checkbox-indicator>`;

  test('the bridge paints the 2px mat-checkbox corner on the box', async ({ page }) => {
    await renderFixture(page, {
      componentCss: CHECKBOX_CSS,
      bridgeCss: compileBridge('interactive-controls-theme') + SYSTEM_RADIUS,
      html: CHECKBOX_HTML,
    });
    expect(await computedValue(page, '#box', 'border-top-left-radius')).toBe('2px');
  });

  test('without the bridge the box follows the 4px radius scale', async ({ page }) => {
    await renderFixture(page, {
      componentCss: CHECKBOX_CSS,
      bridgeCss: SYSTEM_RADIUS,
      html: CHECKBOX_HTML,
    });
    expect(await computedValue(page, '#box', 'border-top-left-radius')).toBe('4px');
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

  test('the outer segment corners paint the Material group corner', async ({ page }) => {
    // The bridge routes the shape through --cngx-radius-md on the segment;
    // corner-extra-large has no stand-in, so the bridge fallback (28px) shows.
    expect(await computedValue(page, '#toggle-checked', 'border-top-left-radius')).toBe('28px');
    expect(await computedValue(page, '#toggle-idle', 'border-top-right-radius')).toBe('28px');
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
    expect(await computedValue(page, '#toggle-idle', '--cngx-button-toggle-padding-block')).toBe(
      '6px',
    );
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

  test('both parts read GrayText under forced colors', async ({ page, browserName }) => {
    // The disabled number input has no author GrayText rule; Chromium's
    // forced-colors repaint supplies it, emulated WebKit repaints nothing.
    test.skip(
      browserName !== 'chromium',
      'forced-colors system-colour resolution is asserted in Chromium only',
    );
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

test.describe('material-bridge rendered values: select family trigger chain', () => {
  // Every trigger background, color, border and layout token falls back to its
  // family token (--cngx-select-bg, --cngx-select-color, --cngx-select-border;
  // action-multi / reorderable
  // through their parent variant first). The bridge themes the trigger
  // through the family tokens alone: it broadcasts onto every descendant, so
  // a variant assignment would sit on the read element and cut the chain,
  // and a consumer family token would skip that variant.
  const VARIANTS = [
    ['cngx-select', 'single-select/select'],
    ['cngx-multi-select', 'multi-select/multi-select'],
    ['cngx-combobox', 'combobox/combobox'],
    ['cngx-typeahead', 'typeahead/typeahead'],
    ['cngx-tree-select', 'tree-select/tree-select'],
    ['cngx-reorderable-multi-select', 'reorderable-multi-select/reorderable-multi-select'],
    ['cngx-action-select', 'action-select/action-select'],
    ['cngx-action-multi-select', 'action-multi-select/action-multi-select'],
    ['cngx-select-shell', 'select-shell/select-shell'],
  ] as const;
  const SELECT_CSS = VARIANTS.map(([, file]) => `projects/forms/select/${file}.component.css`);
  const BRIDGE_CSS = compileBridge('select-theme');
  const SELECT_HTML = `
<div class="consumer-surface">
  ${VARIANTS.map(
    ([tag]) =>
      `<${tag} class="${tag}"><div id="${tag}-trigger" class="${tag}__trigger"></div></${tag}>`,
  ).join('\n  ')}
</div>`;
  const CONSUMER_BG = 'rgb(9, 8, 7)';
  const CONSUMER_COLOR = 'rgb(7, 8, 9)';
  const CONSUMER_BORDER = 'rgb(6, 5, 4)';

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: SELECT_CSS,
      bridgeCss: BRIDGE_CSS,
      html: SELECT_HTML,
    });
  });

  test('every trigger stays transparent under the bridge alone', async ({ page }) => {
    for (const [tag] of VARIANTS) {
      expect(await computedValue(page, `#${tag}-trigger`, 'background-color'), tag).toBe(
        'rgba(0, 0, 0, 0)',
      );
    }
  });

  test('a consumer --cngx-select-bg paints every variant trigger', async ({ page }) => {
    await page.addStyleTag({
      content: `.consumer-surface, .consumer-surface * { --cngx-select-bg: ${CONSUMER_BG}; }`,
    });
    for (const [tag] of VARIANTS) {
      expect(await computedValue(page, `#${tag}-trigger`, 'background-color'), tag).toBe(
        CONSUMER_BG,
      );
    }
  });

  test('every trigger text paints on-surface under the bridge alone', async ({ page }) => {
    for (const [tag] of VARIANTS) {
      expect(await computedValue(page, `#${tag}-trigger`, 'color'), tag).toBe(matSys('on-surface'));
    }
  });

  test('a consumer --cngx-select-color paints every variant trigger', async ({ page }) => {
    await page.addStyleTag({
      content: `.consumer-surface, .consumer-surface * { --cngx-select-color: ${CONSUMER_COLOR}; }`,
    });
    for (const [tag] of VARIANTS) {
      expect(await computedValue(page, `#${tag}-trigger`, 'color'), tag).toBe(CONSUMER_COLOR);
    }
  });

  test('every trigger border paints outline under the bridge alone', async ({ page }) => {
    for (const [tag] of VARIANTS) {
      expect(await computedValue(page, `#${tag}-trigger`, 'border-top-color'), tag).toBe(
        matSys('outline'),
      );
    }
  });

  test('a consumer --cngx-select-border paints every variant trigger', async ({ page }) => {
    await page.addStyleTag({
      content: `.consumer-surface, .consumer-surface * { --cngx-select-border: 1px solid ${CONSUMER_BORDER}; }`,
    });
    for (const [tag] of VARIANTS) {
      expect(await computedValue(page, `#${tag}-trigger`, 'border-top-color'), tag).toBe(
        CONSUMER_BORDER,
      );
    }
  });

  // The trigger layout tokens (min-height, padding, radius) chain the same
  // way, so the bridge's outlined-input metrics ride on the family tokens too.
  test('every trigger takes the outlined-input metrics under the bridge alone', async ({
    page,
  }) => {
    for (const [tag] of VARIANTS) {
      const trigger = `#${tag}-trigger`;
      expect(await computedValue(page, trigger, 'min-height'), tag).toBe('56px');
      expect(await computedValue(page, trigger, 'padding-top'), tag).toBe('0px');
      expect(await computedValue(page, trigger, 'padding-left'), tag).toBe('16px');
      expect(await computedValue(page, trigger, 'border-top-left-radius'), tag).toBe('4px');
    }
  });

  test('consumer family layout tokens reach every variant trigger', async ({ page }) => {
    await page.addStyleTag({
      content: `.consumer-surface, .consumer-surface * {
        --cngx-select-min-height: 61px;
        --cngx-select-padding: 3px 5px;
        --cngx-select-radius: 7px;
      }`,
    });
    for (const [tag] of VARIANTS) {
      const trigger = `#${tag}-trigger`;
      expect(await computedValue(page, trigger, 'min-height'), tag).toBe('61px');
      expect(await computedValue(page, trigger, 'padding-top'), tag).toBe('3px');
      expect(await computedValue(page, trigger, 'padding-left'), tag).toBe('5px');
      expect(await computedValue(page, trigger, 'border-top-left-radius'), tag).toBe('7px');
    }
  });

  // --cngx-select-option-padding is registered inherits: false and SET on
  // the option row by select-base.css, so the bridge value must land on the
  // row itself: an assignment on the panel or host never reaches it.
  test('the bridge option padding reaches the option rows', async ({ page }) => {
    await renderFixture(page, {
      componentCss: ['projects/forms/select/shared/select-base.css', ...SELECT_CSS],
      bridgeCss: BRIDGE_CSS,
      html: `
<cngx-select class="cngx-select">
  <div class="cngx-select__panel">
    <div id="option-in-host" class="cngx-select__option" role="option">Red</div>
  </div>
</cngx-select>
<div class="cngx-select__panel">
  <div id="option-in-panel" class="cngx-select__option" role="option">Red</div>
</div>`,
    });
    for (const option of ['#option-in-host', '#option-in-panel']) {
      expect(await computedValue(page, option, 'padding-top'), option).toBe('12px');
      expect(await computedValue(page, option, 'padding-left'), option).toBe('16px');
    }
  });

  test('the bridge focus offset reaches every variant trigger', async ({ page }) => {
    for (const [tag] of VARIANTS) {
      expect(await computedValue(page, `#${tag}-trigger`, '--cngx-select-focus-offset'), tag).toBe(
        '0px',
      );
    }
  });
});

test.describe('material-bridge rendered values: system and density bridge vs the root axes', () => {
  // The bridges assign on the theme host, the same <html> the root axis
  // providers reflect data-density / data-contrast onto. The axis rules live
  // in @layer cngx.theme and must win there; the colour mapping must still
  // beat every core token block (cngx.tokens, Block 2 included under OS dark).
  const AXIS_CSS = [
    'projects/core/theming/system-tokens.css',
    'projects/core/theming/density-tokens.css',
    'projects/core/theming/contrast-tokens.css',
  ] as const;

  const BRIDGE_CSS = compileEntry(`
@use '@angular/material' as mat;
@use 'material/system-bridge' as cngx-system;
@use 'material/density-bridge' as cngx-density;

$theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));

html {
  @include cngx-system.theme($theme);
  @include cngx-density.density($theme);
}
`);

  const HTML = `<div id="probe"></div><div id="reference" data-contrast="more"></div>`;

  async function render(page: Page, rootAttrs: Record<string, string> = {}): Promise<void> {
    await renderFixture(page, { componentCss: AXIS_CSS, bridgeCss: BRIDGE_CSS, html: HTML });
    await page.evaluate((attrs) => {
      for (const [name, value] of Object.entries(attrs)) {
        document.documentElement.setAttribute(name, value);
      }
    }, rootAttrs);
  }

  for (const scheme of ['light', 'dark'] as const) {
    test(`the colour bridge beats the core token blocks (${scheme} OS)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await render(page);
      expect(await computedValue(page, '#probe', '--cngx-color-surface')).toBe(matSys('surface'));
      expect(await computedValue(page, '#probe', '--cngx-color-text')).toBe(matSys('on-surface'));
    });
  }

  test('a root data-density beats the density bridge', async ({ page }) => {
    await render(page, { 'data-density': 'compact' });
    expect(await computedValue(page, '#probe', '--cngx-space-md')).toBe('8px');
  });

  test('a root data-contrast=more beats the border bridge', async ({ page }) => {
    await render(page, { 'data-contrast': 'more' });
    const boosted = await computedValue(page, '#reference', '--cngx-color-border');
    expect(boosted).not.toBe(matSys('outline-variant'));
    expect(await computedValue(page, '#probe', '--cngx-color-border')).toBe(boosted);
  });
});

test.describe('material-bridge rendered values: field metrics', () => {
  const FIELD_CSS = [
    'projects/core/theming/system-tokens.css',
    'projects/core/theming/density-tokens.css',
    'projects/core/theming/reset.css',
    'projects/core/theming/base.css',
    'projects/forms/theming/components/cngx-field-skin.css',
    'projects/forms/theming/components/cngx-field-affix.css',
  ] as const;

  // A lone outlined control, an outlined affix box and a lone fill control,
  // each in a field, plus a bare box child, which keeps the cngx compact box.
  const FIELD_HTML = `
<cngx-form-field><input id="lone" value="Ada" /></cngx-form-field>
<cngx-form-field>
  <span id="box" class="cngx-field-box" data-skin="outline">
    <input id="box-input" data-skin="bare" value="Ada" />
  </span>
</cngx-form-field>
<cngx-form-field><input id="fill" data-skin="fill" value="Ada" /></cngx-form-field>
<cngx-form-field>
  <span id="pre-box" class="cngx-field-box" data-skin="outline">
    <span class="cngx-field-prefix"><cngx-icon id="pre-icon"></cngx-icon></span>
    <input id="pre-input" data-skin="bare" value="Ada" />
  </span>
</cngx-form-field>
<cngx-form-field>
  <span id="suf-box" class="cngx-field-box" data-skin="outline">
    <input data-skin="bare" value="Ada" />
    <button id="suf" type="button" class="cngx-field-suffix cngx-field-affix--interactive">
      <cngx-icon id="suf-icon"></cngx-icon>
    </button>
  </span>
</cngx-form-field>`;

  // body-large is the control's type role; the line box decides the height.
  const TYPE_STANDINS = `:root {
  --mat-sys-body-large-font: sans-serif;
  --mat-sys-body-large-size: 16px;
  --mat-sys-body-large-weight: 400;
  --mat-sys-body-large-line-height: 24px;
  --mat-sys-body-large-tracking: 0.5px;
}
cngx-icon {
  display: block;
  inline-size: var(--cngx-icon-size);
  block-size: var(--cngx-icon-size);
}`;

  // No `html { }` wrapper around the include: the scoped skin rules must lose
  // to the bridge on specificity alone, as in a consumer's root include.
  const BRIDGE_CSS = compileBridge('field-theme');

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: FIELD_CSS, bridgeCss: BRIDGE_CSS, html: FIELD_HTML });
    await page.addStyleTag({ content: TYPE_STANDINS });
  });

  const height = (page: Page, id: string): Promise<number> =>
    page.locator(id).evaluate((el) => el.getBoundingClientRect().height);

  test('the lone outlined control stands 56px with 4px corners', async ({ page }) => {
    expect(await height(page, '#lone')).toBe(56);
    expect(await computedValue(page, '#lone', 'border-top-left-radius')).toBe('4px');
  });

  test('the outlined affix box stands 56px with 4px corners', async ({ page }) => {
    expect(await height(page, '#box')).toBe(56);
    expect(await computedValue(page, '#box', 'border-top-left-radius')).toBe('4px');
  });

  test('the fill control stands 56px and keeps its square bottom', async ({ page }) => {
    expect(await height(page, '#fill')).toBe(56);
    expect(await computedValue(page, '#fill', 'border-top-left-radius')).toBe('4px');
    expect(await computedValue(page, '#fill', 'border-bottom-left-radius')).toBe('0px');
  });

  // The box formula is line + 2 * padding + 2 * edge, so the padding has to
  // give back the edge the box actually draws, not a fixed 1px.
  // Offsets from the box's border edge, as matIconPrefix and a matIconButton
  // suffix sit in the mat-form-field text-field wrapper.
  const edges = (page: Page, box: string, part: string) =>
    page.evaluate(
      ([b, p]) => {
        const outer = document.querySelector(b)!.getBoundingClientRect();
        const inner = document.querySelector(p)!.getBoundingClientRect();
        return {
          start: inner.left - outer.left,
          end: outer.right - inner.right,
          width: inner.width,
        };
      },
      [box, part] as const,
    );

  test('a leading icon prefix sits like matIconPrefix', async ({ page }) => {
    const icon = await edges(page, '#pre-box', '#pre-icon');
    expect(icon.width).toBe(24);
    expect(icon.start).toBe(12);
    expect((await edges(page, '#pre-box', '#pre-input')).start).toBe(52);
    expect(await height(page, '#pre-box')).toBe(56);
  });

  test('a trailing icon button sits like a matIconButton suffix', async ({ page }) => {
    const button = await edges(page, '#suf-box', '#suf');
    expect(button.width).toBe(40);
    expect(button.end).toBe(0);
    const icon = await edges(page, '#suf-box', '#suf-icon');
    expect(icon.width).toBe(24);
    expect(icon.end).toBe(8);
    expect(await computedValue(page, '#suf', 'border-top-left-radius')).toBe('9999px');
    expect(await height(page, '#suf-box')).toBe(56);
  });

  test('the enabled icon button takes the affix colour', async ({ page }) => {
    const affix = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--cngx-field-affix-color)';
      document.querySelector('#suf-box')!.append(probe);
      return getComputedStyle(probe).color;
    });
    expect(await computedValue(page, '#suf', 'color')).toBe(affix);
  });

  test('box and fill keep 56px under a wider field edge', async ({ page }) => {
    await page.addStyleTag({ content: ':root { --cngx-field-border-width: 2px; }' });
    expect(await height(page, '#box')).toBe(56);
    expect(await height(page, '#fill')).toBe(56);
  });

  // The M3 input starts 16px from the text-field edge; the cngx edge sits
  // inside the box, so the inline padding gives it back as well.
  const textStart = (page: Page, host: string, control: string) =>
    page.evaluate(
      ([h, c]) => {
        const el = document.querySelector(c)!;
        const cs = getComputedStyle(el);
        const left =
          el.getBoundingClientRect().left +
          parseFloat(cs.paddingLeft) +
          parseFloat(cs.borderLeftWidth);
        return left - document.querySelector(h)!.getBoundingClientRect().left;
      },
      [host, control] as const,
    );

  test('the value starts 16px in from the edge', async ({ page }) => {
    expect(await textStart(page, '#lone', '#lone')).toBe(16);
    expect(await textStart(page, '#box', '#box-input')).toBe(16);
    expect(await textStart(page, '#fill', '#fill')).toBe(16);
  });

  test('box and fill keep the 16px start under a wider field edge', async ({ page }) => {
    await page.addStyleTag({ content: ':root { --cngx-field-border-width: 2px; }' });
    expect(await textStart(page, '#box', '#box-input')).toBe(16);
    expect(await textStart(page, '#fill', '#fill')).toBe(16);
  });
});

/**
 * Resolves a CSS color expression (a `color-mix()` over stand-ins) the way the
 * browser serializes it, so a mixed bridge token is compared against the same
 * mix and never against a hand-computed rgb() that rounds differently.
 */
function resolvedColor(page: Page, expression: string): Promise<string> {
  return page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.color = value;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, expression);
}

/**
 * corner-full stays out of MAT_SYS_EXTRAS: the field block pins the
 * matIconButton suffix at the 9999px fallback of field-theme.scss.
 */
const CORNER_FULL_STANDIN = '23px';

test.describe('material-bridge rendered values: avatar', () => {
  const AVATAR_CSS = ['projects/common/display/avatar/avatar.component.css'] as const;
  const BRIDGE_CSS = compileBridge('avatar-theme');

  const AVATAR_HTML = `<style>:root { --mat-sys-corner-full: ${CORNER_FULL_STANDIN}; }</style>
<cngx-avatar id="avatar-circle" class="cngx-avatar cngx-avatar--md cngx-avatar--circle">
  <span class="cngx-avatar__initials">AL</span>
  <span id="dot-online" class="cngx-avatar__status cngx-avatar__status--online"></span>
</cngx-avatar>
<cngx-avatar id="avatar-square" class="cngx-avatar cngx-avatar--lg cngx-avatar--square">
  <span class="cngx-avatar__initials">BK</span>
  <span id="dot-busy" class="cngx-avatar__status cngx-avatar__status--busy"></span>
</cngx-avatar>
<cngx-avatar class="cngx-avatar cngx-avatar--md cngx-avatar--circle">
  <span id="dot-away" class="cngx-avatar__status cngx-avatar__status--away"></span>
</cngx-avatar>
<cngx-avatar class="cngx-avatar cngx-avatar--md cngx-avatar--circle">
  <span id="dot-offline" class="cngx-avatar__status cngx-avatar__status--offline"></span>
</cngx-avatar>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: AVATAR_CSS,
      bridgeCss: BRIDGE_CSS,
      html: AVATAR_HTML,
    });
  });

  test('the plate paints the container-high pair', async ({ page }) => {
    expect(await computedValue(page, '#avatar-circle', 'background-color')).toBe(
      matSys('surface-container-high'),
    );
    expect(await computedValue(page, '#avatar-circle', 'color')).toBe(matSys('on-surface'));
  });

  test('the size rungs read the label and title scale on the host', async ({ page }) => {
    // inherits:false tokens: the bridge assigns them on the host, and the size
    // class reads them on the same element.
    expect(await computedValue(page, '#avatar-circle', 'font-size')).toBe(
      matSysExtra('label-large-size'),
    );
    expect(await computedValue(page, '#avatar-square', 'font-size')).toBe(
      matSysExtra('title-small-size'),
    );
  });

  test('both shapes paint the Material corner roles', async ({ page }) => {
    expect(await computedValue(page, '#avatar-circle', 'border-top-left-radius')).toBe(
      CORNER_FULL_STANDIN,
    );
    expect(await computedValue(page, '#avatar-square', 'border-top-left-radius')).toBe(
      matSysExtra('corner-medium'),
    );
  });

  test('every status dot paints its role and the surface ring', async ({ page }) => {
    expect(await computedValue(page, '#dot-online', 'background-color')).toBe(matSys('tertiary'));
    expect(await computedValue(page, '#dot-busy', 'background-color')).toBe(matSys('error'));
    expect(await computedValue(page, '#dot-offline', 'background-color')).toBe(matSys('outline'));
    expect(await computedValue(page, '#dot-away', 'background-color')).toBe(
      await resolvedColor(
        page,
        `color-mix(in srgb, ${matSys('tertiary')} 60%, ${matSys('error')} 40%)`,
      ),
    );
    expect(await computedValue(page, '#dot-online', 'border-top-color')).toBe(matSys('surface'));
  });
});

test.describe('material-bridge rendered values: status', () => {
  const STATUS_CSS = ['projects/common/display/status/status.component.css'] as const;
  const BRIDGE_CSS = compileBridge('status-theme');

  const STATUS_HTML = `
<cngx-status id="status-success" class="cngx-status cngx-status--success"><span class="cngx-status__dot"></span><span class="cngx-status__label">Operational</span></cngx-status>
<cngx-status id="status-warning" class="cngx-status cngx-status--warning"><span class="cngx-status__dot"></span></cngx-status>
<cngx-status id="status-danger" class="cngx-status cngx-status--danger"><span class="cngx-status__dot"></span></cngx-status>
<cngx-status id="status-info" class="cngx-status cngx-status--info"><span class="cngx-status__dot"></span></cngx-status>
<cngx-status id="status-neutral" class="cngx-status cngx-status--neutral"><span class="cngx-status__dot"></span></cngx-status>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: STATUS_CSS,
      bridgeCss: BRIDGE_CSS,
      html: STATUS_HTML,
    });
  });

  test('every tone dot paints its Material role', async ({ page }) => {
    const dot = (tone: string) => `#status-${tone} .cngx-status__dot`;
    expect(await computedValue(page, dot('success'), 'background-color')).toBe(matSys('tertiary'));
    expect(await computedValue(page, dot('warning'), 'background-color')).toBe(matSys('secondary'));
    expect(await computedValue(page, dot('danger'), 'background-color')).toBe(matSys('error'));
    expect(await computedValue(page, dot('info'), 'background-color')).toBe(matSys('primary'));
    expect(await computedValue(page, dot('neutral'), 'background-color')).toBe(matSys('outline'));
  });

  test('the label sits on the label-medium scale', async ({ page }) => {
    expect(await computedValue(page, '#status-success', 'font-size')).toBe(
      matSysExtra('label-medium-size'),
    );
    expect(await computedValue(page, '#status-success', 'font-weight')).toBe(
      matSysExtra('label-medium-weight'),
    );
  });
});

test.describe('material-bridge rendered values: segmented-progress', () => {
  const SEGMENTED_CSS = [
    'projects/common/display/segmented-progress/segmented-progress.css',
  ] as const;
  const BRIDGE_CSS = compileBridge('segmented-progress-theme');

  const SEGMENTED_HTML = `
<cngx-segmented-progress class="cngx-segmented-progress">
  <span id="seg-done" class="cngx-segmented-progress__segment" data-state="done"></span>
  <span id="seg-active" class="cngx-segmented-progress__segment" data-state="active"></span>
  <span id="seg-todo" class="cngx-segmented-progress__segment" data-state="todo"></span>
  <span id="seg-error" class="cngx-segmented-progress__segment" data-state="error"></span>
</cngx-segmented-progress>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: SEGMENTED_CSS,
      bridgeCss: BRIDGE_CSS,
      html: SEGMENTED_HTML,
    });
  });

  test('done, todo and error segments paint their Material roles', async ({ page }) => {
    expect(await computedValue(page, '#seg-done', 'background-color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#seg-todo', 'background-color')).toBe(
      matSys('surface-variant'),
    );
    expect(await computedValue(page, '#seg-error', 'background-color')).toBe(matSys('error'));
  });

  test('the active segment mixes the primary stand-in toward the surface', async ({ page }) => {
    // The fixture sets no --cngx-color-surface, so the read site falls back to
    // its literal white; the bridge only owns the primary side of the mix.
    expect(await computedValue(page, '#seg-active', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in oklab, ${matSys('primary')} 60%, oklch(1 0 0))`),
    );
  });
});

test.describe('material-bridge rendered values: password-strength-meter', () => {
  const METER_CSS = [
    'projects/common/display/password-strength-meter/password-strength-meter.css',
  ] as const;
  const BRIDGE_CSS = compileBridge('password-strength-meter-theme');

  const METER_HTML = `
<cngx-password-strength-meter id="meter-weak" class="cngx-password-strength-meter" data-strength="weak">
  <span id="weak-filled" class="cngx-password-strength-meter__segment" data-filled="true"></span>
  <span id="weak-empty" class="cngx-password-strength-meter__segment" data-filled="false"></span>
</cngx-password-strength-meter>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: METER_CSS,
      bridgeCss: BRIDGE_CSS,
      html: METER_HTML,
    });
  });

  test('a weak score paints error, the empty track surface-variant', async ({ page }) => {
    expect(await computedValue(page, '#weak-filled', 'background-color')).toBe(matSys('error'));
    expect(await computedValue(page, '#weak-empty', 'background-color')).toBe(
      matSys('surface-variant'),
    );
  });

  test('the fill token reaches the segment read site', async ({ page }) => {
    // Unregistered token, assigned on the host and inherited into the
    // segment, where the [data-filled] rule reads it.
    expect(
      await computedValue(page, '#weak-filled', '--cngx-password-strength-meter-fill-color'),
    ).toBe(matSys('primary'));
  });
});

test.describe('material-bridge rendered values: skeleton', () => {
  const SKELETON_CSS = ['projects/ui/skeleton/skeleton-container.css'] as const;
  const BRIDGE_CSS = compileBridge('skeleton-theme');

  const SKELETON_HTML = `
<cngx-skeleton class="cngx-skeleton cngx-skeleton--loading cngx-skeleton--shimmer">
  <div id="bone" class="cngx-skeleton__bone" style="block-size: 12px"></div>
</cngx-skeleton>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: SKELETON_CSS,
      bridgeCss: BRIDGE_CSS,
      html: SKELETON_HTML,
    });
  });

  test('the bone paints the container fill and the shimmer highlight', async ({ page }) => {
    expect(await computedValue(page, '#bone', 'background-color')).toBe(
      matSys('surface-container'),
    );
    const shimmer = await computedValue(page, '#bone', 'background-image');
    expect(shimmer).toContain(matSys('surface-container-high'));
    expect(shimmer).toContain(matSys('surface-container'));
  });
});

test.describe('material-bridge rendered values: empty-state', () => {
  const EMPTY_CSS = ['projects/ui/empty-state/empty-state.component.css'] as const;
  const BRIDGE_CSS = compileBridge('empty-state-theme');

  const EMPTY_HTML = `
<cngx-empty-state id="empty" class="cngx-empty-state">
  <div class="cngx-empty-state__icon-slot"></div>
  <svg id="empty-icon" class="cngx-empty-state__default-icon"></svg>
  <h3 id="empty-title" class="cngx-empty-state__title">No results</h3>
  <p id="empty-desc" class="cngx-empty-state__description">Try a different filter.</p>
</cngx-empty-state>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: EMPTY_CSS,
      bridgeCss: BRIDGE_CSS,
      html: EMPTY_HTML,
    });
  });

  test('body, icon and title paint the on-surface roles', async ({ page }) => {
    expect(await computedValue(page, '#empty', 'color')).toBe(matSys('on-surface-variant'));
    expect(await computedValue(page, '#empty-icon', 'color')).toBe(matSys('on-surface-variant'));
    expect(await computedValue(page, '#empty-title', 'color')).toBe(matSys('on-surface'));
  });

  test('the title and description take the title-medium and body-medium type', async ({
    page,
  }) => {
    expect(await computedValue(page, '#empty-title', 'font-size')).toBe(
      matSysExtra('title-medium-size'),
    );
    expect(await computedValue(page, '#empty-title', 'font-weight')).toBe(
      matSysExtra('title-medium-weight'),
    );
    expect(await computedValue(page, '#empty-desc', 'font-size')).toBe(
      matSysExtra('body-medium-size'),
    );
  });
});

test.describe('material-bridge rendered values: copy-block', () => {
  const COPY_CSS = ['projects/common/interactive/copy/copy-block.css'] as const;
  const BRIDGE_CSS = compileBridge('copy-block-theme');

  const COPY_HTML = `
<cngx-copy-block class="cngx-copy-block">
  <div class="cngx-copy-block__content"><code>npm install</code></div>
  <button id="copy-idle" type="button" class="cngx-copy-block__button">Copy</button>
</cngx-copy-block>
<cngx-copy-block class="cngx-copy-block">
  <div class="cngx-copy-block__content"><code>npm install</code></div>
  <button id="copy-done" type="button" class="cngx-copy-block__button cngx-copy-block__button--copied">Copied</button>
</cngx-copy-block>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: COPY_CSS,
      bridgeCss: BRIDGE_CSS,
      html: COPY_HTML,
    });
  });

  test('the idle button paints the on-surface tint and the outline-variant edge', async ({
    page,
  }) => {
    // inherits:false tokens: the broadcast assignment puts them on the button.
    expect(await computedValue(page, '#copy-idle', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('on-surface')} 6%, transparent)`),
    );
    expect(await computedValue(page, '#copy-idle', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#copy-idle', 'border-top-color')).toBe(
      matSys('outline-variant'),
    );
  });

  test('the copied button paints the tertiary set', async ({ page }) => {
    expect(await computedValue(page, '#copy-done', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('tertiary')} 12%, transparent)`),
    );
    expect(await computedValue(page, '#copy-done', 'border-top-color')).toBe(matSys('tertiary'));
    expect(await computedValue(page, '#copy-done', 'color')).toBe(matSys('tertiary'));
  });
});

test.describe('material-bridge rendered values: async-click', () => {
  const ASYNC_CSS = ['projects/common/theming/components/cngx-async.css'] as const;
  const BRIDGE_CSS = compileBridge('async-click-theme');

  const ASYNC_HTML = `
<button id="async-ok" type="button" class="cngx-async cngx-async--success" style="border: 1px solid">Save</button>
<button id="async-fail" type="button" class="cngx-async cngx-async--error" style="border: 1px solid">Save</button>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: ASYNC_CSS,
      bridgeCss: BRIDGE_CSS,
      html: ASYNC_HTML,
    });
  });

  test('the success state paints the primary set', async ({ page }) => {
    expect(await computedValue(page, '#async-ok', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('primary')} 12%, transparent)`),
    );
    expect(await computedValue(page, '#async-ok', 'color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#async-ok', 'border-top-color')).toBe(matSys('primary'));
  });

  test('the error state paints the error set', async ({ page }) => {
    expect(await computedValue(page, '#async-fail', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('error')} 12%, transparent)`),
    );
    expect(await computedValue(page, '#async-fail', 'color')).toBe(matSys('error'));
    expect(await computedValue(page, '#async-fail', 'border-top-color')).toBe(matSys('error'));
  });
});

test.describe('material-bridge rendered values: speak-button', () => {
  const SPEAK_CSS = ['projects/ui/speak/speak-button.css'] as const;
  const BRIDGE_CSS = compileBridge('speak-button-theme');

  const SPEAK_HTML = `
<cngx-speak-button class="cngx-speak-button">
  <button id="speak-idle" type="button" class="cngx-speak-button__btn"><svg id="speak-icon" class="cngx-speak-button__icon"></svg></button>
</cngx-speak-button>
<cngx-speak-button class="cngx-speak-button cngx-speak-button--speaking">
  <button id="speak-on" type="button" class="cngx-speak-button__btn"></button>
</cngx-speak-button>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: SPEAK_CSS,
      bridgeCss: BRIDGE_CSS,
      html: SPEAK_HTML,
    });
  });

  test('the resting button paints the container-low surface and variant ink', async ({ page }) => {
    expect(await computedValue(page, '#speak-idle', 'background-color')).toBe(
      matSys('surface-container-low'),
    );
    expect(await computedValue(page, '#speak-idle', 'color')).toBe(matSys('on-surface-variant'));
  });

  test('the resting edge paints the outline-variant role', async ({ page }) => {
    expect(await computedValue(page, '#speak-idle', 'border-top-color')).toBe(matSys('outline-variant'));
  });

  test('hover paints the container surface and the primary ink and edge', async ({ page }) => {
    await page.hover('#speak-idle');
    expect(await computedValue(page, '#speak-idle', 'background-color')).toBe(
      matSys('surface-container'),
    );
    expect(await computedValue(page, '#speak-idle', 'color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#speak-idle', 'border-top-color')).toBe(matSys('primary'));
  });

  test('the speaking state paints the primary pair', async ({ page }) => {
    expect(await computedValue(page, '#speak-on', 'background-color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#speak-on', 'color')).toBe(matSys('on-primary'));
  });

  test('the inherits:false icon size lands on the icon via the broadcast', async ({ page }) => {
    // 18px is the bridge's density-0 rung; the registered initial is 16px.
    expect(await computedValue(page, '#speak-icon', '--cngx-icon-svg-size')).toBe('18px');
  });
});

test.describe('material-bridge rendered values: file-drop', () => {
  const DROP_CSS = ['projects/forms/theming/components/cngx-file-drop.css'] as const;
  const BRIDGE_CSS = compileBridge('file-drop-theme');

  const DROP_HTML = `
<div id="drop-idle" class="cngx-file-drop">Drop files here</div>
<div id="drop-over" class="cngx-file-drop cngx-file-drop--dragging">Drop files here</div>
<div id="drop-done" class="cngx-file-drop cngx-file-drop--has-files">Drop files here</div>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: DROP_CSS,
      bridgeCss: BRIDGE_CSS,
      html: DROP_HTML,
    });
  });

  test('the idle zone paints the outline edge', async ({ page }) => {
    expect(await computedValue(page, '#drop-idle', 'border-top-color')).toBe(matSys('outline'));
  });

  test('the drag-over zone paints the primary edge and tint', async ({ page }) => {
    expect(await computedValue(page, '#drop-over', 'border-top-color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#drop-over', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('primary')} 5%, transparent)`),
    );
  });

  test('a zone with files paints the tertiary edge', async ({ page }) => {
    expect(await computedValue(page, '#drop-done', 'border-top-color')).toBe(matSys('tertiary'));
  });
});

/**
 * The chart layers ship their read rules as inline `styles` in the component
 * source, not as a stylesheet. Loaded verbatim from the source so the fixture
 * reads the shipped rules, never a copy.
 */
function inlineComponentStyles(path: string): string {
  const source = readFileSync(resolve(__dirname, '..', path), 'utf8');
  const match = /styles:\s*\[\s*`([\s\S]*?)`/.exec(source);
  if (!match) {
    throw new Error(`no inline styles in ${path}`);
  }
  return match[1];
}

test.describe('material-bridge rendered values: chart', () => {
  const CHART_CSS = ['projects/common/chart/chart-tokens.css'] as const;
  const LAYER_CSS = [
    'projects/common/chart/chart/chart.component.ts',
    'projects/common/chart/axis/axis.component.ts',
    'projects/common/chart/layers/line.component.ts',
    'projects/common/chart/layers/bar.component.ts',
  ]
    .map(inlineComponentStyles)
    .join('\n');
  const BRIDGE_CSS = compileBridge('chart-theme');
  // Plays the system bridge's success rung, which a color-scheme Material
  // theme leaves at the core value (themes-accepted-debt §4).
  const CORE_SUCCESS = 'rgb(211, 212, 213)';

  const CHART_HTML = `<style>:root { --cngx-color-success: ${CORE_SUCCESS}; }</style>
<cngx-chart id="chart">
  <svg width="200" height="100">
    <g class="cngx-axis">
      <line id="axis-line" class="cngx-axis__line" x1="0" y1="0" x2="100" y2="0"></line>
      <text id="tick-label" class="cngx-axis__tick-label" x="0" y="20">10</text>
      <line id="grid-line" class="cngx-axis__grid-line" x1="0" y1="40" x2="100" y2="40"></line>
    </g>
    <path id="line" class="cngx-line" d="M0 0 L10 10"></path>
    <rect id="bar" class="cngx-bar" width="10" height="10"></rect>
  </svg>
  <div id="fallback-error" class="cngx-chart__fallback cngx-chart__fallback--error">Error</div>
</cngx-chart>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: CHART_CSS, bridgeCss: BRIDGE_CSS, html: CHART_HTML });
    await page.addStyleTag({ content: LAYER_CSS });
  });

  test('the axis paints the variant ink, the text ink and the outline-variant grid', async ({
    page,
  }) => {
    expect(await computedValue(page, '#axis-line', 'stroke')).toBe(matSys('on-surface-variant'));
    expect(await computedValue(page, '#tick-label', 'fill')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#grid-line', 'stroke')).toBe(matSys('outline-variant'));
  });

  test('line and bar paint primary, the error fallback paints error', async ({ page }) => {
    expect(await computedValue(page, '#line', 'stroke')).toBe(matSys('primary'));
    expect(await computedValue(page, '#bar', 'fill')).toBe(matSys('primary'));
    expect(await computedValue(page, '#fallback-error', 'color')).toBe(matSys('error'));
  });

  test('the success series keeps the core success rung', async ({ page }) => {
    // The bridge maps no success role; the series must follow the system
    // rung, not a Material stand-in.
    expect(await computedValue(page, '#chart', '--cngx-chart-success')).toBe(CORE_SUCCESS);
  });
});

test.describe('material-bridge rendered values: chart-panel', () => {
  const PANEL_CSS = ['projects/ui/chart-panel/chart-panel.component.css'] as const;
  const BRIDGE_CSS = compileBridge('chart-panel-theme');

  const PANEL_HTML = `
<cngx-chart-panel id="panel" class="cngx-chart-panel">
  <h3 class="cngx-chart-panel__title">Revenue</h3>
  <span id="panel-subtitle" class="cngx-chart-panel__subtitle">Quarterly</span>
  <div id="panel-footer" class="cngx-chart-panel__footer">Source: ledger</div>
</cngx-chart-panel>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: PANEL_CSS, bridgeCss: BRIDGE_CSS, html: PANEL_HTML });
  });

  test('the panel paints the surface, its edge and the text ink', async ({ page }) => {
    expect(await computedValue(page, '#panel', 'background-color')).toBe(matSys('surface'));
    expect(await computedValue(page, '#panel', 'border-top-color')).toBe(matSys('outline-variant'));
    expect(await computedValue(page, '#panel', 'color')).toBe(matSys('on-surface'));
  });

  test('subtitle and footer paint the variant ink', async ({ page }) => {
    expect(await computedValue(page, '#panel-subtitle', 'color')).toBe(
      matSys('on-surface-variant'),
    );
    expect(await computedValue(page, '#panel-footer', 'color')).toBe(matSys('on-surface-variant'));
  });
});

test.describe('material-bridge rendered values: metric', () => {
  const METRIC_CSS = ['projects/common/data/display/metric/metric.component.css'] as const;
  const BRIDGE_CSS = compileBridge('metric-theme');

  const METRIC_HTML = `
<cngx-metric class="cngx-metric">
  <span id="metric-value" class="cngx-metric__value">1.2</span>
  <span id="metric-unit" class="cngx-metric__unit">M EUR</span>
</cngx-metric>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: METRIC_CSS,
      bridgeCss: BRIDGE_CSS,
      html: METRIC_HTML,
    });
  });

  test('the value paints on-surface on the headline-medium scale', async ({ page }) => {
    expect(await computedValue(page, '#metric-value', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#metric-value', 'font-size')).toBe(
      matSysExtra('headline-medium-size'),
    );
    expect(await computedValue(page, '#metric-value', 'font-weight')).toBe(
      matSysExtra('headline-medium-weight'),
    );
  });

  test('the unit paints the variant ink on the body-medium scale', async ({ page }) => {
    expect(await computedValue(page, '#metric-unit', 'color')).toBe(matSys('on-surface-variant'));
    expect(await computedValue(page, '#metric-unit', 'font-size')).toBe(
      matSysExtra('body-medium-size'),
    );
    expect(await computedValue(page, '#metric-unit', 'font-weight')).toBe(
      matSysExtra('body-medium-weight'),
    );
  });
});

test.describe('material-bridge rendered values: stat-card', () => {
  const STAT_CSS = ['projects/ui/stat-card/stat-card.component.css'] as const;
  const BRIDGE_CSS = compileBridge('stat-card-theme');

  const STAT_HTML = `
<cngx-stat-card class="cngx-stat-card">
  <div class="cngx-stat-card__stat cngx-stat-card__stat--skeleton">
    <span id="stat-bone" class="cngx-stat-card__skeleton-line cngx-stat-card__skeleton-line--value"></span>
  </div>
  <div class="cngx-stat-card__error cngx-empty-state">
    <span id="stat-error-icon" class="cngx-stat-card__error-icon"></span>
  </div>
  <div id="stat-stale" class="cngx-stat-card__stale">
    <span id="stat-glyph" class="cngx-stat-card__stale-glyph"></span>Showing last known value
  </div>
  <div id="stat-footer" class="cngx-stat-card__footer">Updated now</div>
</cngx-stat-card>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: STAT_CSS, bridgeCss: BRIDGE_CSS, html: STAT_HTML });
  });

  test('the footer paints the variant ink', async ({ page }) => {
    expect(await computedValue(page, '#stat-footer', 'color')).toBe(matSys('on-surface-variant'));
  });

  test('error and stale states paint the error set', async ({ page }) => {
    expect(await computedValue(page, '#stat-error-icon', 'color')).toBe(matSys('error'));
    expect(await computedValue(page, '#stat-stale', 'color')).toBe(matSys('error'));
    expect(await computedValue(page, '#stat-glyph', 'background-color')).toBe(matSys('error'));
    expect(await computedValue(page, '#stat-glyph', 'color')).toBe(matSys('on-error'));
  });

  test('the loading bone paints surface-variant', async ({ page }) => {
    expect(await computedValue(page, '#stat-bone', 'background-color')).toBe(
      matSys('surface-variant'),
    );
  });
});

test.describe('material-bridge rendered values: delta', () => {
  const DELTA_CSS = ['projects/common/data/display/delta/delta.component.css'] as const;
  const BRIDGE_CSS = compileBridge('delta-theme');

  const DELTA_HTML = `
<cngx-delta id="delta-up" class="cngx-delta cngx-delta--positive">+5.3%</cngx-delta>
<cngx-delta id="delta-down" class="cngx-delta cngx-delta--negative">-2.1%</cngx-delta>
<cngx-delta id="delta-flat" class="cngx-delta cngx-delta--neutral">0.0%</cngx-delta>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: DELTA_CSS, bridgeCss: BRIDGE_CSS, html: DELTA_HTML });
  });

  test('every sentiment paints its Material role', async ({ page }) => {
    // The positive rung is mapped to tertiary by the bridge, not left on the
    // core success text rung.
    expect(await computedValue(page, '#delta-up', 'color')).toBe(matSys('tertiary'));
    expect(await computedValue(page, '#delta-down', 'color')).toBe(matSys('error'));
    expect(await computedValue(page, '#delta-flat', 'color')).toBe(matSys('on-surface-variant'));
  });

  test('the figure sits on the label-medium scale', async ({ page }) => {
    expect(await computedValue(page, '#delta-up', 'font-size')).toBe(
      matSysExtra('label-medium-size'),
    );
    expect(await computedValue(page, '#delta-up', 'font-weight')).toBe(
      matSysExtra('label-medium-weight'),
    );
  });
});

test.describe('material-bridge rendered values: trend', () => {
  const TREND_CSS = ['projects/common/data/display/trend/trend.component.css'] as const;
  const BRIDGE_CSS = compileBridge('trend-theme');

  const TREND_HTML = `
<cngx-trend id="trend-up" class="cngx-trend cngx-trend--up">+5.3%</cngx-trend>
<cngx-trend id="trend-down" class="cngx-trend cngx-trend--down">-2.1%</cngx-trend>
<cngx-trend id="trend-flat" class="cngx-trend">0.0%</cngx-trend>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: TREND_CSS, bridgeCss: BRIDGE_CSS, html: TREND_HTML });
  });

  test('up, down and flat paint their Material roles', async ({ page }) => {
    expect(await computedValue(page, '#trend-up', 'color')).toBe(matSys('tertiary'));
    expect(await computedValue(page, '#trend-down', 'color')).toBe(matSys('error'));
    expect(await computedValue(page, '#trend-flat', 'color')).toBe(matSys('on-surface-variant'));
  });

  test('the figure sits on the label-medium scale', async ({ page }) => {
    expect(await computedValue(page, '#trend-up', 'font-size')).toBe(
      matSysExtra('label-medium-size'),
    );
    expect(await computedValue(page, '#trend-up', 'font-weight')).toBe(
      matSysExtra('label-medium-weight'),
    );
  });
});

test.describe('material-bridge rendered values: goal', () => {
  const GOAL_CSS = ['projects/common/data/display/goal/goal.component.css'] as const;
  const BRIDGE_CSS = compileBridge('goal-theme');

  const GOAL_HTML = `
<cngx-goal class="cngx-goal" style="--cngx-goal-fill: 73%">
  <span id="goal-track" class="cngx-goal__track"><span id="goal-fill" class="cngx-goal__fill"></span></span>
</cngx-goal>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: GOAL_CSS, bridgeCss: BRIDGE_CSS, html: GOAL_HTML });
  });

  test('the track paints surface-variant and the fill primary', async ({ page }) => {
    expect(await computedValue(page, '#goal-track', 'background-color')).toBe(
      matSys('surface-variant'),
    );
    expect(await computedValue(page, '#goal-fill', 'background-color')).toBe(matSys('primary'));
  });
});

test.describe('material-bridge rendered values: treetable', () => {
  const TREETABLE_CSS = ['projects/data-display/treetable/treetable.component.css'] as const;
  const BRIDGE_CSS = compileBridge('treetable-theme');

  const TREETABLE_HTML = `
<cngx-treetable class="cngx-treetable">
  <cdk-table>
    <cdk-header-row id="tt-header"><cdk-header-cell id="tt-header-cell">Unit</cdk-header-cell></cdk-header-row>
    <cdk-row id="tt-row"><cdk-cell id="tt-cell">Platform</cdk-cell></cdk-row>
    <cdk-row id="tt-hover" class="cngx-treetable__row--highlighted"><cdk-cell>Runtime</cdk-cell></cdk-row>
    <cdk-row id="tt-selected" class="cngx-treetable__row--selected"><cdk-cell>Tooling</cdk-cell></cdk-row>
  </cdk-table>
</cngx-treetable>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: TREETABLE_CSS,
      bridgeCss: BRIDGE_CSS,
      html: TREETABLE_HTML,
    });
  });

  test('header, cells and row edge paint their Material roles', async ({ page }) => {
    expect(await computedValue(page, '#tt-header', 'background-color')).toBe(
      matSys('surface-container'),
    );
    expect(await computedValue(page, '#tt-header-cell', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#tt-cell', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#tt-row', 'border-bottom-color')).toBe(
      matSys('outline-variant'),
    );
  });

  test('the highlighted and selected rows paint the state layers', async ({ page }) => {
    expect(await computedValue(page, '#tt-hover', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('on-surface')} 4%, transparent)`),
    );
    expect(await computedValue(page, '#tt-selected', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('primary')} 12%, transparent)`),
    );
  });
});

test.describe('material-bridge rendered values: incremental-list', () => {
  const LIST_CSS = ['projects/ui/collection/incremental-list.component.css'] as const;
  const BRIDGE_CSS = compileBridge('incremental-list-theme');

  const LIST_HTML = `
<cngx-incremental-list id="list-card" class="cngx-incremental-list" data-skin="card">
  <div class="cngx-incremental-list__items">
    <div id="list-item" class="cngx-incremental-list__item">Ada</div>
    <div class="cngx-incremental-list__item">Grace</div>
  </div>
  <p id="list-message" class="cngx-incremental-list__message">All 2 loaded</p>
</cngx-incremental-list>
<cngx-incremental-list class="cngx-incremental-list" data-skin="plain">
  <div class="cngx-incremental-list__inline-error">
    <span id="list-error" class="cngx-incremental-list__error-text">Could not load</span>
    <button id="list-retry" type="button" class="cngx-incremental-list__retry">Retry</button>
  </div>
</cngx-incremental-list>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, { componentCss: LIST_CSS, bridgeCss: BRIDGE_CSS, html: LIST_HTML });
  });

  test('the card skin paints the surface, the divider and the text ink', async ({ page }) => {
    expect(await computedValue(page, '#list-card', 'background-color')).toBe(matSys('surface'));
    expect(await computedValue(page, '#list-card', 'border-top-color')).toBe(
      matSys('outline-variant'),
    );
    expect(await computedValue(page, '#list-item', 'border-bottom-color')).toBe(
      matSys('outline-variant'),
    );
    expect(await computedValue(page, '#list-card', 'color')).toBe(matSys('on-surface'));
  });

  test('message, error and retry paint their Material roles', async ({ page }) => {
    expect(await computedValue(page, '#list-message', 'color')).toBe(matSys('on-surface-variant'));
    expect(await computedValue(page, '#list-error', 'color')).toBe(matSys('error'));
    expect(await computedValue(page, '#list-retry', 'color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#list-retry', 'border-top-color')).toBe(matSys('outline'));
  });
});

test.describe('material-bridge rendered values: filter-builder', () => {
  const BUILDER_CSS = [
    'projects/forms/filter-builder/filter-builder.component.css',
    'projects/forms/filter-builder/filter-builder-row.component.css',
  ] as const;
  const BRIDGE_CSS = compileBridge('filter-builder-theme');

  const BUILDER_HTML = `
<cngx-filter-builder id="builder">
  <p id="fb-empty" class="cngx-filter-builder__empty">No filters defined</p>
  <cngx-filter-row>
    <span class="cngx-filter-expression-incomplete"><input id="fb-incomplete" cngxInput /></span>
  </cngx-filter-row>
  <div id="fb-negated" class="cngx-filter-builder__group cngx-filter-group-negated"></div>
  <button id="fb-add" type="button" class="cngx-filter-builder__action-button cngx-filter-builder__action-button--add-filter">Add filter</button>
  <button id="fb-remove" type="button" class="cngx-filter-builder__action-button cngx-filter-builder__action-button--remove">Remove</button>
</cngx-filter-builder>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: BUILDER_CSS,
      bridgeCss: BRIDGE_CSS,
      html: BUILDER_HTML,
    });
  });

  test('the empty note paints the variant ink', async ({ page }) => {
    expect(await computedValue(page, '#fb-empty', 'color')).toBe(matSys('on-surface-variant'));
  });

  test('the action button paints the primary ink and the outline-variant edge', async ({
    page,
  }) => {
    expect(await computedValue(page, '#fb-add', 'color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#fb-add', 'border-top-color')).toBe(
      matSys('outline-variant'),
    );
  });

  test('the resting action button paints the surface role', async ({ page }) => {
    expect(await computedValue(page, '#fb-add', 'background-color')).toBe(matSys('surface'));
  });

  test('the remove button paints the error role', async ({ page }) => {
    expect(await computedValue(page, '#fb-remove', 'color')).toBe(matSys('error'));
  });

  test('hover paints the container surface', async ({ page }) => {
    await page.hover('#fb-add');
    expect(await computedValue(page, '#fb-add', 'background-color')).toBe(
      matSys('surface-container'),
    );
  });

  test('an incomplete expression paints the tertiary edge', async ({ page }) => {
    expect(await computedValue(page, '#fb-incomplete', 'border-bottom-color')).toBe(
      matSys('tertiary'),
    );
  });

  test('a negated group paints the outline-variant edge', async ({ page }) => {
    expect(await computedValue(page, '#fb-negated', 'border-left-color')).toBe(
      matSys('outline-variant'),
    );
  });
});

test.describe('material-bridge rendered values: backdrop', () => {
  const BACKDROP_CSS = [
    'projects/common/theming/components/cngx-backdrop.css',
    'projects/common/theming/components/cngx-drawer.css',
  ] as const;
  const BRIDGE_CSS = compileBridge('backdrop-theme');

  const BACKDROP_HTML = `
<div id="backdrop" cngxBackdrop class="cngx-backdrop cngx-backdrop--visible"></div>
<div id="drawer" class="cngx-drawer"></div>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: BACKDROP_CSS,
      bridgeCss: BRIDGE_CSS,
      html: BACKDROP_HTML,
    });
  });

  test('the visible backdrop paints the scrim at 32%', async ({ page }) => {
    expect(await computedValue(page, '#backdrop', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('scrim')} 32%, transparent)`),
    );
  });

  test('the drawer scrim falls back to the bridged backdrop colour', async ({ page }) => {
    const scrim = await page
      .locator('#drawer')
      .evaluate((el) => getComputedStyle(el, '::after').backgroundColor);
    expect(scrim).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('scrim')} 32%, transparent)`),
    );
  });
});

test.describe('material-bridge rendered values: toc', () => {
  const TOC_CSS = ['projects/ui/toc/toc.component.css'] as const;
  const BRIDGE_CSS = compileBridge('toc-theme');

  const TOC_HTML = `
<cngx-toc>
  <nav class="cngx-toc__nav" aria-label="On this page">
    <ul class="cngx-toc__list">
      <li class="cngx-toc__item" data-active-trail>
        <a id="toc-trail" class="cngx-toc__link" href="#install">Installation</a>
        <ul class="cngx-toc__list">
          <li class="cngx-toc__item"><a id="toc-active" class="cngx-toc__link" href="#npm" aria-current="location">Using npm</a></li>
        </ul>
      </li>
      <li class="cngx-toc__item"><a id="toc-rest" class="cngx-toc__link" href="#usage">Usage</a></li>
    </ul>
  </nav>
</cngx-toc>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: TOC_CSS,
      bridgeCss: BRIDGE_CSS,
      html: TOC_HTML,
    });
  });

  test('a resting link paints the variant ink', async ({ page }) => {
    expect(await computedValue(page, '#toc-rest', 'color')).toBe(matSys('on-surface-variant'));
  });

  test('the current link paints the primary ink and rail', async ({ page }) => {
    expect(await computedValue(page, '#toc-active', 'color')).toBe(matSys('primary'));
    expect(await computedValue(page, '#toc-active', 'border-left-color')).toBe(matSys('primary'));
  });

  test('the active trail paints the on-surface ink', async ({ page }) => {
    expect(await computedValue(page, '#toc-trail', 'color')).toBe(matSys('on-surface'));
  });

  test('hover paints the on-surface ink', async ({ page }) => {
    await page.hover('#toc-rest');
    expect(await computedValue(page, '#toc-rest', 'color')).toBe(matSys('on-surface'));
  });

  test('keyboard focus draws the primary ring', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator('#toc-trail')).toBeFocused();
    expect(await computedValue(page, '#toc-trail', 'outline-color')).toBe(matSys('primary'));
  });
});

test.describe('material-bridge rendered values: nav-rail theme()', () => {
  const RAIL_CSS = [
    'projects/common/theming/components/cngx-nav.css',
    'projects/ui/nav-rail/nav-rail.css',
  ] as const;
  const BRIDGE_CSS = compileBridge('nav-rail-theme');

  // Rows without an icon draw their initial, so no icon stylesheet is needed.
  const rows = (prefix: string): string => `
    <a id="${prefix}-active" class="cngx-nav-link cngx-nav-link--active" href="#" aria-current="page" data-initial="I">Inbox</a>
    <a id="${prefix}-rest" class="cngx-nav-link" href="#" data-initial="S">Starred</a>`;

  const RAIL_HTML = `<style>:root { --mat-sys-corner-full: ${CORNER_FULL_STANDIN}; }</style>
<cngx-nav-rail id="rail-end" class="cngx-nav-rail" data-label-placement="end" data-side="start">
  <div id="rail-header" class="cngx-nav-header">Mail</div>
  <div class="cngx-nav-rail__body">
    ${rows('end')}
    <button id="end-group" type="button" cngxNavGroup class="cngx-nav-group" data-initial="M">More</button>
    <div id="flyout" class="cngx-nav-group-content" popover="manual">
      <div><a class="cngx-nav-link" href="#" style="--cngx-nav-depth: 1">History</a></div>
    </div>
  </div>
</cngx-nav-rail>
<cngx-nav-rail id="rail-below" class="cngx-nav-rail" data-label-placement="below" data-side="start">
  <div class="cngx-nav-rail__body">${rows('below')}</div>
</cngx-nav-rail>`;

  test.beforeEach(async ({ page }) => {
    await renderFixture(page, {
      componentCss: RAIL_CSS,
      bridgeCss: BRIDGE_CSS,
      html: RAIL_HTML,
    });
  });

  test('the rail paints the surface pair with no divider', async ({ page }) => {
    expect(await computedValue(page, '#rail-end', 'background-color')).toBe(matSys('surface'));
    expect(await computedValue(page, '#rail-end', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#rail-end', 'border-right-width')).toBe('0px');
  });

  test('rows paint the list item roles and the full pill', async ({ page }) => {
    expect(await computedValue(page, '#end-active', 'background-color')).toBe(
      matSys('secondary-container'),
    );
    expect(await computedValue(page, '#end-active', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#end-rest', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#end-rest', 'border-top-left-radius')).toBe(
      CORNER_FULL_STANDIN,
    );
  });

  test('a hovered row paints the on-surface state layer', async ({ page }) => {
    await page.hover('#end-rest');
    expect(await computedValue(page, '#end-rest', 'background-color')).toBe(
      await resolvedColor(page, `color-mix(in srgb, ${matSys('on-surface')} 8%, transparent)`),
    );
  });

  test('the stacked look paints the active pill and the label-medium label', async ({ page }) => {
    const pill = await page
      .locator('#below-active')
      .evaluate((el) => getComputedStyle(el, '::after').backgroundColor);
    expect(pill).toBe(matSys('secondary-container'));
    expect(await computedValue(page, '#below-active', 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(await computedValue(page, '#below-rest', 'font-size')).toBe(
      matSysExtra('label-medium-size'),
    );
  });

  test('the header slot paints the container-low surface and the outline-variant edge', async ({
    page,
  }) => {
    expect(await computedValue(page, '#rail-header', 'background-color')).toBe(
      matSys('surface-container-low'),
    );
    expect(await computedValue(page, '#rail-header', 'border-bottom-color')).toBe(
      matSys('outline-variant'),
    );
    expect(await computedValue(page, '#rail-header', 'font-size')).toBe(
      matSysExtra('title-small-size'),
    );
  });

  test('the open flyout paints the menu container, edge and corner', async ({ page }) => {
    await page.locator('#flyout').evaluate((el) => (el as HTMLElement).showPopover());
    expect(await computedValue(page, '#flyout', 'background-color')).toBe(
      matSys('surface-container'),
    );
    expect(await computedValue(page, '#flyout', 'color')).toBe(matSys('on-surface'));
    expect(await computedValue(page, '#flyout', 'border-top-color')).toBe(
      matSys('outline-variant'),
    );
    expect(await computedValue(page, '#flyout', 'border-top-left-radius')).toBe(
      matSysExtra('corner-medium'),
    );
  });
});
