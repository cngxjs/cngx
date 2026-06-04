import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['basic-list', 'common/data/recycler/basic-list-fixed-item-height'],
  ['content-visibility', 'common/data/recycler/content-visibility-css-only'],
  ['infinite-scroll', 'common/data/recycler/infinite-scroll-recycler'],
  ['scrolltoindex', 'common/data/recycler/scrolltoindex-deep-link'],
  ['variable-heights', 'common/data/recycler/variable-heights-cngxmeasure'],
  ['async-state', 'common/data/recycler/with-cngxasyncstate-skeleton-first-load'],
];

test.describe('common/data/recycler', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
