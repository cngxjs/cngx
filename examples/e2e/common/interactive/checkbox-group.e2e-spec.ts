import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxCheckboxGroup tracks selectedValues. allSelected /
// someSelected drive a "select all" master CngxCheckbox: aria-checked
// flips between true / false / "mixed".

test.describe('common/interactive/checkbox-group', () => {
  test('basic: master aria-checked reflects mixed/all/none and toggleAll cycles', async ({
    page,
  }) => {
    await gotoDemo(
      page,
      'common/interactive/checkbox-group/basic-select-all-master-projected-leaves',
    );

    const master = page.locator('cngx-checkbox').filter({ hasText: 'Select all' });
    const email = page.locator('cngx-checkbox').filter({ hasText: 'email' }).first();
    const sms = page.locator('cngx-checkbox').filter({ hasText: 'sms' }).first();
    const push = page.locator('cngx-checkbox').filter({ hasText: 'push' }).first();

    // Initial: email is picked; master must read aria-checked="mixed"
    // because someSelected=true while allSelected=false.
    await expect(master).toHaveAttribute('aria-checked', 'mixed');
    await expect(email).toHaveAttribute('aria-checked', 'true');
    await expect(sms).toHaveAttribute('aria-checked', 'false');

    // Click master → toggleAll selects all.
    await master.click();
    await expect(master).toHaveAttribute('aria-checked', 'true');
    await expect(sms).toHaveAttribute('aria-checked', 'true');
    await expect(push).toHaveAttribute('aria-checked', 'true');

    const caption = page.locator('p.caption').filter({ hasText: 'Picked' });
    await expect(caption).toContainText('email, sms, push');

    // Click master again → toggleAll clears all.
    await master.click();
    await expect(master).toHaveAttribute('aria-checked', 'false');
    await expect(email).toHaveAttribute('aria-checked', 'false');

    // Click one leaf → back to mixed.
    await sms.click();
    await expect(master).toHaveAttribute('aria-checked', 'mixed');
    await expect(caption).toContainText('sms');

  });

  test('disabled cascade: group [disabled] reflects on every leaf', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/checkbox-group/disabled-cascade');

    const leaves = page.locator('cngx-checkbox-group cngx-checkbox');
    const firstLeaf = leaves.first();

    // Toggle disabled on, all leaves become aria-disabled.
    await page.getByRole('button', { name: /Disable/ }).click();
    await expect(firstLeaf).toHaveAttribute('aria-disabled', 'true');
    const total = await leaves.count();
    for (let i = 0; i < total; i++) {
      await expect(leaves.nth(i)).toHaveAttribute('aria-disabled', 'true');
    }

  });
});
