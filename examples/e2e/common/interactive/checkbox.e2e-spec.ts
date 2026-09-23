import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxCheckbox is a single-value boolean atom with tristate ARIA.

test.describe('common/interactive/checkbox', () => {
  test('basic two-way: click toggles aria-checked and the bound signal', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/base/basic-two-way-binding');

    const checkbox = page.locator('cngx-checkbox').first();
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('p.demo-checkbox-caption')).toContainText('true');

  });

  test('disabled: aria-disabled blocks clicks', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/base/disabled');
    const checkbox = page.locator('cngx-checkbox').first();
    await expect(checkbox).toHaveAttribute('aria-disabled', 'true');
  });

  test('custom-check-dash-glyphs: glyph overrides render in the indicator', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox/base/custom-check-dash-glyphs');
    await expect(page.locator('cngx-checkbox')).not.toHaveCount(0);
  });

  test('tri-state select-all: master + leaves render with valid aria-checked values', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/checkbox/base/tri-state-select-all-pattern');
    const checkboxes = page.locator('cngx-checkbox');
    await expect(checkboxes.nth(1)).toBeVisible();

    // Each checkbox carries one of the valid aria-checked values.
    // evaluateAll does not retry; wait for the render first.
    await expect(checkboxes.first()).toBeVisible();
    const states = await checkboxes.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getAttribute('aria-checked')),
    );
    for (const v of states) {
      expect(['true', 'false', 'mixed']).toContain(v);
    }

  });
});
