import { expect, test, type Locator, type Page } from '@playwright/test';

// Phase B e2e for the routed-tabs CanDeactivate demo. The route renders
// one page, so the guard is simulated with a dirty-form signal - the
// pessimistic gate is identical to createTabRouterCommit() refusing on a
// NavigationCancel. Asserts: a guard-blocked switch keeps the active tab,
// the refused target shows the rejection icon, the dirty tab keeps its
// [error] badge, and clearing the form lets the switch through.

const ROUTE = '/#/ui/tabs/tab-router-outlet/candeactivate-guarded-tabs';

function tabButtons(page: Page): Locator {
  return page.locator('cngx-tab-group button[role="tab"]');
}

test.describe('Routed tabs gated by a CanDeactivate guard', () => {
  test('a guard-blocked switch keeps the active tab and lights the rejection icon', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const buttons = tabButtons(page);
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');

    // Dirty the editor → the editor tab lights its [error] badge.
    await page.locator('#rg-draft').fill('unsaved text');
    await expect(buttons.nth(0).locator('.cngx-tabs__badge')).toBeVisible();

    // Try to leave: pessimistic guard refuses, active tab stays on the
    // editor, the refused target shows the rejection icon.
    await buttons.nth(1).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'false');
    await expect(buttons.nth(1).locator('.cngx-tabs__rejection-icon')).toBeVisible();
  });

  test('saving clears the form so the routed switch advances and the panel swaps', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const buttons = tabButtons(page);
    const panels = page.locator('cngx-tab-group [role="tabpanel"]');

    await page.locator('#rg-draft').fill('unsaved text');
    await buttons.nth(1).click();
    // Blocked → still on the editor.
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');

    // Save clears the dirty flag → the editor badge disappears.
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(buttons.nth(0).locator('.cngx-tabs__badge')).toHaveCount(0);

    // The switch now resolves → preview becomes active and its panel shows.
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(panels.nth(1)).not.toHaveAttribute('hidden', /.*/);
    await expect(panels.nth(0)).toHaveAttribute('hidden', /.*/);
  });
});
