import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxToggle is a switch atom. role=switch, aria-checked toggles.

test.describe('common/interactive/toggle', () => {
  test('basic two-way: click flips aria-checked', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/toggle/basic-two-way-binding');
    const toggle = page.getByRole('switch').first();
    const initial = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await expect(toggle).not.toHaveAttribute('aria-checked', initial as string);
  });

  test('basic two-way: switch derives its accessible name from the projected label', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/toggle/basic-two-way-binding');
    // Real-browser AccName check: Chrome does not recurse name-from-contents
    // into the nested label span for role=switch, so this is empty without the
    // aria-labelledby wiring. jsdom cannot compute this — the unit spec only
    // proves the wiring.
    const toggle = page.getByRole('switch').first();
    await expect(toggle).toHaveAccessibleName('Receive e-mail notifications');
  });

  test('disabled with reason: page renders with at least one switch', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/toggle/disabled-with-reason');
    expect(await page.getByRole('switch').count()).toBeGreaterThan(0);
  });

  test('custom thumb-glyph: glyph slot renders', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/toggle/custom-thumb-glyph');
    expect(await page.getByRole('switch').count()).toBeGreaterThan(0);
  });

  test('label-position: variants render', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/toggle/label-position');
    expect(await page.getByRole('switch').count()).toBeGreaterThan(0);
  });

  // Regression: the thumb inset is the geometric centring inset
  // ((track-height - thumb-size) / 2 = 2px), NOT a density spacing rung. A
  // density sweep once anchored it to --cngx-space-xs (4px at comfortable),
  // which pushed the thumb off-centre to the track's bottom edge (empty space
  // above it). This guard measures the real geometry: the thumb sits centred in
  // the track, and a density swap does NOT move it.
  test('thumb stays vertically centred in the track at any density', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/toggle/basic-two-way-binding');
    await expect(page.getByRole('switch').first()).toBeVisible();

    const readGaps = () =>
      page.evaluate(() => {
        const host = document.querySelector('.cngx-toggle') as HTMLElement;
        const track = host.querySelector('.cngx-toggle__track') as HTMLElement;
        const thumb = host.querySelector('.cngx-toggle__thumb') as HTMLElement;
        const t = track.getBoundingClientRect();
        const h = thumb.getBoundingClientRect();
        return {
          topGap: Number((h.top - t.top).toFixed(2)),
          bottomGap: Number((t.bottom - h.bottom).toFixed(2)),
        };
      });

    // Comfortable (default): 20px track, 16px thumb -> 2px inset top and bottom.
    const comfortable = await readGaps();
    expect(comfortable.topGap, 'thumb block-start inset != 2px (off-centre)').toBeCloseTo(2, 1);
    expect(
      Math.abs(comfortable.topGap - comfortable.bottomGap),
      'thumb not vertically centred in the track',
    ).toBeLessThanOrEqual(0.5);

    // The inset is geometric, so a density swap must leave it unchanged - the
    // bug was it tracked the density scale and grew at comfortable/spacious.
    await page.evaluate(() => document.documentElement.setAttribute('data-density', 'spacious'));
    const spacious = await readGaps();
    expect(spacious.topGap, 'thumb inset drifted under [data-density=spacious]').toBeCloseTo(2, 1);
    expect(
      Math.abs(spacious.topGap - spacious.bottomGap),
      'thumb off-centre at spacious density',
    ).toBeLessThanOrEqual(0.5);
    await page.evaluate(() => document.documentElement.removeAttribute('data-density'));
  });
});
