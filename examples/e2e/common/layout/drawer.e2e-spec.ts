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
    await page.getByRole('button', { name: 'Overlays the list (over)' }).click();
    await page.getByRole('button', { name: 'Whole page blocked (page)' }).click();
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.locator('#order-filters')).toHaveAttribute('aria-modal', 'true');
  });

  test('push locks the modality chips and says why', async ({ page }) => {
    await gotoDemo(page, route);
    const contained = page.getByRole('button', { name: 'Only this area blocked (contained)' });
    await expect(contained).toHaveAttribute('aria-disabled', 'true');
    await expect(contained).toHaveAccessibleDescription(/push never blocks/);
    await expect(page.getByText(/push is never blocking/)).toBeVisible();

    await page.getByRole('button', { name: 'Overlays the list (over)' }).click();
    await expect(contained).not.toHaveAttribute('aria-disabled', 'true');
    await contained.click();
    await expect(page.getByText(/Only this area blocked: the scrim/)).toBeVisible();
  });
});

test.describe('common/layout/drawer: modal panel name', () => {
  test('an open page-modal panel is a dialog named by its label', async ({ page }) => {
    await gotoDemo(page, 'common/layout/drawer/basic-scroll-lock-backdrop');
    await page.getByRole('button', { name: 'Open Drawer' }).click();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  });
});
