import { expect, test, type Page } from '@playwright/test';

import { computedValue } from '../support/material-bridge-page';

// Display pairs of /material-lab/display: only the axes that measure equal
// against the Material twin are pinned. Every other axis is a numbered row in
// the material-fixes roadmap (items 11 to 16) and stays unpinned until fixed.
// The unchecked toggle text also matches without its component bridge (system
// bridge); the group corner pin carries the button-toggle.theme proof. The ripple
// wave follows currentColor by design (the bridge sets no colour), so the colour
// pin proves the M3 rule "state layer = content colour"; the peak opacity pin
// carries the ripple.theme proof.

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
      // A transition restarted by a later style change rejects its finished
      // promise with AbortError and leaves a replacement behind, so wait in a
      // loop until no finite animation is left.
      await page.evaluate(async () => {
        const finite = (): Animation[] =>
          document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
        for (let pending = finite(); pending.length > 0; pending = finite()) {
          await Promise.all(pending.map((a) => a.finished.catch(() => undefined)));
        }
      });
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
        'font-weight',
        'line-height',
      ]);
    });

    test('badge: the indicator overhangs its host like mat-badge', async ({ page }) => {
      // mat-badge sits 4px outside the top end corner; cngx translated half
      // its size out before the bridge wrote the offset.
      const overhang = (host: string, indicator: string) =>
        page.evaluate(
          ([h, i]) => {
            const hostRect = document.querySelector(h)!.getBoundingClientRect();
            const rect = document.querySelector(i)!.getBoundingClientRect();
            return { top: rect.top - hostRect.top, end: rect.right - hostRect.right };
          },
          [host, indicator] as const,
        );
      expect(await overhang(cngx('badge'), cngx('badge', '.cngx-badge-indicator'))).toEqual(
        await overhang(mat('badge'), mat('badge', '.mat-badge-content')),
      );
    });

    test('button-toggle: the visible outer corner matches mat-button-toggle-group', async ({ page }) => {
      // mat clips its segments with the group corner; cngx paints the outer
      // corners on the first and last segment, the group itself paints nothing.
      await expectSame(
        page,
        mat('button-toggle'),
        cngx('button-toggle', 'button:first-child'),
        ['border-top-left-radius', 'border-bottom-left-radius'],
        ['border-top-left-radius', 'border-bottom-left-radius'],
      );
      await expectSame(
        page,
        mat('button-toggle'),
        cngx('button-toggle', 'button:last-child'),
        ['border-top-right-radius', 'border-bottom-right-radius'],
      );
    });

    test('button-toggle: the unchecked segment text matches mat-button-toggle', async ({ page }) => {
      await expectSame(
        page,
        mat('button-toggle', '.mat-button-toggle:not(.mat-button-toggle-checked) button'),
        cngx('button-toggle', 'button[aria-checked=false]'),
        ['color'],
      );
    });

    test('button-toggle: the group height and edge match mat-button-toggle-group', async ({ page }) => {
      // mat draws one 1px outline around 40px segments; cngx draws it on each
      // segment, so the group box is 42px on both sides.
      const height = (sel: string) => page.locator(sel).evaluate((el) => el.getBoundingClientRect().height);
      expect(await height(cngx('button-toggle'))).toBe(await height(mat('button-toggle')));
      await expectSame(
        page,
        mat('button-toggle'),
        cngx('button-toggle', 'button[aria-checked=false]'),
        ['border-top-color'],
      );
    });

    test('button-toggle: the checked segment paints the mat secondary-container pair', async ({ page }) => {
      await expectSame(
        page,
        mat('button-toggle', '.mat-button-toggle-checked'),
        cngx('button-toggle', 'button[aria-checked=true]'),
        ['background-color', 'color'],
      );
      await expectSame(
        page,
        mat('button-toggle'),
        cngx('button-toggle', 'button[aria-checked=true]'),
        ['border-top-color'],
      );
    });

    test('button-toggle: the label sits at the mat inset in label-large type', async ({ page }) => {
      // mat pads the label content, cngx the segment; the text paints in
      // both with the tracking the inner button resets to normal.
      await expectSame(
        page,
        mat('button-toggle', '.mat-button-toggle:not(.mat-button-toggle-checked) .mat-button-toggle-label-content'),
        cngx('button-toggle', 'button[aria-checked=false]'),
        ['padding-left', 'font-size', 'font-weight', 'letter-spacing'],
      );
      await expectSame(
        page,
        mat('button-toggle', '.mat-button-toggle:not(.mat-button-toggle-checked) button'),
        cngx('button-toggle', 'button[aria-checked=false]'),
        ['line-height'],
      );
    });

    test('card: the surface, corner and body type match the raised mat-card', async ({ page }) => {
      await expectSame(page, mat('card'), cngx('card'), ['background-color', 'color', 'border-top-left-radius']);
      await expectSame(page, mat('card', '.mat-mdc-card-title'), cngx('card', '[cngxCardTitle]'), ['color']);
      await expectSame(page, mat('card', '.mat-mdc-card-content'), cngx('card', '[cngxCardBody]'), [
        'color',
        'font-size',
        'line-height',
        'font-weight',
      ]);
    });

    test('divider: the rule paints the mat-divider colour at 1px with no block margin', async ({ page }) => {
      await expectSame(
        page,
        mat('divider'),
        cngx('divider'),
        ['background-color', 'height', 'margin-top', 'margin-bottom'],
        ['border-top-color', 'border-top-width', 'margin-top', 'margin-bottom'],
      );
    });

    test('chip: height, corner and surface match mat-chip', async ({ page }) => {
      await expectSame(page, mat('chip'), cngx('chip'), ['height', 'border-top-left-radius', 'background-color']);
    });

    test('chip: the edge paints the mat-chip outline', async ({ page }) => {
      // mat-chip draws its outline on the primary action's ::before.
      const outline = await page
        .locator(mat('chip', '.mdc-evolution-chip__action--primary'))
        .evaluate((el) => {
          const before = getComputedStyle(el, '::before');
          return [before.borderTopWidth, before.borderTopColor];
        });
      expect([
        await computedValue(page, cngx('chip'), 'border-top-width'),
        await computedValue(page, cngx('chip'), 'border-top-color'),
      ]).toEqual(outline);
    });

    test('chip: the label sits at the mat-chip inset in its colour and type', async ({ page }) => {
      const inset = (host: string, label: string) =>
        page.evaluate(
          ([h, l]) =>
            document.querySelector(l)!.getBoundingClientRect().left -
            document.querySelector(h)!.getBoundingClientRect().left,
          [host, label] as const,
        );
      expect(await inset(cngx('chip'), cngx('chip', '.cngx-chip__label'))).toBe(
        await inset(mat('chip'), mat('chip', '.mdc-evolution-chip__text-label')),
      );
      await expectSame(page, mat('chip', '.mdc-evolution-chip__text-label'), cngx('chip', '.cngx-chip__label'), [
        'color',
        'font-family',
        'font-size',
        'line-height',
        'font-weight',
        'letter-spacing',
      ]);
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

    test('ripple: the wave peaks at the matRipple 10% opacity', async ({ page }) => {
      // matRipple carries its peak in the colour alpha, cngx in the opacity token.
      const box = await page.locator('[data-pair=ripple] .probe-mat').boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.move(box!.x + 20, box!.y + 20);
      await page.mouse.down();
      const matWave = mat('ripple', '.mat-ripple-element');
      await expect(page.locator(matWave)).toHaveCount(1);
      const matColor = await computedValue(page, matWave, 'background-color');
      await page.mouse.up();
      const alpha = Number(matColor.match(/\/\s*([\d.]+)\)$|,\s*([\d.]+)\)$/)?.slice(1).find(Boolean));
      const cngxOpacity = await computedValue(page, cngx('ripple'), '--cngx-ripple-opacity');
      expect(Number(cngxOpacity)).toBe(alpha);
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
