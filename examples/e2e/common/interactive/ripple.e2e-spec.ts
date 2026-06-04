import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxRipple injects a `.cngx-ripple__wave` span into the host on
// click. The wave carries inline CSS vars for position + size + color.

test.describe('common/interactive/ripple', () => {
  test('button-ripples: each variant injects a wave span on click', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/ripple/button-ripples');

    const target = page.getByRole('button', { name: 'Default Ripple' });
    await expect(target.locator('.cngx-ripple__wave')).toHaveCount(0);
    await target.click();
    await expect(target.locator('.cngx-ripple__wave')).toHaveCount(1);

    // The custom-color variant carries a custom rippleColor input.
    const custom = page.getByRole('button', { name: 'Custom Color' });
    await custom.click();
    await expect(custom.locator('.cngx-ripple__wave')).toHaveCount(1);

  });

  test('card-with-ripple: ripple paints on a card-shaped host', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/ripple/card-with-ripple');

    // First clickable card-shaped element with the ripple directive in its
    // ancestry. The directive's attribute stays on the rendered host.
    const card = page.locator('[cngxripple]').first();
    await expect(card).toHaveCount(1);
    await card.click({ position: { x: 10, y: 10 } });
    await expect(card.locator('.cngx-ripple__wave')).toHaveCount(1);

  });
});
