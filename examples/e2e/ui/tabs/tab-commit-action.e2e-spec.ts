import { expect, test, type Page } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const ROUTE = 'ui/tabs/tab-commit-action/optimistic-pessimistic-commits-with-bridge-directives';

function tabButtons(page: Page) {
  return page.locator('cngx-tab-group button[role="tab"]');
}

// Scoped to rendered toasts: the code panel quotes the same strings.
function toast(page: Page, text: string) {
  return page.getByRole('region', { name: 'Notifications' }).getByText(text, { exact: true });
}

const REASON = 'Not allowed yet: save the profile first.';

test.describe('ui/tabs/tab-commit-action', () => {
  test('optimistic-pessimistic commits: tabs render with bridge directives', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await expect(page.locator('cngx-tab-group')).toBeVisible();
  });

  test('a refusal after an accepted commit rolls back, speaks the refused phrase and fires no bridge toast', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);
    const buttons = tabButtons(page);
    const region = page.locator('.cngx-tabs__live-region');

    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');
    const saved = toast(page, 'Tab saved');
    await expect(saved).toBeVisible({ timeout: 4000 });
    // Let the success toast expire, so a refusal surfacing as a success
    // would have to raise a fresh one.
    await expect(saved).toBeHidden({ timeout: 10000 });

    await page.getByLabel('simulate refusal').check();
    await buttons.nth(2).click();

    await expect(toast(page, 'Save the profile first.')).toBeVisible({ timeout: 4000 });
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(region).toContainText('Tab switch not allowed - stayed on');
    await expect(region).toContainText('Account');
    await expect(page.getByText(REASON, { exact: true })).toBeVisible();
    await expect(buttons.nth(2)).toHaveClass(/cngx-tab--rejected/);
    await expect(saved).toHaveCount(0);
    await expect(toast(page, 'Tab transition failed')).toHaveCount(0);
  });

  test('a failure toasts the bridge error and rolls back', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    const buttons = tabButtons(page);
    await page.getByLabel('simulate error').check();

    await buttons.nth(2).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true', { timeout: 4000 });
    await expect(toast(page, 'Tab transition failed')).toBeVisible();
    await expect(page.locator('.cngx-tabs__live-region')).toContainText('reverted to');
    await expect(page.getByText(REASON, { exact: true })).toHaveCount(0);
  });

  test('keyboard focus returns to the active tab after a pessimistic refusal', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    const buttons = tabButtons(page);
    await page.getByRole('button', { name: 'pessimistic', exact: true }).click();
    await page.getByLabel('simulate refusal').check();

    await buttons.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    // Focus follows the intended tab while the commit is in flight.
    await expect(buttons.nth(1)).toBeFocused();

    await expect(page.getByText(REASON, { exact: true })).toBeVisible({ timeout: 4000 });
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(buttons.nth(0)).toBeFocused();
  });
});
