import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxAvatar is a display atom with an image / initials / content
// fallback cascade plus an optional status indicator. Size and shape are
// driven by inputs.

test.describe('common/display/avatar', () => {
  test('sizes: five size presets render five avatars', async ({ page }) => {
    await gotoDemo(page, 'common/display/avatar/sizes');

    const avatars = page.locator('cngx-avatar');
    await expect(avatars).toHaveCount(5);
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
      await expect(page.locator(`cngx-avatar[size="${size}"]`)).toHaveCount(1);
    }

    // Each avatar shows its initials text inside.
    await expect(avatars.first()).toContainText('A');
    await expect(avatars.nth(1)).toContainText('AB');

    await expect(page).toHaveScreenshot('avatar-sizes.png', { fullPage: true });
  });

  test('shapes-and-status: four status variants + square shape on the last', async ({ page }) => {
    await gotoDemo(page, 'common/display/avatar/shapes-and-status');

    const avatars = page.locator('cngx-avatar');
    await expect(avatars).toHaveCount(4);

    for (const status of ['online', 'busy', 'away', 'offline']) {
      const a = page.locator(`cngx-avatar[status="${status}"]`);
      await expect(a).toHaveCount(1);
    }

    // Status indicator gets its own aria-label so AT announces it.
    const onlineDot = page
      .locator('cngx-avatar[status="online"]')
      .locator('[aria-label]');
    expect(await onlineDot.count()).toBeGreaterThan(0);

    // Last avatar is the square one.
    await expect(page.locator('cngx-avatar[shape="square"]')).toHaveCount(1);

    await expect(page).toHaveScreenshot('shapes-and-status.png', { fullPage: true });
  });

  test('cascade: image, initials, fallback — broken image falls back to initials', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/display/avatar/cascade-image-initials-fallback');

    const avatars = page.locator('cngx-avatar');
    await expect(avatars).toHaveCount(3);

    // The first avatar has a valid src — must render an <img>.
    await expect(avatars.first().locator('img')).toHaveCount(1);

    // The second avatar's src is intentionally broken. After the load error
    // CngxAvatar must fall back to initials JD.
    const second = avatars.nth(1);
    await expect(second).toContainText('JD', { timeout: 5000 });

    // The third has no src and no initials — projected content "?" must show.
    await expect(avatars.nth(2)).toContainText('?');

    await expect(page).toHaveScreenshot('avatar-cascade.png', { fullPage: true });
  });
});
