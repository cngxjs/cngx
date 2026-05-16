import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepper supports per-step label overrides via the
// `<ng-template cngxStepLabel>` slot. In THIS demo, only the `[label]`
// input renders — the template slot's icons/chips never appear because
// the generated component doesn't import CngxStepLabel into its
// `@Component({ imports })` (logged as the recurring "missing structural
// directive import" generator bug). Test what works: step count, labels,
// active-step toggling.

test.describe('ui/stepper/stepper-custom-labels', () => {
  test('labels render from [label] input, active step changes on click', async ({ page }) => {
    await gotoDemo(
      page,
      'ui/stepper/stepper-custom-labels/mixing-code-label-code-input-with-code-cngxsteplabel-code-slot',
    );

    const steps = page.locator('button.cngx-stepper__step');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(0)).toContainText('Profile');
    await expect(steps.nth(1)).toContainText('Notifications');
    await expect(steps.nth(2)).toContainText('Security');
    await expect(steps.nth(3)).toContainText('Done');

    const activeRow = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active step', { exact: true }) })
      .locator('.event-value');
    await expect(activeRow).toHaveText('0');

    await steps.nth(2).click();
    await expect(activeRow).toHaveText('2');
    await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step');

    await expect(page).toHaveScreenshot('stepper-custom-labels.png', { fullPage: true });
  });
});
