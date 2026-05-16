import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxNav renders a hierarchical navigation with badges, accordion
// sections, and active-state by depth.

test.describe('common/interactive/nav', () => {
  test('badge-counts-and-dots: nav renders with links', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/nav/nav-badge-counts-and-dots');
    // Smoke: the nav itself renders with at least one link.
    expect(await page.getByRole('link').count()).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('nav-badges.png', { fullPage: true });
  });

  test('accordion-sections: clicking a section header expands its panel', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/nav/nav-group-accordion-sections');
    // Find a button that toggles a panel — the first header with aria-expanded.
    const headers = page.locator('[aria-expanded]');
    expect(await headers.count()).toBeGreaterThan(0);
    const header = headers.first();
    const before = await header.getAttribute('aria-expanded');
    await header.click();
    const after = await header.getAttribute('aria-expanded');
    expect(after).not.toBe(before);
    await expect(page).toHaveScreenshot('nav-accordion.png', { fullPage: true });
  });

  test('links-active-state-depth: at least one link is rendered', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/nav/nav-links-active-state-depth');
    expect(await page.getByRole('link').count()).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('nav-links.png', { fullPage: true });
  });
});
