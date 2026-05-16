import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxDivider is a presentational separator with role="separator".
// `orientation="vertical"` and `[inset]="true"` are both surfaced via
// host attributes.

test.describe('common/display/divider', () => {
  test('horizontal-vs-vertical: orientation attribute reflects the input', async ({ page }) => {
    await gotoDemo(page, 'common/display/divider/horizontal-vs-vertical');

    const dividers = page.locator('cngx-divider');
    await expect(dividers).toHaveCount(2);

    // Default is horizontal; second uses orientation="vertical".
    const separators = page.getByRole('separator');
    await expect(separators).toHaveCount(2);
    await expect(dividers.first()).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(dividers.nth(1)).toHaveAttribute('aria-orientation', 'vertical');

  });

  test('inset: [inset]="true" surfaces an inset modifier on the host', async ({ page }) => {
    await gotoDemo(page, 'common/display/divider/inset');

    // Divider element renders as 0-height by default until consumer CSS
    // gives it a border — its visibility is irrelevant to the modifier
    // semantic. CngxDivider paints the inset modifier as a host class.
    const divider = page.locator('cngx-divider').first();
    await expect(divider).toHaveCount(1);
    await expect(divider).toHaveClass(/cngx-divider--inset/);

  });
});
