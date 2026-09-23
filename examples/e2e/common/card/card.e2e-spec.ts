import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: forms/card/card-demo is the flat-demo for CngxCard — 12 stories
// at common/card/<slug> (no extra category nesting). Smoke each.

test.describe('common/card/card', () => {
  for (const { name, path } of routesIn('common', 'card')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
