import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: CngxSmartDataSource auto-discovers CngxSort + CngxFilter via
// inject() from the host element. The story declares
// `hostDirectives: ['CngxSort', 'CngxFilter']`; the generator now emits
// those onto the component's `@Component` decorator, so DI resolves.

test.describe('common/data/smart-data-source', () => {
  for (const { name, path } of routesIn('common', 'data', 'smart-data-source')) {
    test(`${name}: page mounts without DI errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
