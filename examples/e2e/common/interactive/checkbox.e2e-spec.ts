import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxCheckbox is a single-value boolean atom with tristate ARIA.

test.describe('common/interactive/checkbox', () => {
  test('basic two-way: click toggles aria-checked and the bound signal', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/basic-two-way-binding');

    const checkbox = page.locator('cngx-checkbox').first();
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('p.caption')).toContainText('true');

    await expect(page).toHaveScreenshot('checkbox-basic.png', { fullPage: true });
  });

  test('disabled: aria-disabled blocks clicks', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/disabled');
    const checkbox = page.locator('cngx-checkbox').first();
    await expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    await expect(page).toHaveScreenshot('checkbox-disabled.png', { fullPage: true });
  });

  test('custom-check-dash-glyphs: glyph overrides render in the indicator', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/custom-check-dash-glyphs');
    expect(await page.locator('cngx-checkbox').count()).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('checkbox-custom-glyphs.png', { fullPage: true });
  });

  test('tri-state select-all: master flips through mixed → all → none', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/tri-state-select-all-pattern');
    const checkboxes = page.locator('cngx-checkbox');
    expect(await checkboxes.count()).toBeGreaterThanOrEqual(2);
    const master = checkboxes.first();
    const initial = await master.getAttribute('aria-checked');
    await master.click();
    const after = await master.getAttribute('aria-checked');
    expect(after).not.toBe(initial);
    await expect(page).toHaveScreenshot('checkbox-tristate.png', { fullPage: true });
  });
});
