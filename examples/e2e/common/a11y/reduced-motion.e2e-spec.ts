import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxReducedMotion exposes prefers-reduced-motion as a reactive
// signal. Toggling the media query via the browser must flip the demo's
// reported state and remove the running animations.

test.describe('common/a11y/reduced-motion', () => {
  test('animation toggle: reflects prefers-reduced-motion media query', async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoDemo(page, 'common/a11y/reduced-motion/animation-toggle');

    const prefersValue = page
      .locator('.event-row')
      .filter({ has: page.getByText('prefersReducedMotion', { exact: true }) })
      .locator('.event-value');
    await expect(prefersValue).toHaveText('false');

    // Flip the media query — the signal must follow.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(prefersValue).toHaveText('true');

    const cssClass = page
      .locator('.event-row')
      .filter({ has: page.getByText('CSS class', { exact: true }) })
      .locator('.event-value');
    await expect(cssClass).toHaveText('cngx-reduced-motion');


    // Reset so the second test runs from a clean state.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('toast notifications: add and dismiss updates the active count', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/reduced-motion/toast-notifications-motion-aware');

    const addBtn = page.getByRole('button', { name: 'Add notification' });
    const count = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active notifications', { exact: true }) })
      .locator('.event-value');

    await expect(count).toHaveText('0');
    await addBtn.click();
    await expect(count).toHaveText('1');
    await addBtn.click();
    await expect(count).toHaveText('2');

    // Dismiss the first toast — count drops.
    await page.getByRole('button', { name: 'dismiss' }).first().click();
    await expect(count).toHaveText('1');

  });
});
