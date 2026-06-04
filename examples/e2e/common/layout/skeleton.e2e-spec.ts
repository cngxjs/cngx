import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSkeleton paints the shimmer + loading class while the bound
// signal is true; the host also picks up aria-busy so AT can announce
// loading state. CngxSkeletonContainer is the structural variant that
// repeats a `<ng-template cngxSkeletonPlaceholder>` for the configured
// `count` while loading, then swaps in projected content on toggle.

test.describe('common/layout/skeleton', () => {
  test('skeleton-container: placeholder template repeats while loading, content swaps on toggle', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/skeleton/skeleton-container');

    const container = page.locator('cngx-skeleton');
    await expect(container).toHaveClass(/cngx-skeleton--loading/);

    // Loading state: 3 placeholder card-skeletons rendered (count="3").
    // The placeholders are projected via the cngxSkeletonPlaceholder
    // ng-template — count their inner skeleton-bar divs as proxy.
    const placeholderBars = container.locator('div[style*="height"][style*="border-radius"]');
    expect(await placeholderBars.count()).toBeGreaterThanOrEqual(3);

    await page.getByRole('button', { name: /Loading\.\.\./ }).click();
    await expect(page.getByRole('button', { name: 'Loaded' })).toBeVisible();

    // After toggling off: the three "Card N" content blocks render.
    await expect(container).toContainText('Card 1');
    await expect(container).toContainText('Card 3');

  });

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

  });
});
