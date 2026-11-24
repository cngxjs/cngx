import { expect, test, type Page } from '@playwright/test';

import { computedValue } from '../support/material-bridge-page';

// Overlay and navigation pairs of /material-lab/overlay-nav: each overlay is
// opened on both sides and measured in its open state, after its transition.
// Only the axes that measure equal against the Material twin are pinned.
// Every other axis is a numbered row in the material-fixes roadmap (items 24
// to 27) and stays unpinned until fixed. Overlay panels live in the top layer
// or the CDK container, so they are addressed by their own class, not under
// the pair section.

const pair = (name: string, part: string): string => `[data-pair=${name}] ${part}`;

async function expectSame(
  page: Page,
  matSelector: string,
  cngxSelector: string,
  properties: readonly string[],
  matProperties: readonly string[] = properties,
): Promise<void> {
  for (const [i, property] of properties.entries()) {
    const expected = await computedValue(page, matSelector, matProperties[i]);
    expect(await computedValue(page, cngxSelector, property), `${cngxSelector} ${property}`).toBe(
      expected,
    );
  }
}

// A finished animation with fill: forwards stays in getAnimations() and its
// `finished` promise is already settled, so a loop over every finite
// animation spins forever on this page. Wait only for the ones still running.
// A transition restarted by a later style change rejects with AbortError and
// leaves a replacement behind, hence the loop.
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const running = (): Animation[] =>
      document
        .getAnimations()
        .filter(
          (a) =>
            a.playState !== 'finished' && a.effect?.getComputedTiming().iterations !== Infinity,
        );
    for (let pending = running(); pending.length > 0; pending = running()) {
      await Promise.all(pending.map((a) => a.finished.catch(() => undefined)));
    }
  });
}

/** Box of the element, rounded to 1/100 px. */
function box(page: Page, selector: string): Promise<{ w: number; h: number }> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 };
    });
}

/**
 * Rect of the visible text inside `textSelector` (Range over its last
 * non-empty text node), relative to the row `rowSelector`.
 */
function textRect(
  page: Page,
  rowSelector: string,
  textSelector: string,
): Promise<{ x: number; y: number; h: number }> {
  return page.evaluate(
    ([rowSel, textSel]) => {
      const row = document.querySelector(rowSel)!;
      const host = document.querySelector(textSel)!;
      const text = Array.from(host.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        .pop()!;
      const range = document.createRange();
      range.selectNodeContents(text);
      const r = range.getBoundingClientRect();
      const o = row.getBoundingClientRect();
      const round = (n: number): number => Math.round(n * 100) / 100;
      return { x: round(r.left - o.left), y: round(r.top - o.top), h: round(r.height) };
    },
    [rowSelector, textSelector] as const,
  );
}

/** Colour channels and alpha, so rgba() and color(srgb) compare as equals. */
function rgba(page: Page, color: string): Promise<string> {
  return page.evaluate((value) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data).join(',');
  }, color);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`material lab overlay and navigation pairs (${scheme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/#/material-lab/overlay-nav');
      await expect(page.locator(pair('nav-link', '.probe-cngx a')).first()).toBeVisible();
      // The page links its bundle at runtime: read nothing before it is
      // parsed, then let the transitions it starts settle.
      await page.waitForFunction(() =>
        Array.from(document.styleSheets).some((sheet) =>
          sheet.href?.endsWith('/material-lab-overlay-nav-theme.css'),
        ),
      );
      await settle(page);
    });

    test('tooltip: the open surface matches matTooltip in colour, box and type', async ({
      page,
    }) => {
      const matSurface = '.mat-mdc-tooltip .mdc-tooltip__surface';
      const cngxSurface = '.cngx-tooltip:popover-open';
      const props = [
        'background-color',
        'color',
        'font-size',
        'line-height',
        'font-weight',
        'letter-spacing',
        'padding-top',
        'padding-left',
        'border-top-left-radius',
      ];

      await page.hover(pair('tooltip', '.probe-mat-trigger'));
      // Visible is not open: mat-mdc-tooltip sits at scale(0) until the show
      // class starts its scale-in, and the box would be read scaled.
      await expect(page.locator('.mat-mdc-tooltip')).toHaveClass(/mat-mdc-tooltip-show/);
      await settle(page);
      const matValues = await Promise.all(props.map((p) => computedValue(page, matSurface, p)));
      const matBox = await box(page, matSurface);
      const matText = await textRect(page, matSurface, matSurface);
      await page.mouse.move(0, 0);
      await expect(page.locator(matSurface)).toHaveCount(0);

      await page.hover(pair('tooltip', '.probe-cngx-trigger'));
      await expect(page.locator(cngxSurface)).toBeVisible();
      await settle(page);
      for (const [i, p] of props.entries()) {
        expect(await computedValue(page, cngxSurface, p), `tooltip ${p}`).toBe(matValues[i]);
      }
      expect(await box(page, cngxSurface)).toEqual(matBox);
      expect(await textRect(page, cngxSurface, cngxSurface)).toEqual(matText);
    });

    test('context-menu: the open panel and its items match mat-menu in surface, shape, metrics and type', async ({
      page,
    }) => {
      const matPanel = '.mat-mdc-menu-panel';
      const matContent = `${matPanel} .mat-mdc-menu-content`;
      const matItem = `${matPanel} .mat-mdc-menu-item:nth-of-type(2)`;
      const cngxPanel = 'cngx-context-menu:popover-open';
      const cngxItem = `${cngxPanel} cngx-context-menu-item:nth-of-type(2)`;
      // Type is read where the label paints: mat-menu sets it on the text span,
      // the item host only carries the row.
      const matText = `${matItem} .mat-mdc-menu-item-text`;
      const cngxText = `${cngxItem} [cngxMenuItemLabel]`;
      // The panel paints surface, corner, shadow and border; Material pads the
      // list inside it (.mat-mdc-menu-content), cngx pads the panel itself.
      const panelProps = [
        'background-color',
        'border-top-left-radius',
        'border-bottom-right-radius',
        'box-shadow',
        'border-top-width',
        'min-width',
      ];
      const padProps = ['padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
      const itemProps = [
        'color',
        'padding-left',
        'padding-right',
        'border-top-left-radius',
        // Computed, not the box: WebKit can read the rect while the panel's
        // scale-in is still running.
        'height',
      ];
      const typeProps = [
        'font-family',
        'font-size',
        'line-height',
        'font-weight',
        'letter-spacing',
      ];

      await page.click(pair('context-menu', '.probe-mat-trigger'), { button: 'right' });
      await expect(page.locator(matPanel)).toBeVisible();
      await settle(page);
      const values = async (selector: string, props: readonly string[]): Promise<string[]> =>
        Promise.all(props.map((p) => computedValue(page, selector, p)));
      const matPanelValues = await values(matPanel, panelProps);
      const matPadValues = await values(matContent, padProps);
      const matItemValues = await values(matItem, itemProps);
      const matTypeValues = await values(matText, typeProps);
      await page.keyboard.press('Escape');
      await expect(page.locator(matPanel)).toHaveCount(0);

      await page.click(pair('context-menu', '.probe-cngx-trigger'), { button: 'right' });
      await expect(page.locator(cngxPanel)).toBeVisible();
      await settle(page);
      for (const [i, p] of panelProps.entries()) {
        expect(await computedValue(page, cngxPanel, p), `panel ${p}`).toBe(matPanelValues[i]);
      }
      for (const [i, p] of padProps.entries()) {
        expect(await computedValue(page, cngxPanel, p), `panel ${p}`).toBe(matPadValues[i]);
      }
      for (const [i, p] of itemProps.entries()) {
        expect(await computedValue(page, cngxItem, p), `item ${p}`).toBe(matItemValues[i]);
      }
      for (const [i, p] of typeProps.entries()) {
        expect(await computedValue(page, cngxText, p), `label ${p}`).toBe(matTypeValues[i]);
      }
    });

    test('popover-sheet: the open sheet matches mat-bottom-sheet in surface, corner, type and scrim', async ({
      page,
    }) => {
      const matSheet = '.mat-bottom-sheet-container';
      const cngxSheet = '.cngx-popover-sheet:popover-open';
      const props = [
        'background-color',
        'color',
        'border-top-left-radius',
        'border-top-right-radius',
        'padding-left',
        'font-size',
        'line-height',
        'font-weight',
      ];

      await page.click(pair('popover-sheet', '.probe-mat-trigger'));
      await expect(page.locator(matSheet)).toBeVisible();
      await settle(page);
      const matValues = await Promise.all(props.map((p) => computedValue(page, matSheet, p)));
      const matScrim = await rgba(
        page,
        await computedValue(page, '.cdk-overlay-backdrop', 'background-color'),
      );
      await page.keyboard.press('Escape');
      await expect(page.locator(matSheet)).toHaveCount(0);

      await page.click(pair('popover-sheet', '.probe-cngx-trigger'));
      await expect(page.locator(cngxSheet)).toBeVisible();
      await settle(page);
      for (const [i, p] of props.entries()) {
        expect(await computedValue(page, cngxSheet, p), `sheet ${p}`).toBe(matValues[i]);
      }
      const cngxScrim = await page
        .locator(cngxSheet)
        .evaluate((el) => getComputedStyle(el, '::backdrop').backgroundColor);
      expect(await rgba(page, cngxScrim)).toBe(matScrim);
    });

    test('nav-link: rows match the mat-nav-list item in fill, ink, height, shape and type', async ({
      page,
    }) => {
      const matRow = (n: number): string => pair('nav-link', `.probe-mat a:nth-child(${n})`);
      const cngxRow = (n: number): string => pair('nav-link', `.probe-cngx a:nth-child(${n})`);
      // Row 1 is the activated destination, row 2 a resting one.
      for (const n of [1, 2]) {
        await expectSame(page, matRow(n), cngxRow(n), [
          'background-color',
          'color',
          'border-top-left-radius',
        ]);
        expect(await box(page, cngxRow(n))).toEqual(await box(page, matRow(n)));
      }
      await expectSame(page, `${matRow(2)} .mdc-list-item__primary-text`, cngxRow(2), [
        'font-size',
        'line-height',
        'font-weight',
        'letter-spacing',
      ]);
      expect(await box(page, `${cngxRow(2)} cngx-icon`)).toEqual(
        await box(page, `${matRow(2)} mat-icon`),
      );
      expect(await textRect(page, cngxRow(2), cngxRow(2))).toEqual(
        await textRect(page, matRow(2), `${matRow(2)} .mdc-list-item__primary-text`),
      );
    });
  });
}

test('the overlay and navigation page links its own lab bundle', async ({ page }) => {
  await page.goto('/#/material-lab/overlay-nav');
  await expect(page.locator(pair('nav-link', '.probe-cngx a')).first()).toBeVisible();
  const labLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel=stylesheet]'))
      .map((l) => l.getAttribute('href') ?? '')
      .filter((href) => href.includes('material-lab')),
  );
  expect(labLinks).toEqual(['material-lab-overlay-nav-theme.css']);
});
