import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxNav renders a hierarchical navigation with badges, accordion
// sections, and active-state by depth.

test.describe('common/interactive/nav', () => {
  test('badge-counts-and-dots: badges render per variant and name themselves', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/nav/nav-badge-counts-and-dots');

    // Scope to the nav's own links: the intro panel ships reference links too,
    // so a bare getByRole('link') counts the wrong thing.
    await expect(page.locator('a[cngxnavlink]')).toHaveCount(3);

    // A count badge carrying information must name itself; a decorative one
    // must stay hidden from AT. That contrast is the point of the demo.
    await expect(page.getByLabel('12 unread')).toBeVisible();
    await expect(page.locator('[cngxnavbadge][aria-hidden="true"]')).not.toHaveCount(0);
  });

  test('accordion-sections: clicking a section header expands its panel', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/nav/nav-group-accordion-sections');
    // Find a button that toggles a panel — the first header with aria-expanded.
    const headers = page.locator('button[cngxnavgroup]');
    await expect(headers).not.toHaveCount(0);
    const header = headers.first();
    // The group trigger must expose the disclosure contract it host-composes.
    await expect(header).toHaveAttribute('aria-controls', /.+/);
    const before = await header.getAttribute('aria-expanded');
    await header.click();
    const after = await header.getAttribute('aria-expanded');
    expect(after).not.toBe(before);
  });

  test('links-active-state-depth: exactly one link is marked current', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/nav/nav-links-active-state-depth');

    await expect(page.locator('a[cngxnavlink]')).toHaveCount(6);
    // Active-state-by-depth means one winner, not "some link is highlighted".
    await expect(page.locator('a[aria-current]')).toHaveCount(1);
  });
});
