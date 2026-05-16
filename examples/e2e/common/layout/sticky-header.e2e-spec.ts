import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStickyHeader detects when a `position: sticky` element has
// pinned to the top of its scroll container and exposes isSticky() as a
// signal. The demo paints "Stuck!" + a shadow when active.

test.describe('common/layout/sticky-header', () => {
  test('sticky-with-shadow: isSticky flips when the header pins', async ({ page }) => {
    await gotoDemo(page, 'common/layout/sticky-header/sticky-header-with-shadow');

    const isStickyVal = page
      .locator('.event-row')
      .filter({ has: page.getByText('isSticky', { exact: true }) })
      .locator('.event-value');
    const headerLabel = page
      .locator('header[cngxstickyheader] strong')
      .first()
      .or(page.locator('header strong').first());

    await expect(isStickyVal).toHaveText('false');
    await expect(headerLabel).toHaveText('Header');

    // Scroll the inner container so the header pins. The scroll box is the
    // sticky header's offsetParent — find it via JS for robustness against
    // Angular's whitespace-normalised style attribute.
    await page.evaluate(() => {
      const header = document.querySelector('header[cngxstickyheader]') as HTMLElement | null;
      const scrollBox = header?.parentElement as HTMLElement;
      scrollBox.scrollTop = 200;
    });
    await expect(isStickyVal).toHaveText('true', { timeout: 2000 });
    await expect(headerLabel).toHaveText('Stuck!');

  });
});
