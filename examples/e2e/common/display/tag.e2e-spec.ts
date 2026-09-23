import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: CngxTag — 13 stories cover variants, density, slots, link mode,
// group semantic, truncation, config provider.

test.describe('common/display/tag', () => {
  for (const { name, path } of routesIn('common', 'display', 'tag')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
