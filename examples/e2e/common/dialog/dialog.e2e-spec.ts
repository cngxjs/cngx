import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: CngxDialog — alert, bottom-sheet, draggable,
// grid-snap, nested-stack, programmatic, template-directives, etc.

test.describe('common/dialog/dialog', () => {
  for (const { name, path } of routesIn('common', 'dialog')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
