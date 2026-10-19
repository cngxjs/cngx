import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const ROUTE =
  'ui/stepper/stepper-commit-action/pessimistic-optimistic-commits-with-bridge-directives';

function stepButtons(page: Page) {
  return page.locator('cngx-stepper button.cngx-stepper__step');
}

// Scoped to rendered toasts: the code panel quotes the same strings.
function toast(page: Page, text: string) {
  return page.getByRole('region', { name: 'Notifications' }).getByText(text, { exact: true });
}

const REASON = 'Not allowed yet: save the profile first.';

test.describe('ui/stepper/stepper-commit-action', () => {
  test('pessimistic-optimistic commits: stepper renders with bridge directives', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);
    await expect(page.locator('cngx-stepper')).toBeVisible();
  });

  test('a refusal after an accepted commit rolls back, speaks the refused phrase and fires no bridge toast', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);
    const buttons = stepButtons(page);
    const region = page.locator('.cngx-stepper__live-region');

    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-current', 'step', { timeout: 4000 });
    const saved = toast(page, 'Step saved');
    await expect(saved).toBeVisible();
    // Let the success toast expire, so a refusal surfacing as a success
    // would have to raise a fresh one.
    await expect(saved).toBeHidden({ timeout: 10000 });

    await page.getByLabel('simulate refusal').check();
    await buttons.nth(2).click();

    await expect(toast(page, 'Save the profile first.')).toBeVisible({ timeout: 4000 });
    await expect(buttons.nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(region).toContainText('Step change not allowed - stayed on step');
    await expect(region).toContainText('Payment');
    await expect(page.getByText(REASON, { exact: true })).toBeVisible();
    await expect(buttons.nth(2)).toHaveClass(/cngx-stepper__step--rejected/);
    await expect(saved).toHaveCount(0);
    await expect(toast(page, 'Step transition failed')).toHaveCount(0);
  });

  test('a failure toasts the bridge error and rolls back', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    const buttons = stepButtons(page);
    await page.getByRole('button', { name: 'optimistic', exact: true }).click();
    await page.getByLabel('simulate error').check();

    await buttons.nth(2).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-current', 'step', { timeout: 4000 });
    await expect(toast(page, 'Step transition failed')).toBeVisible();
    await expect(page.locator('.cngx-stepper__live-region')).toContainText('Reverted to step');
    await expect(page.getByText(REASON, { exact: true })).toHaveCount(0);
  });
});
