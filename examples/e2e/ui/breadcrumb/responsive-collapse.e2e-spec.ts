import { expect, test, type Page } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxBreadcrumbBar with [responsive] derives maxVisible from its own
// width. The demo tunes [responsiveTiers] to the 640px demo card: >=500 shows 6,
// >=380 shows 4, else 2. Width behaviour is an e2e signal (jsdom fires no real
// ResizeObserver), so this asserts the settled collapse across viewport widths,
// overflow-menu reachability, and an intact nav landmark + terminal aria-current.

const ROUTE = 'ui/breadcrumb/overflow/responsive';

const allCrumbs = (page: Page) => page.locator('a.cngx-breadcrumb__link');
const visibleCrumbs = (page: Page) => page.locator('a.cngx-breadcrumb__link:visible');
const overflowTrigger = (page: Page) =>
  page.getByRole('button', { name: 'Show collapsed breadcrumbs' });

test.describe('ui/breadcrumb/responsive-collapse', () => {
  test('settles collapsed on a narrow mount, landmark and terminal intact', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 720 });
    await gotoDemo(page, ROUTE);

    // Every crumb stays in the DOM; collapse hides the middle via display:none
    // (Pillar 2), it is never removed.
    await expect(allCrumbs(page)).toHaveCount(6);

    // Once the observer has fired the trail is already collapsed - the full trail
    // is not left rendered. toHaveCount retries, so this pins the isReady()
    // first-paint transient down to sub-frame: it settles to 2 (first + last).
    await expect(overflowTrigger(page)).toBeVisible();
    await expect(visibleCrumbs(page)).toHaveCount(2);

    // Landmark + terminal marking survive the collapse.
    await expect(page.getByRole('navigation', { name: 'Library breadcrumb' })).toBeVisible();
    await expect(page.locator('a.cngx-breadcrumb__link[aria-current="page"]')).toHaveText(
      'The Hobbit',
    );
  });

  test('grows to the full trail when widened and re-collapses when narrowed', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 720 });
    await gotoDemo(page, ROUTE);

    // Wide: the 6-cap tier fits the whole trail, so nothing collapses.
    await expect(overflowTrigger(page)).toBeHidden();
    await expect(visibleCrumbs(page)).toHaveCount(6);

    // Narrow again: the 2-cap tier folds the middle back into the overflow.
    await page.setViewportSize({ width: 360, height: 720 });
    await expect(overflowTrigger(page)).toBeVisible();
    await expect(visibleCrumbs(page)).toHaveCount(2);
  });

  test('the overflow menu reaches every collapsed crumb', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 720 });
    await gotoDemo(page, ROUTE);

    await expect(overflowTrigger(page)).toBeVisible();
    await overflowTrigger(page).click();

    // The middle crumbs the trail hid are all listed in the menu, in order.
    await expect(page.getByRole('menuitem')).toHaveText(['Catalog', 'Books', 'Fantasy', 'Tolkien']);
  });
});
