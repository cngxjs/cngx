import { expect, test } from '@playwright/test';

import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Proves the reactive-ready i18n surfaces switch EN -> DE without a reload,
// and the flip rule for live regions: the shown text stays until the next
// status change, which then speaks German. Only the surfaces listed here are
// claimed live; static-by-necessity inputs and older tokens are not.

const ROUTE = 'core/i18n/language-pack/live-switch';

test.describe('live language switch', () => {
  test('re-renders the reactive surfaces and keeps the live region until the next status', async ({
    page,
  }) => {
    // Step 6 waits out the story's 30 s action feedback window.
    test.setTimeout(90_000);
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(ROUTE);
    await gotoDemo(page, ROUTE);

    const delta = page.locator('cngx-delta');
    const trend = page.locator('cngx-trend');
    const goal = page.locator('cngx-goal');
    const progress = page.locator('cngx-progress');
    const segmented = page.locator('cngx-segmented-progress');
    const avatarGroup = page.locator('cngx-avatar-group');
    const liveRegion = page.locator('cngx-action-button .cngx-action-button__sr-only[aria-live]');
    const actionButton = page.locator('cngx-action-button').getByRole('button');

    // (1) EN baseline.
    await expect(delta).toHaveAttribute('aria-label', /declined|improved/);
    await expect(trend).toHaveAttribute('aria-label', '+5.3% up');
    await expect(progress).toHaveAttribute('aria-valuetext', '42%');

    // (2) An announcement in English.
    await actionButton.click();
    await expect(liveRegion).toHaveText('Action succeeded');

    // (3) Flip to German, no reload.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(trend).toHaveAttribute('aria-label', /^\+5,3\u00a0% aufwärts$/);
    await expect(delta).toHaveAttribute('aria-label', /^2,1\u00a0% (verbessert|verschlechtert)$/);
    await expect(goal).toHaveAttribute('aria-valuetext', '73 von 100');
    await expect(page.getByLabel('beschäftigt')).toHaveCount(1);
    await expect(avatarGroup).toHaveAttribute('aria-label', /Avatare/);
    await expect(segmented).toHaveAttribute('aria-valuetext', '2 von 4');
    await expect(progress).toHaveAttribute('aria-valuetext', '42\u00a0%');

    // (4) The live region did not re-speak in German.
    await expect(liveRegion).toHaveText('Action succeeded');

    // (5) Popover close button in German.
    await page.getByRole('button', { name: 'Details' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button').last()).toHaveAccessibleName('Schließen');
    await page.keyboard.press('Escape');

    // (6) The next status change speaks German.
    await expect(liveRegion).toHaveText('', { timeout: 40_000 });
    await actionButton.click();
    await expect(liveRegion).toHaveText('Aktion erfolgreich');
  });
});
