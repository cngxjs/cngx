import { expect, test, type Page } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxBreadcrumbBar derives maxVisible from its OWN container width. The
// rungs live in breadcrumb-bar.component.css as @container rules writing
// --cngx-breadcrumb-max-visible on `.cngx-breadcrumb::after`: 2 below 30rem, 4
// below 48rem, 6 above. The viewport is no longer the input, so these cases
// drive the box itself - that is the contract under test. Width behaviour is an
// e2e signal (jsdom fires no real ResizeObserver); this asserts the settled
// collapse at each rung, overflow-menu reachability, and an intact nav landmark
// + terminal aria-current.

const ROUTE = 'ui/breadcrumb/overflow/responsive';

const bar = (page: Page) => page.locator('.cngx-breadcrumb');
const allCrumbs = (page: Page) => page.locator('a.cngx-breadcrumb__link');
const visibleCrumbs = (page: Page) => page.locator('a.cngx-breadcrumb__link:visible');
const overflowTrigger = (page: Page) =>
  page.getByRole('button', { name: 'Show collapsed breadcrumbs' });

/** Resize the bar's own container, the way a drawer or split pane would. */
async function setBarWidth(page: Page, width: string): Promise<void> {
  await bar(page).evaluate((el, value) => {
    (el as HTMLElement).style.inlineSize = value;
  }, width);
}

test.describe('ui/breadcrumb/responsive-collapse', () => {
  test('settles collapsed on a narrow mount, landmark and terminal intact', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 720 });
    await gotoDemo(page, ROUTE);

    // Every crumb stays in the DOM; collapse hides the middle via display:none
    // (Pillar 2), it is never removed.
    await expect(allCrumbs(page)).toHaveCount(6);

    // Once the container has reported a size the trail is already collapsed -
    // the full trail is not left rendered. toHaveCount retries, so this pins the
    // first-paint transient down to sub-frame: it settles to 2 (first + last).
    await expect(overflowTrigger(page)).toBeVisible();
    await expect(visibleCrumbs(page)).toHaveCount(2);

    // Landmark + terminal marking survive the collapse.
    await expect(page.getByRole('navigation', { name: 'Library breadcrumb' })).toBeVisible();
    await expect(page.locator('a.cngx-breadcrumb__link[aria-current="page"]')).toHaveText(
      'The Hobbit',
    );
  });

  test('walks all three rungs as its own container resizes', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 720 });
    await gotoDemo(page, ROUTE);

    // Above 48rem: the 6-cap fits the whole trail, nothing collapses.
    await setBarWidth(page, '60rem');
    await expect(overflowTrigger(page)).toBeHidden();
    await expect(visibleCrumbs(page)).toHaveCount(6);

    // Between the rungs: the 4-cap folds the middle in.
    await setBarWidth(page, '35rem');
    await expect(overflowTrigger(page)).toBeVisible();
    await expect(visibleCrumbs(page)).toHaveCount(4);

    // Below 30rem: down to first + last.
    await setBarWidth(page, '25rem');
    await expect(visibleCrumbs(page)).toHaveCount(2);

    // And back up - the derivation is not one-way.
    await setBarWidth(page, '60rem');
    await expect(overflowTrigger(page)).toBeHidden();
    await expect(visibleCrumbs(page)).toHaveCount(6);
  });

  test('reacts to its container, not the window', async ({ page }) => {
    // The regression this slice closes: a bar in a narrow box used to stay wide
    // on a wide window. Pin a narrow box, then widen the window - the cap holds.
    await page.setViewportSize({ width: 1400, height: 720 });
    await gotoDemo(page, ROUTE);

    await setBarWidth(page, '25rem');
    await expect(visibleCrumbs(page)).toHaveCount(2);

    await page.setViewportSize({ width: 1800, height: 720 });
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
