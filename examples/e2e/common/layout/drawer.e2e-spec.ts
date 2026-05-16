import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['basic', 'common/layout/drawer/basic-scroll-lock-backdrop'],
  ['controlled', 'common/layout/drawer/controlled-mode'],
  ['directions', 'common/layout/drawer/direction-all-four-sides'],
  ['events', 'common/layout/drawer/events-openedchange-closed'],
  ['mode', 'common/layout/drawer/mode-over-push-side'],
  ['consumer-wiring', 'common/layout/drawer/pattern-consumer-wiring'],
];

test.describe('common/layout/drawer', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
