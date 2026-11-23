import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Stories: canDeactivateWhenClean runs through the Router on the demo's own
// route; CngxBeforeUnload cancels beforeunload only while the form is dirty.

const GUARD_ROUTE = 'common/interactive/guard/route-guard-on-dirty-form';
const UNLOAD_ROUTE = 'common/interactive/guard/protect-dirty-form';

test.describe('common/interactive/guard', () => {
  test('route guard: a dirty form asks before leaving and stays on dismiss', async ({ page }) => {
    await gotoDemo(page, GUARD_ROUTE);

    const lastAttempt = page
      .locator('.event-row')
      .filter({ has: page.getByText('Last leave attempt', { exact: true }) })
      .locator('.event-value');
    await page.getByLabel('Draft note').fill('unsaved text');

    const messages: string[] = [];
    page.once('dialog', (dialog) => {
      messages.push(dialog.message());
      void dialog.dismiss();
    });
    await page.getByRole('button', { name: /Try to leave/ }).click();
    await expect(lastAttempt).toHaveText('blocked');
    expect(messages).toEqual(['You have unsaved changes. Leave anyway?']);
    await expect(page).toHaveURL(new RegExp(`#/${GUARD_ROUTE}$`));

    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: /Try to leave/ }).click();
    await expect(page).toHaveURL(new RegExp(`#/${UNLOAD_ROUTE}$`));
  });

  test('route guard: a clean form leaves without a prompt', async ({ page }) => {
    await gotoDemo(page, GUARD_ROUTE);

    let prompted = false;
    page.on('dialog', (dialog) => {
      prompted = true;
      void dialog.dismiss();
    });
    await page.getByLabel('Draft note').fill('draft');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('button', { name: /Try to leave/ }).click();
    await expect(page).toHaveURL(new RegExp(`#/${UNLOAD_ROUTE}$`));
    expect(prompted).toBe(false);
  });

  test('beforeunload: cancelled only while the draft is dirty', async ({ page }) => {
    await gotoDemo(page, UNLOAD_ROUTE);

    const fireBeforeUnload = () =>
      page.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      });

    expect(await fireBeforeUnload()).toBe(false);
    await page.getByLabel('Draft note').fill('unsaved text');
    await expect(page.getByText('beforeunload will fire')).toBeVisible();
    expect(await fireBeforeUnload()).toBe(true);

    await page.getByRole('button', { name: 'Reset draft' }).click();
    await expect(page.getByText('no guard')).toBeVisible();
    expect(await fireBeforeUnload()).toBe(false);
  });
});
