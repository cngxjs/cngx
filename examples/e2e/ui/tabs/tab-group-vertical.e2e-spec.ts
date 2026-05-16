import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: Vertical tab group — orientation="vertical".

test.describe('ui/tabs/tab-group-vertical', () => {
  test('vertical-sidebar-tabs: tabs render with vertical aria-orientation', async ({ page }) => {
    await gotoDemo(page, 'ui/tabs/tab-group-vertical/vertical-sidebar-tabs');

    const tablist = page.getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');

    const tabs = page.getByRole('tab');
    expect(await tabs.count()).toBeGreaterThanOrEqual(2);
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

  });
});
