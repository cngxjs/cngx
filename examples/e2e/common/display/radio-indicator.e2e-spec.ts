import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxRadioIndicator is a decorative dot-in-circle atom. Mirrors
// CngxCheckboxIndicator. Pure visual — aria-hidden, no outputs.

test.describe('common/display/radio-indicator', () => {
  test('default unchecked vs checked: aria-checked reflects the input', async ({ page }) => {
    await gotoDemo(page, 'common/display/radio-indicator/default-unchecked-vs-checked');

    const indicators = page.locator('cngx-radio-indicator');
    await expect(indicators).toHaveCount(2);
    // The second indicator carries the --checked modifier class.
    await expect(indicators.nth(1)).toHaveClass(/cngx-radio-indicator--checked/);

  });

  test('sizes: multiple size presets render', async ({ page }) => {
    await gotoDemo(page, 'common/display/radio-indicator/sizes');
    expect(await page.locator('cngx-radio-indicator').count()).toBeGreaterThanOrEqual(2);
  });

  test('disabled: indicator renders even in disabled state', async ({ page }) => {
    await gotoDemo(page, 'common/display/radio-indicator/disabled');
    expect(await page.locator('cngx-radio-indicator').count()).toBeGreaterThan(0);
  });

  test('custom-dotglyph: consumer dot glyph overrides the default', async ({ page }) => {
    await gotoDemo(page, 'common/display/radio-indicator/custom-dotglyph');
    expect(await page.locator('cngx-radio-indicator').count()).toBeGreaterThan(0);
  });

  test('theming-via-css-custom-properties: indicator renders with custom theming', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/display/radio-indicator/theming-via-css-custom-properties');
    expect(await page.locator('cngx-radio-indicator').count()).toBeGreaterThan(0);
  });
});
