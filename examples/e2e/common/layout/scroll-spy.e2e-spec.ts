import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxScrollSpy watches a list of section IDs inside a scroll
// container and exposes the most-visible section's id as activeId(). The
// nav highlights via `[class.chip--active]="spy.activeId() === id"`.

test.describe('common/layout/scroll-spy', () => {
  test('scroll-based-navigation: active section follows the scroll position', async ({ page }) => {
    await gotoDemo(page, 'common/layout/scroll-spy/scroll-based-navigation');

    const navIntro = page.getByRole('link', { name: 'intro' });
    const navFeatures = page.getByRole('link', { name: 'features' });
    const navPricing = page.getByRole('link', { name: 'pricing' });
    const activeRow = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active section', { exact: true }) })
      .locator('.event-value');

    // Initially the first section is the most visible.
    await expect(navIntro).toHaveClass(/chip--active/);
    await expect(activeRow).toHaveText('spy-intro');

    // Scroll well into the third section.
    const spy = page.locator('.spy-container');
    await spy.evaluate((el) => {
      const target = el.querySelector('#spy-pricing') as HTMLElement;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    await expect(activeRow).toHaveText('spy-pricing', { timeout: 2000 });
    await expect(navPricing).toHaveClass(/chip--active/);
    await expect(navFeatures).not.toHaveClass(/chip--active/);

    await expect(page).toHaveScreenshot('spy-pricing-active.png', { fullPage: true });
  });
});
