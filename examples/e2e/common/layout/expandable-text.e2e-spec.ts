import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxExpandableText line-clamps long content and surfaces a Show
// more/Show less toggle that flips aria-expanded. Labels and the toggle
// template are both override-able. Visual clamp is driven by inline
// `-webkit-line-clamp` on the inner div — shipped by the component, not
// by consumer SCSS, so it works in the examples app.

test.describe('common/layout/expandable-text', () => {
  test('auto-toggle: line clamp active until Show more, then expanded', async ({ page }) => {
    await gotoDemo(page, 'common/layout/expandable-text/auto-toggle');

    const widget = page.locator('cngx-expandable-text');
    const inner = widget.locator('div').first();
    await expect(inner).toHaveCSS('-webkit-line-clamp', '3');
    const clampedBox = await inner.boundingBox();
    expect(clampedBox!.height).toBeLessThan(80);

    const expandedState = page
      .locator('.event-row')
      .filter({ has: page.getByText('expanded', { exact: true }) })
      .locator('.event-value');
    await expect(expandedState).toHaveText('false');

    const showMore = page.getByRole('button', { name: 'Show more' });
    await expect(showMore).toBeVisible();
    await expect(showMore).toHaveAttribute('aria-expanded', 'false');
    await showMore.click();

    await expect(expandedState).toHaveText('true');
    const showLess = page.getByRole('button', { name: 'Show less' });
    await expect(showLess).toHaveAttribute('aria-expanded', 'true');

    // Expanded → inner height grows beyond the clamped value.
    const expandedBox = await inner.boundingBox();
    expect(expandedBox!.height).toBeGreaterThan(clampedBox!.height);

    await expect(page).toHaveScreenshot('auto-toggle-expanded.png', { fullPage: true });
  });

  test('custom-labels: moreLabel/lessLabel inputs replace the default text', async ({ page }) => {
    await gotoDemo(page, 'common/layout/expandable-text/custom-labels');

    const showMore = page.getByRole('button', { name: 'Mehr anzeigen' });
    await expect(showMore).toBeVisible();
    await showMore.click();
    await expect(page.getByRole('button', { name: 'Weniger' })).toBeVisible();

    await expect(page).toHaveScreenshot('custom-labels-expanded.png', { fullPage: true });
  });

  test('custom-toggle-template: projected ng-template renders the consumer toggle', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/expandable-text/custom-toggle-template');

    // The consumer's toggle exposes "Expand" / "Collapse" labels with a chevron.
    const expandBtn = page.getByRole('button', { name: /Expand/ });
    await expect(expandBtn).toBeVisible();
    await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
    await expandBtn.click();

    const collapseBtn = page.getByRole('button', { name: /Collapse/ });
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'true');

    await expect(page).toHaveScreenshot('custom-toggle-expanded.png', { fullPage: true });
  });
});
