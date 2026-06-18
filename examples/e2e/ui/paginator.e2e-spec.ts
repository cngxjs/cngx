import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: CngxPaginator — declarative, skinnable pagination organism.
// The page row is a single roving tab stop (arrows / Home / End move focus
// within the row; Enter activates the focused page). Binding [state] gates
// navigation while busy.

test.describe('ui/paginator', () => {
  test('numbered: roving keyboard moves focus and Enter activates the page', async ({ page }) => {
    await gotoDemo(page, 'ui/paginator/paginator-skins/numbered');

    const nav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(nav).toBeVisible();

    // The story starts on page 3 (pageIndex 2).
    await expect(nav.locator('[aria-current="page"]')).toHaveText('3');

    // The row's roving anchor is the first page button. From there ArrowRight
    // moves focus one button over and Enter activates it.
    await nav.getByRole('button', { name: 'Page 1', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(nav.locator('[aria-current="page"]')).toHaveText('2');

    // Home returns focus to the first button; Enter activates page 1.
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(nav.locator('[aria-current="page"]')).toHaveText('1');

    // The chrome readout reflects the same active page.
    const currentReadout = page
      .locator('.event-row')
      .filter({ has: page.getByText('Current page', { exact: true }) })
      .locator('.event-value');
    await expect(currentReadout).toHaveText('1');
  });

  test('async: a busy state gates navigation and toggles aria-busy', async ({ page }) => {
    await gotoDemo(page, 'ui/paginator/paginator-segments/async-loading');

    const nav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-busy', 'false');

    const currentReadout = page
      .locator('.event-row')
      .filter({ has: page.getByText('Current page', { exact: true }) })
      .locator('.event-value');
    await expect(currentReadout).toHaveText('3');

    // Enter the busy state: aria-busy flips and an indeterminate progress bar
    // appears.
    await page.getByRole('button', { name: 'Start loading' }).click();
    await expect(nav).toHaveAttribute('aria-busy', 'true');
    await expect(nav.getByRole('progressbar')).toBeVisible();

    // Navigation is gated while busy: the next button reports aria-disabled,
    // and forcing the click through is a no-op (the brain gates setPage too).
    const next = nav.getByRole('button', { name: 'Next page' });
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await next.click({ force: true });
    await expect(currentReadout).toHaveText('3');

    // Settle: aria-busy clears and the bar is gone.
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(nav).toHaveAttribute('aria-busy', 'false');
    await expect(nav.getByRole('progressbar')).toHaveCount(0);

    // Navigation works again.
    await expect(next).toHaveAttribute('aria-disabled', 'false');
    await next.click();
    await expect(currentReadout).toHaveText('4');
  });
});
