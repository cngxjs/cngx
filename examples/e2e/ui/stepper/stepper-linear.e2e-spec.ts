import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: Linear stepper. Each step's content panel hosts a "complete"
// checkbox; ticking it propagates to the strip's data-state.

test.describe('ui/stepper/stepper-linear', () => {
  test('linear gating: ticking completion advances data-state on the strip', async ({ page }) => {
    await gotoDemo(page, 'ui/stepper/stepper-linear/linear-gating-with-completion-checkboxes');

    const steps = page.locator('button.cngx-stepper__step');
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');

    // Step 0 starts not completed.
    expect(await steps.nth(0).getAttribute('data-state')).not.toBe('completed');

    // The content panel for step 0 renders a checkbox labelled "Profile complete".
    await page.locator('label', { hasText: 'Profile complete' }).locator('input').check();

    // Ticking propagates to the step indicator. Different skins expose
    // completion as either "completed" or "success" — accept either.
    await expect
      .poll(() => steps.nth(0).getAttribute('data-state'), { timeout: 2000 })
      .toMatch(/^(completed|success)$/);

    const completedRow = page
      .locator('.event-row')
      .filter({ has: page.getByText('Completed', { exact: true }) })
      .locator('.event-value');
    await expect(completedRow).toContainText('true');

    await expect(page).toHaveScreenshot('stepper-linear.png', { fullPage: true });
  });
});
