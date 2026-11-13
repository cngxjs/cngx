import { expect, test } from '../../_test';
import { clicksOf, countClicks, describedText, gotoDemo } from '../../_helpers';

// Story: CngxButtonBrain on a custom host (the chip button) brings the
// whole contract along: the data-* axes with the host's own defaults and
// fixed size, aria-disabled with the reason through aria-describedby, the
// activation guard, and the run state of a co-hosted cngxAsyncClick. The
// ripple story pins that cngxRipple on the button hosts keeps activation and
// the group axes intact.

const CUSTOM = 'common/button/composition/custom-host';
const RIPPLE = 'common/button/composition/ripple';

test.describe('common/button/composition', () => {
  test('custom-host: the chip gets the brain axes with its own defaults', async ({ page }) => {
    await gotoDemo(page, CUSTOM);
    const artifact = page.locator('.cngx-ex-artifact');

    const filter = artifact.getByRole('button', { name: 'Filter' });
    await expect(filter).toHaveClass(/app-chip-button/);
    await expect(filter).toHaveAttribute('data-variant', 'outline');
    await expect(filter).toHaveAttribute('data-tone', 'neutral');
    await expect(filter).toHaveAttribute('data-size', 'sm');
    await expect(filter).toHaveAttribute('type', 'button');

    const active = artifact.getByRole('button', { name: 'Active' });
    await expect(active).toHaveAttribute('data-variant', 'solid');
    await expect(active).toHaveAttribute('data-tone', 'primary');
    await expect(active).toHaveAttribute('data-size', 'sm');
  });

  test('custom-host: disabled chip is focusable, refuses activation, gives its reason', async ({
    page,
  }) => {
    await gotoDemo(page, CUSTOM);
    const archive = page.locator('.cngx-ex-artifact').getByRole('button', { name: 'Archive' });

    await expect(archive).toHaveAttribute('aria-disabled', 'true');
    await expect(archive).not.toHaveAttribute('disabled');
    await expect
      .poll(() => describedText(page, archive))
      .toBe('Only owners can archive this view.');
    await countClicks(archive);
    await archive.focus();
    await expect(archive).toBeFocused();
    await archive.click({ force: true });
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    expect(await clicksOf(archive)).toBe(0);

    await page.getByRole('button', { name: 'Grant owner role' }).click();
    await expect(archive).not.toHaveAttribute('aria-disabled');
    await expect(archive).not.toHaveAttribute('aria-describedby');
    await archive.click();
    expect(await clicksOf(archive)).toBe(1);
  });

  test('custom-host: the co-hosted run drives the chip busy state', async ({ page }) => {
    await gotoDemo(page, CUSTOM);
    const refresh = page.locator('.cngx-ex-artifact').getByRole('button', { name: 'Refresh' });
    const status = page.locator('.status-row');

    await refresh.click();
    await expect(refresh).toHaveAttribute('data-pending', 'true');
    await expect(refresh).toHaveAttribute('aria-busy', 'true');
    await expect(refresh).toHaveAttribute('data-busy', 'true');
    await expect(refresh.locator('.app-chip-button__busy')).toHaveAttribute('aria-hidden', 'true');
    // Clicks during the run start no second run.
    await refresh.click({ force: true });
    await refresh.click({ force: true });

    await expect(status).toHaveText('Refreshed 1 time(s)', { timeout: 5_000 });
    await expect(refresh).not.toHaveAttribute('data-busy', { timeout: 5_000 });
    await expect(refresh).not.toHaveAttribute('aria-busy', { timeout: 5_000 });
    await expect(refresh).not.toHaveAttribute('data-pending');
    await expect(refresh.locator('.app-chip-button__busy')).toHaveCount(0);
    await expect(status).toHaveText('Refreshed 1 time(s)');
  });

  test('ripple: the wave renders on press and activation still reaches the button', async ({
    page,
  }) => {
    await gotoDemo(page, RIPPLE);
    const artifact = page.locator('.cngx-ex-artifact');
    const save = artifact.getByRole('button', { name: 'Save changes' });
    const add = artifact.getByRole('button', { name: 'Add item' });
    const nav = artifact.getByRole('group', { name: 'Calendar navigation' });
    const today = nav.getByRole('button', { name: 'Today' });

    await expect(save).toHaveAttribute('data-variant', 'solid');
    await expect(add).toHaveAttribute('data-variant', 'outline');
    await expect(today).toHaveAttribute('data-variant', 'outline');

    for (const button of [save, add, today]) {
      await countClicks(button);
      await button.click();
      // The ripple layer is decorative and stays out of the name.
      await expect(button.locator('.cngx-ripple__container')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      await button.focus();
      await page.keyboard.press('Enter');
      expect(await clicksOf(button)).toBe(2);
    }
    await expect(artifact.getByRole('button', { name: 'Save changes', exact: true })).toBeVisible();
  });
});
