import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSmartDataSource auto-discovers CngxSort + CngxFilter via
// inject() from the host element. The story declares
// `hostDirectives: ['CngxSort', 'CngxFilter']`; the generator now emits
// those onto the component's `@Component` decorator, so DI resolves.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['auto-wired', 'common/data/smart-data-source/auto-wired'],
  ['how-it-works', 'common/data/smart-data-source/how-it-works-hostdirectives-inject'],
  ['paginate-hostdirective', 'common/data/smart-data-source/smartdatasource-cngxpaginate-hostdirective'],
];

test.describe('common/data/smart-data-source', () => {
  for (const [name, route] of routes) {
    test(`${name}: page mounts without DI errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      expect(errors).toEqual([]);
      await expect(page).toHaveScreenshot(`smart-data-source-${name}.png`, { fullPage: true });
    });
  }
});
