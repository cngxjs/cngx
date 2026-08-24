import { expect, test, type Page } from '@playwright/test';

// RTL keyboard contracts for the Tier-2 inline-axis split: slider
// increase/decrease and reorder / chip-strip move-forward/back flip on the
// inline axis under html[dir="rtl"] while the block axis stays fixed
// (block-axis invariance is covered by the unit specs). Mirrors the
// runtime-flip pattern in e2e/css-contract-rtl.spec.ts.

const SLIDER = '/#/common/interactive/slider/keyboard-and-steps';
const REORDER_MULTI =
  '/#/forms/select/reorderable-multi-select/keyboard-reorder-alt-arrow-home-end';
const CHIP_STRIP = '/#/common/interactive/reorder/with-chip-strip-roving';

function setRtl(page: Page): Promise<void> {
  return page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'));
}

test.describe('RTL keyboard navigation: slider and reorder', () => {
  test('slider: ArrowLeft increases the value, ArrowRight decreases it', async ({ page }) => {
    await page.goto(SLIDER);
    await setRtl(page);
    const slider = page.locator('.cngx-ex-artifact [role="slider"]').first();
    await slider.focus();
    await expect(slider).toHaveAttribute('aria-valuenow', '60');

    // step is 5; under rtl the inline arrows swap increase/decrease.
    await slider.press('ArrowLeft');
    await expect(slider).toHaveAttribute('aria-valuenow', '65');
    await slider.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '60');
  });

  test('reorderable-multi-select: Alt+ArrowLeft moves the focused chip toward the end', async ({
    page,
  }) => {
    await page.goto(REORDER_MULTI);
    await setRtl(page);
    const orderRow = page
      .locator('.event-row', { hasText: 'Current order' })
      .locator('.event-value');
    await expect(orderRow).toHaveText('eng → legal → finance → ops');

    await page.locator('[data-reorder-index="0"]').first().focus();
    await page.keyboard.press('Alt+ArrowLeft');
    await expect(orderRow).toHaveText('legal → eng → finance → ops');
  });

  test('chip-strip roving: ArrowLeft roves to the next chip in reading order', async ({ page }) => {
    await page.goto(CHIP_STRIP);
    await setRtl(page);
    const activeIndex = page
      .locator('.event-row', { hasText: 'activeIndex' })
      .locator('.event-value');
    await expect(activeIndex).toHaveText('0');

    await page.locator('.cngx-ex-artifact [data-reorder-index="0"]').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(activeIndex).toHaveText('1');
    await page.keyboard.press('ArrowRight');
    await expect(activeIndex).toHaveText('0');
  });
});
