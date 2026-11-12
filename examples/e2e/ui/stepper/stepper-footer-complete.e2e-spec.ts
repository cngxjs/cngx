import { expect, test } from '../../_test';
import { attributeLogOf, gotoDemo, recordAttributes } from '../../_helpers';

// Story: on the last step the footer swaps Continue for a
// [cngxStepperComplete] button that composes cngxAsyncClick. Finish keeps its
// label while the action runs, is aria-busy and aria-disabled in flight, and
// speaks the result through the polite region next to it; (completed) fires
// after the run succeeds.

const ROUTE = 'ui/stepper/stepper-footer/complete-finish-button';

test.describe('ui/stepper/stepper-footer complete', () => {
  test('complete-finish-button: Finish runs busy, keeps its label, speaks and fires (completed)', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);
    const footer = page.locator('cngx-stepper-footer');

    await footer.getByRole('button', { name: 'Continue' }).click();
    await footer.getByRole('button', { name: 'Continue' }).click();
    const finish = footer.getByRole('button', { name: 'Finish' });
    await expect(finish).toBeVisible();
    await expect(footer.getByRole('button', { name: 'Continue' })).toHaveCount(0);

    await recordAttributes(finish, ['aria-busy']);
    await finish.click();
    await expect(finish).toHaveAttribute('aria-busy', 'true');
    await expect(finish).toHaveAttribute('aria-disabled', 'true');
    await expect(finish).toHaveText('Finish');

    const region = footer.locator('button + [aria-live="polite"]');
    await expect(region).toHaveText('Action succeeded', { timeout: 5_000 });
    await expect(page.locator('.event-row')).toContainText('Submitted - (completed) fired');
    await expect(finish).not.toHaveAttribute('aria-busy');
    expect(await attributeLogOf(finish)).toEqual(['aria-busy=true', 'aria-busy=null']);

    await finish.click();
    await expect(finish).not.toHaveAttribute('aria-busy', { timeout: 5_000 });
    await expect
      .poll(() => attributeLogOf(finish))
      .toEqual(['aria-busy=true', 'aria-busy=null', 'aria-busy=true', 'aria-busy=null']);
    await expect(finish).toHaveText('Finish');
  });
});
