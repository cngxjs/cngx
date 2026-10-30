import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxTabNav is a role="navigation" landmark of real <a> links -
// not a tablist of buttons. The router CanDeactivate guard is simulated
// locally (the sandbox has no router); the rendered elements are anchors,
// so the native link affordances (middle-click, hover URL) are present.

test.describe('ui/tabs/tab-router-nav', () => {
  test('anchors carry aria-current, render as links, and the guard holds Profile', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/tabs/tab-router-nav/native-routerlink-nav');

    const nav = page.getByRole('navigation', { name: 'Routed account navigation' });
    await expect(nav).toBeVisible();
    // This path is a navigation landmark - no tablist / tab roles.
    await expect(page.getByRole('tablist')).toHaveCount(0);

    const overview = page.getByRole('link', { name: 'Overview' });
    const profile = page.getByRole('link', { name: 'Profile' });
    const settings = page.getByRole('link', { name: 'Settings' });

    // Rendered as <a href>, not <button> - the native link affordance that
    // the programmatic tablist path lacks.
    await expect(overview).toHaveJSProperty('tagName', 'A');
    await expect(profile).toHaveAttribute('href', /#\/profile$/);

    // Route-derived active marker.
    await expect(overview).toHaveAttribute('aria-current', 'page');
    await expect(profile).not.toHaveAttribute('aria-current', 'page');

    await profile.click();
    await expect(profile).toHaveAttribute('aria-current', 'page');
    await expect(overview).not.toHaveAttribute('aria-current', 'page');

    // Turn on unsaved changes: the link reveals aria-invalid, and trying to
    // leave Profile is refused (native CanDeactivate) - the active link stays.
    await page.getByLabel(/unsaved changes/i).check();
    await expect(profile).toHaveAttribute('aria-invalid', 'true');

    await settings.click();
    await expect(profile).toHaveAttribute('aria-current', 'page');
    await expect(settings).not.toHaveAttribute('aria-current', 'page');

    const blocked = page
      .locator('.event-row')
      .filter({ has: page.getByText('leave blocked', { exact: true }) })
      .locator('.event-value');
    await expect(blocked).toHaveText('true');

    // Resolve the changes, then the leave succeeds.
    await page.getByLabel(/unsaved changes/i).uncheck();
    await settings.click();
    await expect(settings).toHaveAttribute('aria-current', 'page');
    await expect(profile).not.toHaveAttribute('aria-current', 'page');
  });

  test('an invalid link renders the leading alert icon (visual partner of aria-invalid)', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/tabs/tab-router-nav/native-routerlink-nav');

    const profile = page.getByRole('link', { name: 'Profile' });
    const icon = profile.locator('.cngx-tab-link__error-icon');

    // No error yet: no icon.
    await expect(profile).not.toHaveAttribute('aria-invalid', 'true');
    await expect(icon).toHaveCount(0);

    // Mark the link invalid: aria-invalid AND the alert icon both light up.
    // The icon is aria-hidden, so the link's name stays "Profile".
    await page.getByLabel(/unsaved changes/i).check();
    await expect(profile).toHaveAttribute('aria-invalid', 'true');
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon.locator('svg path')).toHaveAttribute('d', /^M12 3L2 20\.5h20z/);
    await expect(icon).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profile', exact: true })).toHaveCount(1);

    await page.getByLabel(/unsaved changes/i).uncheck();
    await expect(icon).toHaveCount(0);
  });
});
