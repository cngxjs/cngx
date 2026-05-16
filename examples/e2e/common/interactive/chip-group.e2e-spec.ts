import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxChipGroup is a single-select listbox of chips. Re-clicking
// the active chip clears the selection. Only one chip is
// aria-selected="true" at a time.

test.describe('common/interactive/chip-group', () => {
  test('basic: click selects, re-click deselects, only one aria-selected at a time', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/chip-group/basic-pick-exactly-one-size');

    const sm = page.locator('cngx-chip[cngxchipingroup]').filter({ hasText: 'SM' });
    const md = page.locator('cngx-chip[cngxchipingroup]').filter({ hasText: 'MD' });
    const lg = page.locator('cngx-chip[cngxchipingroup]').filter({ hasText: 'LG' });

    // Initial selection is 'md'.
    await expect(md).toHaveAttribute('aria-selected', 'true');
    await expect(sm).toHaveAttribute('aria-selected', 'false');

    const caption = page.locator('p.caption').filter({ hasText: 'picked' });
    await expect(caption).toContainText('md');

    // Click lg → lg selected, md deselected.
    await lg.click();
    await expect(lg).toHaveAttribute('aria-selected', 'true');
    await expect(md).toHaveAttribute('aria-selected', 'false');
    await expect(caption).toContainText('lg');

    // Re-click lg → deselected.
    await lg.click();
    await expect(lg).toHaveAttribute('aria-selected', 'false');
    await expect(caption).toContainText('(none)');

    await expect(page).toHaveScreenshot('chip-group-none.png', { fullPage: true });
  });
});
