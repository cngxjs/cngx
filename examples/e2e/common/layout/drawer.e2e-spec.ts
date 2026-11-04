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

test.describe('common/layout/drawer: clipped drawer below a live header', () => {
  const route = 'common/layout/drawer/app-header-clipped';

  test('the header stays live and the hamburger closes the drawer', async ({ page }) => {
    await gotoDemo(page, route);
    const hamburger = page.locator('button[aria-controls="clipped-nav"]');
    await hamburger.click();
    const panel = page.locator('#clipped-nav');
    await expect(panel).toHaveClass(/cngx-drawer-panel--open/);
    await expect(panel).not.toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('main.demo-app-main')).toHaveAttribute('inert', '');

    const notifications = page.getByRole('button', { name: 'Notifications' });
    const notificationsInert = await notifications.evaluate((el) => el.closest('[inert]') !== null);
    expect(notificationsInert).toBe(false);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    await hamburger.click();
    await expect(panel).not.toHaveClass(/cngx-drawer-panel--open/);
    await expect(page.locator('main.demo-app-main')).not.toHaveAttribute('inert', '');
  });

  test('a header control closes the drawer as an outside press', async ({ page }) => {
    await gotoDemo(page, route);
    await page.locator('button[aria-controls="clipped-nav"]').click();
    const panel = page.locator('#clipped-nav');
    await expect(panel).toHaveClass(/cngx-drawer-panel--open/);

    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(panel).not.toHaveClass(/cngx-drawer-panel--open/);
  });

  test('Escape closes it and focus returns to the hamburger', async ({ page }) => {
    await gotoDemo(page, route);
    const hamburger = page.locator('button[aria-controls="clipped-nav"]');
    await hamburger.click();
    const panel = page.locator('#clipped-nav');
    await expect(panel.getByRole('link', { name: 'Dashboard' })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(panel).not.toHaveClass(/cngx-drawer-panel--open/);
    await expect(hamburger).toBeFocused();
  });
});

test.describe('common/layout/drawer: full-height modal drawer', () => {
  const route = 'common/layout/drawer/full-height-modal';

  test('Tab and Shift+Tab wrap inside the panel', async ({ page }) => {
    await gotoDemo(page, route);
    await page.locator('button[aria-controls="full-height-nav"]').click();
    const panel = page.locator('#full-height-nav');
    await expect(panel).toHaveAttribute('aria-modal', 'true');

    await panel.getByRole('link', { name: 'Settings' }).focus();
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('button', { name: 'Close navigation' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(panel.getByRole('link', { name: 'Settings' })).toBeFocused();
  });

  test('Escape closes it and focus returns to the hamburger', async ({ page }) => {
    await gotoDemo(page, route);
    const hamburger = page.locator('button[aria-controls="full-height-nav"]');
    await hamburger.click();
    const panel = page.locator('#full-height-nav');
    await expect(panel).toHaveAttribute('aria-modal', 'true');

    await page.keyboard.press('Escape');

    await expect(panel).not.toHaveClass(/cngx-drawer-panel--open/);
    await expect(hamburger).toBeFocused();
  });
});

test.describe('common/layout/drawer: filter panel', () => {
  const route = 'common/layout/drawer/filter-panel-push';

  test('push panel: the list stays operable and Tab leaves the panel', async ({ page }) => {
    await gotoDemo(page, route);
    await page.getByRole('button', { name: 'Filters' }).click();
    const panel = page.locator('#order-filters');
    await expect(panel).toHaveClass(/cngx-drawer-panel--open/);
    await expect(panel).not.toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('main.demo-app-main')).not.toHaveAttribute('inert', '');

    await panel.getByRole('checkbox', { name: 'Cancelled' }).check();
    await expect(page.getByText('12 of 12 orders')).toBeVisible();

    await panel.getByRole('checkbox', { name: 'Cancelled' }).focus();
    await page.keyboard.press('Tab');
    const insidePanel = await page.evaluate(
      () => document.getElementById('order-filters')?.contains(document.activeElement) ?? false,
    );
    expect(insidePanel).toBe(false);
  });

  test('over + page: the panel becomes a modal dialog', async ({ page }) => {
    await gotoDemo(page, route);
    await page.getByRole('button', { name: 'over', exact: true }).click();
    await page.getByRole('button', { name: 'page', exact: true }).click();
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.locator('#order-filters')).toHaveAttribute('aria-modal', 'true');
  });
});
