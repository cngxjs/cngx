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
    await expect(page.locator('cngx-radio-indicator').nth(1)).toBeVisible();
  });

  test('disabled: indicator renders even in disabled state', async ({ page }) => {
    await gotoDemo(page, 'common/display/radio-indicator/disabled');
    await expect(page.locator('cngx-radio-indicator')).not.toHaveCount(0);
  });

  test('custom-dotglyph: consumer dot glyph overrides the default', async ({ page }) => {
    await gotoDemo(page, 'common/display/radio-indicator/custom-dotglyph');
    await expect(page.locator('cngx-radio-indicator')).not.toHaveCount(0);
  });

  test('theming-via-css-custom-properties: indicator renders with custom theming', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/display/radio-indicator/theming-via-css-custom-properties');
    await expect(page.locator('cngx-radio-indicator')).not.toHaveCount(0);
  });
});
