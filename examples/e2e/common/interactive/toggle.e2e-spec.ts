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
    await expect(page).toHaveScreenshot('toggle-basic.png', { fullPage: true });
  });

  test('disabled with reason: at least one toggle renders with aria-describedby', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/toggle/disabled-with-reason');
    const switches = page.getByRole('switch');
    expect(await switches.count()).toBeGreaterThan(0);
    // aria-describedby is always wired per cngx convention.
    await expect(switches.first()).toHaveAttribute('aria-describedby', /.+/);
    await expect(page).toHaveScreenshot('toggle-disabled.png', { fullPage: true });
  });

  test('custom thumb-glyph: glyph slot renders', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/toggle/custom-thumb-glyph');
    expect(await page.getByRole('switch').count()).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('toggle-thumb.png', { fullPage: true });
  });

  test('label-position: variants render', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/toggle/label-position');
    expect(await page.getByRole('switch').count()).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('toggle-label-position.png', { fullPage: true });
  });
});
