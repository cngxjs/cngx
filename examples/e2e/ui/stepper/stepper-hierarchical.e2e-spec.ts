import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepGroup nests CngxStep children inside the stepper. The
// strip walks the tree depth-first.

test.describe('ui/stepper/stepper-hierarchical', () => {
  test('hierarchical: 4 leaf steps + 1 trailing root step + 2 group headers', async ({ page }) => {
    await gotoDemo(
      page,
      'ui/stepper/stepper-hierarchical/group-nested-steps-trailing-root-step',
    );

    const steps = page.locator('button.cngx-stepper__step');
    // 4 leaves + 1 root step = 5 step buttons. Group headers occupy slots
    // but are not step buttons themselves.
    await expect(steps).toHaveCount(5);
    await expect(steps).toContainText(['Profile', 'Preferences', 'Repository', 'Pipeline', 'Finish']);

    // Group headers carry data-step-depth=0 with depth-1 nested children.
    const depthAttrs = await steps.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset['stepDepth']),
    );
    // At least one nested (depth=1) and one root (depth=0) — proves the
    // hierarchy actually surfaces in the strip.
    expect(depthAttrs).toContain('1');
    expect(depthAttrs).toContain('0');

    await expect(page).toHaveScreenshot('stepper-hierarchical.png', { fullPage: true });
  });
});
