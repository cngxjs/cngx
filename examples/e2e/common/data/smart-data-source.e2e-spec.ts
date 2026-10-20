import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: CngxSmartDataSource auto-discovers CngxSort + CngxFilter via
// inject() from the host element. The story declares
// `hostDirectives: ['CngxSort', 'CngxFilter']`; the generator now emits
// those onto the component's `@Component` decorator, so DI resolves.

test.describe('common/data/smart-data-source', () => {
  for (const { name, path } of routesIn('common', 'data', 'smart-data-source')) {
    // A DI error surfaces as a page error, which the console guard fails on.
    test(`${name}: page mounts without DI errors`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
