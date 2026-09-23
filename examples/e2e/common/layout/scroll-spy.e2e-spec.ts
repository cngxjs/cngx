import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxScrollSpy watches a list of section IDs inside a scroll
// container and exposes the most-visible section's id as activeId(). The
// nav items are buttons; the active one carries aria-current="location".

test.describe('common/layout/scroll-spy', () => {
  test('scroll-based-navigation: active section follows the scroll position', async ({ page }) => {
    await gotoDemo(page, 'common/layout/scroll-spy/scroll-based-navigation');

    const navIntro = page.getByRole('button', { name: 'intro', exact: true });
    const navFeatures = page.getByRole('button', { name: 'features', exact: true });
    const navPricing = page.getByRole('button', { name: 'pricing', exact: true });
    const activeRow = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active section', { exact: true }) })
      .locator('.event-value');

    // Initially the first section is the most visible.
    await expect(navIntro).toHaveAttribute('aria-current', 'location');
    await expect(activeRow).toHaveText('spy-intro');

    // Scroll well into the third section.
    const spy = page.locator('.spy-container');
    await spy.evaluate((el) => {
      const target = el.querySelector('#spy-pricing')!;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    await expect(activeRow).toHaveText('spy-pricing', { timeout: 2000 });
    await expect(navPricing).toHaveAttribute('aria-current', 'location');
    await expect(navFeatures).not.toHaveAttribute('aria-current', 'location');

  });
});
