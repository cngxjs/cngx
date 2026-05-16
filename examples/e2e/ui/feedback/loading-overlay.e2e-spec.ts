import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxLoadingOverlay blocks interaction with inert + backdrop +
// spinner; focus inside the host is saved/restored.

test.describe('ui/feedback/loading-overlay', () => {
  test('overlay-with-form: clicking Save mounts the overlay and inerts the form', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/feedback/loading-overlay/overlay-with-form');

    const save = page.getByRole('button', { name: 'Save (3s)' });
    await save.click();

    await expect(page.getByRole('button', { name: 'Saving...' })).toBeVisible();

    // While loading, the overlay should sit inside <cngx-loading-overlay>.
    const overlay = page.locator('cngx-loading-overlay');
    await expect(overlay).toBeVisible();

    // Form input becomes inert (focus blocked).
    const nameInput = page.getByPlaceholder('Name');
    const isInert = await nameInput.evaluate((el) => {
      let parent: HTMLElement | null = el as HTMLElement;
      while (parent) {
        if (parent.hasAttribute('inert')) return true;
        parent = parent.parentElement;
      }
      return false;
    });
    expect(isInert).toBe(true);

  });
});
