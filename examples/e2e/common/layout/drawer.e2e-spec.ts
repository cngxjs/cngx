import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

test.describe('common/layout/drawer', () => {
  for (const { name, path } of routesIn('common', 'layout', 'drawer')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});

test.describe('common/layout/drawer: modal inert scope', () => {
  const route = 'common/layout/drawer/mode-over-push';

  test('modal over drawer: Tab and Shift+Tab wrap inside the panel', async ({ page }) => {
    await gotoDemo(page, route);
    await page.getByRole('button', { name: 'Toggle over drawer' }).click();
    const panel = page.locator('#mode-panel');
    await expect(panel).toHaveAttribute('aria-modal', 'true');

    await panel.getByRole('button', { name: 'Close' }).focus();
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('button', { name: 'Inbox' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(panel.getByRole('button', { name: 'Close' })).toBeFocused();

    const chipInert = await page
      .getByRole('button', { name: 'push', exact: true })
      .evaluate((el) => el.closest('[inert]') !== null);
    expect(chipInert).toBe(true);
  });

  for (const modality of ['mode default', 'modal']) {
    test(`modal over drawer (${modality}): Escape closes it and focus returns to the toggle`, async ({
      page,
    }) => {
      await gotoDemo(page, route);
      await page.getByRole('button', { name: modality, exact: true }).click();
      const toggle = page.getByRole('button', { name: 'Toggle over drawer' });
      await toggle.click();
      const panel = page.locator('#mode-panel');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel.getByRole('button', { name: 'Inbox' })).toBeFocused();

      await page.keyboard.press('Escape');

      await expect(panel).not.toHaveClass(/cngx-drawer-panel--open/);
      await expect(toggle).toBeFocused();
    });
  }

  test('non-modal over drawer: Tab leaves the panel', async ({ page }) => {
    await gotoDemo(page, route);
    await page.getByRole('button', { name: 'non-modal' }).click();
    await page.getByRole('button', { name: 'Toggle over drawer' }).click();
    const panel = page.locator('#mode-panel');
    await expect(panel).toHaveClass(/cngx-drawer-panel--open/);
    await expect(panel).not.toHaveAttribute('aria-modal', 'true');

    await panel.getByRole('button', { name: 'Close' }).focus();
    await page.keyboard.press('Tab');
    const insidePanel = await page.evaluate(
      () => document.getElementById('mode-panel')?.contains(document.activeElement) ?? false,
    );
    expect(insidePanel).toBe(false);
  });
});
