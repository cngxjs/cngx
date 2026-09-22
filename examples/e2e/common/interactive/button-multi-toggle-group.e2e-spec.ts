import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxButtonMultiToggleGroup applies the W3C toolbar APG: toggles
// expose aria-pressed (not aria-checked); group `[disabled]` cascades
// to every leaf via aria-disabled; per-toggle `[disabled]` blocks just
// that leaf. selectedValues stays in sync as a Set.

test.describe('common/interactive/button-multi-toggle-group', () => {
  test('basic: click toggles selection, aria-pressed mirrors each leaf', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/button-toggle/multi-group/basic-multi-filter-toolbar');

    const open = page.getByRole('button', { name: 'Open', exact: true });
    const closed = page.getByRole('button', { name: 'Closed', exact: true });
    const archived = page.getByRole('button', { name: 'Archived', exact: true });

    // Initial selection: ['open'].
    await expect(open).toHaveAttribute('aria-pressed', 'true');
    await expect(closed).toHaveAttribute('aria-pressed', 'false');
    await expect(archived).toHaveAttribute('aria-pressed', 'false');

    await closed.click();
    await expect(closed).toHaveAttribute('aria-pressed', 'true');
    await expect(open).toHaveAttribute('aria-pressed', 'true');

    // Filters caption mirrors the selection — both visible widget AND code
    // block contain "open, closed", so scope to the caption paragraph.
    const caption = page.locator('p.demo-button-toggle-caption').filter({ hasText: 'Filters' });
    await expect(caption).toContainText('open, closed');

    await open.click();
    await expect(open).toHaveAttribute('aria-pressed', 'false');
    await expect(caption).toContainText('closed');

  });

  test('disabled: group cascade vs per-toggle disabled', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/button-toggle/multi-group/disabled-group-cascade-vs-per-toggle',
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
