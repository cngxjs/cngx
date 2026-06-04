import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxButtonMultiToggleGroup applies the W3C toolbar APG: toggles
// expose aria-selected (not aria-checked); group `[disabled]` cascades
// to every leaf via aria-disabled; per-toggle `[disabled]` blocks just
// that leaf. selectedValues stays in sync as a Set.

test.describe('common/interactive/button-multi-toggle-group', () => {
  test('basic: click toggles selection, aria-selected mirrors each leaf', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/button-multi-toggle-group/basic-multi-filter-toolbar');

    const open = page.getByRole('button', { name: 'Open', exact: true });
    const closed = page.getByRole('button', { name: 'Closed', exact: true });
    const archived = page.getByRole('button', { name: 'Archived', exact: true });

    // Initial selection: ['open'].
    await expect(open).toHaveAttribute('aria-selected', 'true');
    await expect(closed).toHaveAttribute('aria-selected', 'false');
    await expect(archived).toHaveAttribute('aria-selected', 'false');

    await closed.click();
    await expect(closed).toHaveAttribute('aria-selected', 'true');
    await expect(open).toHaveAttribute('aria-selected', 'true');

    // Filters caption mirrors the selection — both visible widget AND code
    // block contain "open, closed", so scope to the caption paragraph.
    const caption = page.locator('p.caption').filter({ hasText: 'Filters' });
    await expect(caption).toContainText('open, closed');

    await open.click();
    await expect(open).toHaveAttribute('aria-selected', 'false');
    await expect(caption).toContainText('closed');

  });

  test('disabled: group cascade vs per-toggle disabled', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/button-multi-toggle-group/disabled-group-cascade-vs-per-toggle',
    );

    const archived = page.getByRole('button', { name: 'Archived (locked)' });
    const open = page.getByRole('button', { name: 'Open', exact: true });
    const closed = page.getByRole('button', { name: 'Closed', exact: true });

    // Per-toggle disabled: aria-disabled true on archived, others usable.
    await expect(archived).toHaveAttribute('aria-disabled', 'true');
    await expect(open).not.toHaveAttribute('aria-disabled', /true/);

    // Toggle group [disabled] — every leaf gets aria-disabled.
    await page.getByRole('button', { name: 'Disable group' }).click();
    await expect(open).toHaveAttribute('aria-disabled', 'true');
    await expect(closed).toHaveAttribute('aria-disabled', 'true');
    await expect(archived).toHaveAttribute('aria-disabled', 'true');

  });
});
