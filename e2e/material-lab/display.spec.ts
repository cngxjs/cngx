import { expect, test, type Page } from '@playwright/test';

import { computedValue } from '../support/material-bridge-page';

// Display pairs of /material-lab/display: only the axes that measure equal
// against the Material twin are pinned. Every other axis is a numbered row in
// the material-fixes roadmap (items 11 to 16) and stays unpinned until fixed.
// The ripple and the unchecked toggle text also match without their component
// bridge (lab text colour, system bridge); their bridge reach is not proven
// here (roadmap items 12 and 16).

const mat = (pair: string, part = ''): string => `[data-pair=${pair}] .probe-mat ${part}`.trim();
const cngx = (pair: string, part = ''): string => `[data-pair=${pair}] .probe-cngx ${part}`.trim();

async function expectSame(
  page: Page,
  matSelector: string,
  cngxSelector: string,
  properties: readonly string[],
  matProperties: readonly string[] = properties,
): Promise<void> {
  for (const [i, property] of properties.entries()) {
    const expected = await computedValue(page, matSelector, matProperties[i]);
    expect(await computedValue(page, cngxSelector, property), `${cngxSelector} ${property}`).toBe(expected);
  }
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`material lab display pairs (${scheme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/#/material-lab/display');
      await expect(page.locator(cngx('badge', '.cngx-badge-indicator'))).toBeVisible();
      // The page links its bundle at runtime: read nothing before it is
      // parsed, then let the transitions it starts settle.
      await page.waitForFunction(() =>
        Array.from(document.styleSheets).some((sheet) => sheet.href?.endsWith('/material-lab-display-theme.css')),
      );
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished),
        ),
      );
    });

    test('badge: the error indicator matches mat-badge in colour, box and type', async ({ page }) => {
      await expectSame(page, mat('badge', '.mat-badge-content'), cngx('badge', '.cngx-badge-indicator'), [
        'background-color',
        'color',
        'width',
        'height',
        'border-top-left-radius',
        'padding-left',
        'font-size',
      ]);
    });

    test('button-toggle: the unchecked segment text matches mat-button-toggle', async ({ page }) => {
      await expectSame(
        page,
        mat('button-toggle', '.mat-button-toggle:not(.mat-button-toggle-checked) button'),
        cngx('button-toggle', 'button[aria-checked=false]'),
        ['color'],
      );
    });

    test('card: the surface, corner and body type match the raised mat-card', async ({ page }) => {
      await expectSame(page, mat('card'), cngx('card'), [
        'background-color',
        'color',
        'border-top-left-radius',
      ]);
      await expectSame(page, mat('card', '.mat-mdc-card-title'), cngx('card', '[cngxCardTitle]'), ['color']);
      await expectSame(page, mat('card', '.mat-mdc-card-content'), cngx('card', '[cngxCardBody]'), [
        'color',
        'font-size',
        'line-height',
        'font-weight',
      ]);
    });

    test('divider: the rule paints the mat-divider colour at 1px', async ({ page }) => {
      await expectSame(
        page,
        mat('divider'),
        cngx('divider'),
        ['background-color', 'height'],
        ['border-top-color', 'border-top-width'],
      );
    });

    test('tag: the label colour, weight and transparent surface match mat-chip', async ({ page }) => {
      await expectSame(page, mat('tag', '.mdc-evolution-chip__text-label'), cngx('tag'), [
        'color',
        'font-weight',
      ]);
      await expectSame(page, mat('tag'), cngx('tag'), ['background-color']);
    });

    test('ripple: the wave paints the on-surface colour of matRipple, round', async ({ page }) => {
      // matRipple carries its 10% in the colour alpha, cngx in an opacity
      // token (roadmap item 16): compare the colour channels only.
      const channels = (value: string): string =>
        value.startsWith('color(')
          ? value
              .replace(/^color\(srgb /, '')
              .split(' ')
              .slice(0, 3)
              .map((c) => Math.round(Number(c) * 255))
              .join(',')
          : (value.match(/\d+/g) ?? []).slice(0, 3).join(',');
      // Each wave is read while its own press is held: matRipple fades out as
      // soon as the pointer leaves its host.
      const pressAndRead = async (side: string, wave: string): Promise<[string, string]> => {
        const box = await page.locator(`[data-pair=ripple] ${side}`).boundingBox();
        expect(box).not.toBeNull();
        await page.mouse.move(box!.x + 20, box!.y + 20);
        await page.mouse.down();
        await expect(page.locator(wave)).toHaveCount(1);
        const read: [string, string] = [
          await computedValue(page, wave, 'background-color'),
          await computedValue(page, wave, 'border-top-left-radius'),
        ];
        await page.mouse.up();
        return read;
      };
      const [matColor, matRadius] = await pressAndRead('.probe-mat', mat('ripple', '.mat-ripple-element'));
      const [cngxColor, cngxRadius] = await pressAndRead('.probe-cngx', cngx('ripple', '.cngx-ripple__wave'));
      expect(channels(cngxColor)).toBe(channels(matColor));
      expect(cngxRadius).toBe(matRadius);
    });
  });
}

test('the display page links its own lab bundle and swaps it back on the lab', async ({ page }) => {
  const labLinks = (): Promise<string[]> =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('link[rel=stylesheet]'))
        .map((l) => l.getAttribute('href') ?? '')
        .filter((href) => href.includes('material-lab')),
    );
  await page.goto('/#/material-lab/display');
  await expect(page.locator(cngx('badge'))).toBeVisible();
  expect(await labLinks()).toEqual(['material-lab-display-theme.css']);

  await page.getByRole('link', { name: 'Forms and overlays' }).click();
  await expect(page.locator('mat-hint').first()).toBeVisible();
  expect(await labLinks()).toEqual(['material-lab-theme.css']);
});
