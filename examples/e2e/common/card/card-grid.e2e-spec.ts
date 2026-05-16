import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { expectComputedDisplay, expectGridLayout } from '../../_helpers';

// Story: CngxCardGrid renders items intrinsically via CSS Grid, supports a
// density switch, and chooses an empty-state template based on `emptyReason`.

test.describe('common/card/card-grid', () => {
  test('basic grid: 6 cards laid out in a real CSS grid', async ({ page }) => {
    await gotoDemo(page, 'common/card/card-grid/basic-grid');

    const grid = page.locator('cngx-card-grid');
    await expectComputedDisplay(grid, 'grid');

    const cards = page.getByRole('button', { name: /^(Alpha|Beta|Gamma|Delta|Epsilon|Zeta)$/ });
    await expect(cards).toHaveCount(6);
    // Multi-column layout: items must not all share the same x position.
    await expectGridLayout(cards);

  });

  test('density variants: switching density updates the active chip', async ({ page }) => {
    await gotoDemo(page, 'common/card/card-grid/density-variants');

    const grid = page.locator('cngx-card-grid');
    await expectComputedDisplay(grid, 'grid');

    const compactBtn = page.getByRole('button', { name: 'Compact' });
    const comfortableBtn = page.getByRole('button', { name: 'Comfortable' });

    await expect(page.getByRole('button', { name: 'Default' })).toHaveClass(/chip--active/);

    await compactBtn.click();
    await expect(compactBtn).toHaveClass(/chip--active/);
    await expect(grid).toHaveClass(/cngx-card-grid--compact/);

    await comfortableBtn.click();
    await expect(comfortableBtn).toHaveClass(/chip--active/);
    await expect(grid).toHaveClass(/cngx-card-grid--comfortable/);

  });

  test('empty-state with reason: each reason renders its dedicated template', async ({ page }) => {
    await gotoDemo(page, 'common/card/card-grid/empty-state-with-reason');

    const grid = page.locator('cngx-card-grid');
    await expect(grid).toContainText('Welcome!');

    await page.getByRole('button', { name: 'no-results', exact: true }).click();
    await expect(grid).toContainText('No results found');

    await page.getByRole('button', { name: 'cleared', exact: true }).click();
    await expect(grid).toContainText('All done');

  });
});
