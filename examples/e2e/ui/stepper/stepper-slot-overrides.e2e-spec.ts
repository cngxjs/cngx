import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['busy-spinner', 'ui/stepper/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code'],
  ['error-badge', 'ui/stepper/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code'],
  ['group-header', 'ui/stepper/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code'],
  ['indicator-glyph', 'ui/stepper/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code'],
  ['empty-state', 'ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code'],
  ['rejection-decoration', 'ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code'],
];

test.describe('ui/stepper/stepper-slot-overrides', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
