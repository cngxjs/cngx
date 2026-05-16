import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMultiChipGroup is a listbox with aria-multiselectable=true.
// Each chip toggles independently; selectedCount exposes the live count.

test.describe('common/interactive/multi-chip-group', () => {
  test('selection-count: independent toggles drive selectedCount + caption', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/multi-chip-group/multi-select-chips-with-selection-count');

    const urgent = page.getByRole('option', { name: 'urgent' });
    const review = page.getByRole('option', { name: 'review' });
    const blocker = page.getByRole('option', { name: 'blocker' });
    const caption = page.locator('p.caption');

    // Initial selection: urgent + review.
    await expect(urgent).toHaveAttribute('aria-selected', 'true');
    await expect(review).toHaveAttribute('aria-selected', 'true');
    await expect(blocker).toHaveAttribute('aria-selected', 'false');
    await expect(caption).toContainText('urgent, review');

    await blocker.click();
    await expect(blocker).toHaveAttribute('aria-selected', 'true');
    await expect(caption).toContainText('urgent, review, blocker');

    // Deselect urgent — group reflects.
    await urgent.click();
    await expect(urgent).toHaveAttribute('aria-selected', 'false');
    await expect(caption).toContainText('review, blocker');

    await expect(page).toHaveScreenshot('multi-chip-group.png', { fullPage: true });
  });
});
