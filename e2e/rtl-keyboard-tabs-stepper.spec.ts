import { expect, test, type Page } from '@playwright/test';

// RTL keyboard-navigation contracts for the tablist and stepper-strip
// Tier-1 axis flip, plus the scrollIntoView overflow check. Under
// html[dir="rtl"] the inline arrows invert per WAI-ARIA APG; the block
// axis stays fixed (covered by the unit specs). Mirrors the runtime-flip
// pattern in e2e/css-contract-rtl.spec.ts.

const TABS = '/#/ui/tabs/tab-group/three-tab-navigation';
const TABS_OVERFLOW = '/#/ui/tabs/tab-overflow/8-tabs-in-a-narrow-container';
const STEPPER = '/#/ui/stepper/stepper-horizontal/three-step-wizard';

function setRtl(page: Page): Promise<void> {
  return page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'));
}

test.describe('RTL keyboard navigation: tabs and stepper', () => {
  test('tablist: ArrowLeft activates the next tab in reading order, ArrowRight the previous', async ({
    page,
  }) => {
    await page.goto(TABS);
    await setRtl(page);
    const buttons = page.locator('cngx-tab-group button[role="tab"]');
    await expect(buttons.first()).toBeVisible();

    await buttons.nth(0).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('stepper strip: ArrowLeft advances the active step under rtl', async ({ page }) => {
    await page.goto(STEPPER);
    await setRtl(page);
    const buttons = page.locator('cngx-stepper button.cngx-stepper__step');
    await expect(buttons.first()).toBeVisible();

    await buttons.nth(0).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(1)).toHaveAttribute('aria-current', 'step');
  });

  test('overflow: End jumps to the last tab and scrollIntoView brings it into the viewport under rtl', async ({
    page,
  }) => {
    await page.goto(TABS_OVERFLOW);
    await setRtl(page);
    const buttons = page.locator('cngx-tab-group button[role="tab"]');
    await expect(buttons.first()).toBeVisible();
    const count = await buttons.count();
    expect(count).toBeGreaterThan(1);

    await buttons.nth(0).focus();
    await page.keyboard.press('End');

    const last = buttons.nth(count - 1);
    await expect(last).toHaveAttribute('aria-selected', 'true');
    // Element.scrollIntoView resolves the inline axis natively under rtl;
    // the activated off-screen tab must land inside the viewport with no
    // manual scrollLeft math.
    await expect(last).toBeInViewport();
  });
});
