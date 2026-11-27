import { expect, test } from '@playwright/test';

// The active tab must land inside the overflowing strip even when the strip
// relayouts while the smooth scrollIntoView animates. In the app that
// relayout is the More trigger or an overflow recommit, which only lands
// mid-scroll under load; here a 1px padding nudge injects it on purpose.
// The nudge runs on an in-page timer after the keydown: fired from the
// strip's own scroll event it lands too early or too late to reproduce.

const TABS_OVERFLOW = '/#/ui/tabs/tab-overflow/8-tabs-in-a-narrow-container';

test('tab overflow: a relayout during the scroll does not strand the active tab', async ({
  page,
}) => {
  await page.goto(TABS_OVERFLOW);
  const tabs = page.locator('cngx-tab-group button[role="tab"]');
  await expect(page.locator('.cngx-tab-overflow__trigger')).toBeVisible();

  await page.locator('.cngx-tabs__strip').evaluate((strip: HTMLElement) => {
    const nudge = (): void => {
      strip.style.paddingInlineEnd = '1px';
      requestAnimationFrame(() => {
        strip.style.paddingInlineEnd = '';
      });
    };
    strip.ownerDocument.addEventListener('keydown', () => setTimeout(nudge, 40), {
      once: true,
      capture: true,
    });
  });

  await tabs.first().focus();
  await page.keyboard.press('End');

  const last = tabs.last();
  await expect(last).toHaveAttribute('aria-selected', 'true');
  await expect(last).toBeInViewport();
});
