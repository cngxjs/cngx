import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxIcon projects its content with ARIA semantics. A `label`
// input lifts the icon from decorative (aria-hidden=true) to informative
// (role="img" + aria-label).

test.describe('common/display/icon', () => {
  test('sizes: five size presets render with the size attribute', async ({ page }) => {
    await gotoDemo(page, 'common/display/icon/sizes');

    const icons = page.locator('cngx-icon');
    await expect(icons).toHaveCount(5);
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
      await expect(page.locator(`cngx-icon[size="${size}"]`)).toHaveCount(1);
    }

    // All five icons project the same star glyph content.
    for (let i = 0; i < 5; i++) {
      await expect(icons.nth(i)).toContainText('★');
    }

    await expect(page).toHaveScreenshot('icon-sizes.png', { fullPage: true });
  });

  test('decorative-vs-informative: label flips the icon to role=img', async ({ page }) => {
    await gotoDemo(page, 'common/display/icon/decorative-vs-informative');

    const icons = page.locator('cngx-icon');
    await expect(icons).toHaveCount(2);

    // Decorative icon: hidden from AT.
    const decorative = icons.first();
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');

    // Informative icon: role=img + aria-label="Saved".
    const informative = icons.nth(1);
    await expect(informative).toHaveAttribute('role', 'img');
    await expect(informative).toHaveAttribute('aria-label', 'Saved');

    await expect(page).toHaveScreenshot('icon-decorative-vs-informative.png', { fullPage: true });
  });
});
