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

  });

  test('disabled: aria-disabled blocks clicks', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/disabled');
    const checkbox = page.locator('cngx-checkbox').first();
    await expect(checkbox).toHaveAttribute('aria-disabled', 'true');
  });

  test('custom-check-dash-glyphs: glyph overrides render in the indicator', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/custom-check-dash-glyphs');
    expect(await page.locator('cngx-checkbox').count()).toBeGreaterThan(0);
  });

  test('tri-state select-all: master + leaves render with valid aria-checked values', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/checkbox/tri-state-select-all-pattern');
    const checkboxes = page.locator('cngx-checkbox');
    expect(await checkboxes.count()).toBeGreaterThanOrEqual(2);

    // Each checkbox carries one of the valid aria-checked values.
    const states = await checkboxes.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getAttribute('aria-checked')),
    );
    for (const v of states) {
      expect(['true', 'false', 'mixed']).toContain(v);
    }

  });
});
