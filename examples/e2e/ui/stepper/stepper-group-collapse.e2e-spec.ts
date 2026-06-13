import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Focus-driven group collapse (groupCollapse: 'expand-active'). The demo
// has two groups - Account (Profile, Preferences) and Project (Repository,
// Pipeline) - plus a trailing root step (Finish). Arrow-key navigation
// must traverse INTO a collapsed group, expanding it, and keep focus on
// the newly-active step button after the strip re-renders its node set.

const ROUTE = 'ui/stepper/stepper-hierarchical/expand-active-group-collapse';
function activeLocator(page: import('@playwright/test').Page) {
  return page.locator('cngx-stepper button.cngx-stepper__step[aria-current="step"]').first();
}

test.describe('ui/stepper/stepper-group-collapse', () => {
  test('arrow keys traverse collapsed group boundaries and keep focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoDemo(page, ROUTE);

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    const active = activeLocator(page);
    await expect(active).toHaveText(/Profile/);
    await active.focus();

    // Within the Account group.
    await page.keyboard.press('ArrowRight');
    await expect(activeLocator(page)).toHaveText(/Preferences/);

    // Cross into Project: Account collapses, Project expands, focus must
    // land on Repository (not get stranded on body when the old button
    // leaves the DOM).
    await page.keyboard.press('ArrowRight');
    const crossed = activeLocator(page);
    await expect(crossed).toHaveText(/Repository/);
    await expect(crossed).toBeFocused();

    // Navigation keeps working after the crossing.
    await page.keyboard.press('ArrowRight');
    await expect(activeLocator(page)).toHaveText(/Pipeline/);
    await expect(activeLocator(page)).toBeFocused();

    // Backwards across the boundary too: Project collapses, Account expands.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(activeLocator(page)).toHaveText(/Preferences/);
    await expect(activeLocator(page)).toBeFocused();
  });
});
