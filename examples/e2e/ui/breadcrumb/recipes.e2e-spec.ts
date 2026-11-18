import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Hand-composed CngxBreadcrumb recipes. Viewport breakpoints, clamping and
// tooltip reveal on focus need real layout, so they live here, not in jsdom.

const crumbs = (page: Page) => page.locator('nav a[cngxbreadcrumbitem]');
const visibleCrumbs = (page: Page) => page.locator('nav a[cngxbreadcrumbitem]:visible');
const overflowTrigger = (page: Page) =>
  page.getByRole('button', { name: 'Show collapsed breadcrumbs' });

test.describe('ui/breadcrumb/recipes/mobile-parent-only', () => {
  const ROUTE = 'ui/breadcrumb/recipes/mobile-parent-only';

  test('keeps the parent and the current page below the breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 720 });
    await gotoDemo(page, ROUTE);

    await expect(overflowTrigger(page)).toBeVisible();
    await expect(visibleCrumbs(page)).toHaveText(['Fantasy', 'The Hobbit']);
    await expect(page.locator('nav a[aria-current="page"]')).toBeVisible();

    const trigger = overflowTrigger(page);
    await trigger.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menuitem')).toHaveText(['Home', 'Catalog', 'Books']);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('shows the full trail above the breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 720 });
    await gotoDemo(page, ROUTE);

    await expect(overflowTrigger(page)).toBeHidden();
    await expect(visibleCrumbs(page)).toHaveCount(5);
  });
});

test.describe('ui/breadcrumb/recipes/truncated-labels', () => {
  const ROUTE = 'ui/breadcrumb/recipes/truncated-labels';

  test('describes only clamped crumbs with their tooltip', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 720 });
    await gotoDemo(page, ROUTE);

    const home = crumbs(page).filter({ hasText: 'Home' });
    const clamped = crumbs(page).filter({ hasText: 'Enterprise Resource Planning' });
    await expect(clamped).toHaveAttribute('aria-describedby', /.+/);
    await expect(home).not.toHaveAttribute('aria-describedby', /.+/);

    await clamped.focus();
    const id = (await clamped.getAttribute('aria-describedby')) ?? '';
    await expect(page.locator(`[id="${id}"]`)).toBeVisible();
    await expect(page.locator(`[id="${id}"]`)).toHaveText('Enterprise Resource Planning');
  });

  test('never clamps the current page', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 720 });
    await gotoDemo(page, ROUTE);

    const current = page.locator('nav a[aria-current="page"]');
    await expect(current).toHaveText('Purchase Order #48213-B');
    const clipped = await current.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(clipped).toBe(false);
    await expect(current).not.toHaveAttribute('aria-describedby', /.+/);
  });
});
