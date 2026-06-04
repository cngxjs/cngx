import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: Tab strip handles overflow when content exceeds container width.

test.describe('ui/tabs/tab-overflow', () => {
  test('8-tabs-in-narrow-container: all 8 tabs are present even when overflowing', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/tabs/tab-overflow/8-tabs-in-a-narrow-container');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(8);

    // Last tab can be activated by clicking, even if it sits in overflow.
    await tabs.nth(7).click();
    await expect(tabs.nth(7)).toHaveAttribute('aria-selected', 'true');

  });
});
