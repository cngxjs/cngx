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
});
