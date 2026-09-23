import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: CngxPopover (flat demo) — click, controlled-open, escape-mode,
// placement variants. The popover-panel and tooltip families have their
// own specs.

test.describe('common/popover/popover', () => {
  for (const { name, path } of routesIn('common', 'popover')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
