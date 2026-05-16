import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

test.describe('ui/stepper/stepper-commit-action', () => {
  test('pessimistic-optimistic commits: stepper renders with bridge directives', async ({
    page,
  }) => {
    await gotoDemo(
      page,
      'ui/stepper/stepper-commit-action/pessimistic-optimistic-commits-with-bridge-directives',
    );
    await expect(page.locator('cngx-stepper')).toBeVisible();
    await expect(page).toHaveScreenshot('stepper-commit-action.png', { fullPage: true });
  });
});
