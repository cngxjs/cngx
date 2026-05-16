import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxListboxTrigger drives an overlay listbox built from
// CngxPopover + CngxListbox. The trigger's label reflects the selected
// option. In this demo the consumer wires only valueChange — closing the
// popover is the user's responsibility (click the trigger again).

test.describe('common/interactive/listbox-trigger', () => {
  test('select-dropdown: click opens listbox, choosing closes and updates label', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/listbox-trigger/select-dropdown');

    const trigger = page.getByRole('button', { name: 'Choose a color' });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

    await trigger.click();

    // The listbox lives inside the popover — it must become visible.
    const listbox = page.getByRole('listbox', { name: 'Color' });
    await expect(listbox).toBeVisible();

    const green = page.getByRole('option', { name: 'Green' });
    await green.click();

    // valueChange wires the selection to the demo signal — trigger label
    // and event-grid both reflect the new value.
    await expect(page.getByRole('button', { name: 'Green' })).toBeVisible();
    const selected = page
      .locator('.event-row')
      .filter({ has: page.getByText('Selected', { exact: true }) })
      .locator('.event-value');
    await expect(selected).toHaveText('green');

    // Clicking the trigger again closes the popover.
    const renamedTrigger = page.getByRole('button', { name: 'Green' });
    await renamedTrigger.click();
    await expect(listbox).toBeHidden();

    await expect(page).toHaveScreenshot('listbox-trigger-green.png', { fullPage: true });
  });
});
