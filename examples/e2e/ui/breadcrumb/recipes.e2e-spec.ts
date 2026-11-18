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
