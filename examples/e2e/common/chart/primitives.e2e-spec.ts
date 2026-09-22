import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: chart/primitives stories cover the low-level building blocks.

test.describe('common/chart/primitives', () => {
  for (const { name, path } of routesIn('common', 'chart', 'primitives')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      // async-state-machine starts in idle (no SVG); other stories paint
      // an SVG immediately. Smoke that the header rendered is enough.
    });
  }
});
