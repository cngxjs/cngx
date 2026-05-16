import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxBackdrop renders an absolute-positioned overlay over its
// parent container and toggles inert on siblings. Click-to-dismiss
// is wired through (backdropClick).

test.describe('common/layout/backdrop', () => {
  test('overlay-with-inert: backdrop becomes visible, siblings become inert, click dismisses', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/backdrop/overlay-with-inert');

    const status = page.locator('.status-badge').first();
    const backdrop = page.locator('.drawer-backdrop');
    const sibling = page.getByRole('button', { name: /Try clicking me/ });

    await expect(status).toHaveText('hidden');
    await expect(backdrop).not.toHaveClass(/cngx-backdrop--visible/);

    await page.getByRole('button', { name: 'Show backdrop' }).click();
    await expect(status).toHaveText('visible');
    await expect(backdrop).toHaveClass(/cngx-backdrop--visible/);

    // The sibling content block receives inert.
    const siblingContainer = sibling.locator('xpath=ancestor::div[1]');
    await expect(siblingContainer).toHaveAttribute('inert', '');

    // The backdrop is now visually clickable (non-zero box).
    const box = await backdrop.boundingBox();
    expect(box!.height).toBeGreaterThan(0);

    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(status).toHaveText('hidden');
    await expect(page.locator('.status-badge').nth(1)).toContainText('clicks: 1');

  });
});
