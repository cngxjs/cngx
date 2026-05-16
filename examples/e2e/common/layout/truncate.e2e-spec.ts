import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxTruncate clamps a paragraph to N lines via inline
// `-webkit-line-clamp`. `isClamped()` is true only when the content
// actually overflows; the demo wires that into a "Show more" toggle so
// the toggle is suppressed for short content.

test.describe('common/layout/truncate', () => {
  test('truncated-text-with-toggle: long content shows toggle and toggles expansion', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/truncate/truncated-text-with-toggle');

    const isClamped = page
      .locator('.event-row')
      .filter({ has: page.getByText('isClamped', { exact: true }) })
      .locator('.event-value');
    const expandedState = page
      .locator('.event-row')
      .filter({ has: page.getByText('expanded', { exact: true }) })
      .locator('.event-value');

    await expect(isClamped).toHaveText('true');
    await expect(expandedState).toHaveText('false');

    const para = page.locator('p[cngxtruncate]').first().or(page.locator('p[style*="line-height"]').first());
    const clampedHeight = (await para.boundingBox())!.height;

    const showMore = page.getByRole('button', { name: 'Show more' });
    await expect(showMore).toBeVisible();
    await expect(showMore).toHaveAttribute('aria-expanded', 'false');
    await showMore.click();

    await expect(expandedState).toHaveText('true');
    const expandedHeight = (await para.boundingBox())!.height;
    expect(expandedHeight).toBeGreaterThan(clampedHeight);

    await expect(page).toHaveScreenshot('truncate-expanded.png', { fullPage: true });
  });

  test('short-text-no-toggle: short content suppresses the toggle button', async ({ page }) => {
    await gotoDemo(page, 'common/layout/truncate/short-text-no-toggle');

    const isClamped = page
      .locator('.event-row')
      .filter({ has: page.getByText('isClamped', { exact: true }) })
      .locator('.event-value');

    // Content fits within 3 lines → isClamped is false → no Show more.
    await expect(isClamped).toHaveText('false');
    await expect(page.getByRole('button', { name: 'Show more' })).toHaveCount(0);

    await expect(page).toHaveScreenshot('short-text-no-toggle.png', { fullPage: true });
  });
});
