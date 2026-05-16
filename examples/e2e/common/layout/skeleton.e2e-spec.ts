import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSkeleton paints the shimmer + loading class while the bound
// signal is true; the host also picks up aria-busy so AT can announce
// loading state. Toggling the demo button flips both.
//
// Note: CngxSkeletonContainer (the structural ng-template variant) is
// covered by a separate route but is currently broken — see
// .internal/e2e/error-log.md (CngxSkeletonPlaceholder missing from the
// generated demo's imports array).

test.describe('common/layout/skeleton', () => {
  test('basic-skeleton: shimmer class + aria-busy track the loading signal', async ({ page }) => {
    await gotoDemo(page, 'common/layout/skeleton/basic-skeleton');

    const skeletons = page.locator('.cngx-skeleton');
    await expect(skeletons).toHaveCount(3);

    // Initial state: loading=true → all skeletons painted + aria-busy.
    for (let i = 0; i < 3; i++) {
      const s = skeletons.nth(i);
      await expect(s).toHaveClass(/cngx-skeleton--loading/);
      await expect(s).toHaveClass(/cngx-skeleton--shimmer/);
      await expect(s).toHaveAttribute('aria-busy', 'true');
    }

    // Toggle off — classes and aria-busy drop.
    await page.getByRole('button', { name: /Loading\.\.\./ }).click();
    await expect(page.getByRole('button', { name: 'Loaded' })).toBeVisible();
    for (let i = 0; i < 3; i++) {
      const s = skeletons.nth(i);
      await expect(s).not.toHaveClass(/cngx-skeleton--loading/);
      await expect(s).not.toHaveAttribute('aria-busy', /true/);
    }

    await expect(page).toHaveScreenshot('skeleton-loaded.png', { fullPage: true });
  });
});
