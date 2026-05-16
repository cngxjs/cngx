import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: Linear stepper. The demo's content templates rely on
// CngxStepContent being registered, but the generator omits it from the
// component's imports (recurring "missing structural directive import"
// bug). Without content templates, the completion checkboxes inside the
// content slots never render — only the strip is testable.

test.describe('ui/stepper/stepper-linear', () => {
  test('linear strip: renders three steps with stable state attributes', async ({ page }) => {
    await gotoDemo(page, 'ui/stepper/stepper-linear/linear-gating-with-completion-checkboxes');

    const steps = page.locator('button.cngx-stepper__step');
    await expect(steps).toHaveCount(3);

    // Each step exposes its state via data-state.
    for (let i = 0; i < 3; i++) {
      const state = await steps.nth(i).getAttribute('data-state');
      expect(state).not.toBeNull();
    }

    // Step 0 is current.
    await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');

    await expect(page).toHaveScreenshot('stepper-linear.png', { fullPage: true });
  });
});
