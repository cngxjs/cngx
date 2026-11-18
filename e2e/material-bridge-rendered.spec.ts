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
});
