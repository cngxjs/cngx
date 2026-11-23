import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxExpandable is passive; the demos put it on the focusable toggle
// button, so the control that takes focus also carries aria-expanded.

test.describe('common/interactive/expandable', () => {
  test('uncontrolled-toggle: the focusable button carries the expanded state', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/expandable/uncontrolled-toggle');

    await expect(page.getByRole('tree')).toHaveCount(0);
    const toggle = page.getByRole('button', { name: 'Parent row' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'expandable-demo-children');

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#expandable-demo-children')).toBeVisible();
  });

  test('controlled-by-external-state: each row button mirrors the shared signal', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/expandable/controlled-by-external-state');

    const rowA = page.getByRole('button', { name: 'row-a' });
    const rowB = page.getByRole('button', { name: 'row-b' });
    await expect(rowA).toHaveAttribute('aria-expanded', 'true');
    await expect(rowB).toHaveAttribute('aria-expanded', 'false');

    await rowB.focus();
    await page.keyboard.press(' ');
    await expect(rowB).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#row-b-content')).toBeVisible();
  });
});
