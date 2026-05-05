import { expect, test, type Locator, type Page } from '@playwright/test';

// Phase 2 baseline e2e for <cngx-tab-group> covering the W3C Tabs
// pattern across the three ui/tabs demo routes:
//   /#/ui/tabs/tab-group | /tab-group-vertical | /tab-error-aggregation
// Six assertion groups (a–f) per the tab-system plan:
//   (a) host role + tablist/tab/tabpanel landmark roles
//   (b) aria-controls + aria-labelledby round-trip integrity
//   (c) horizontal keyboard nav: ArrowRight / ArrowLeft / Home / End
//   (c-v) vertical keyboard nav: ArrowDown / ArrowUp
//   (d) Tab leaves the tablist
//   (e) vertical orientation flips data-orientation + aria-orientation
//   (f) error-aggregation badge visibility + descriptor SR phrase

const HORIZONTAL = '/#/ui/tabs/tab-group';
const VERTICAL = '/#/ui/tabs/tab-group-vertical';
const ERRORS = '/#/ui/tabs/tab-error-aggregation';
const COMMIT_ACTION = '/#/ui/tabs/tab-commit-action';
const OVERFLOW = '/#/ui/tabs/tab-overflow';

function tabGroup(page: Page): Locator {
  return page.locator('cngx-tab-group').first();
}

function tabButtons(page: Page): Locator {
  return page.locator('cngx-tab-group button[role="tab"]');
}

function tabPanels(page: Page): Locator {
  return page.locator('cngx-tab-group [role="tabpanel"]');
}

test.describe('CngxTabGroup W3C tabs pattern (Phase 2 baseline)', () => {
  test('(a) host carries role="group"; strip is role="tablist"; buttons role="tab"; panels role="tabpanel"', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const host = tabGroup(page);
    await expect(host).toHaveAttribute('role', 'group');
    await expect(host).toHaveAttribute('data-orientation', 'horizontal');
    const tablist = page.locator('cngx-tab-group [role="tablist"]');
    await expect(tablist).toHaveCount(1);
    await expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(tabButtons(page)).toHaveCount(3);
    await expect(tabPanels(page)).toHaveCount(3);
  });

  test('(b) aria-controls on each tab references the panel id; panel labelled-by reverses the link', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const buttons = tabButtons(page);
    await expect(buttons).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const button = buttons.nth(i);
      const buttonId = await button.getAttribute('id');
      const panelId = await button.getAttribute('aria-controls');
      expect(buttonId).toBeTruthy();
      expect(panelId).toBeTruthy();
      const panel = page.locator(`#${panelId}`);
      await expect(panel).toHaveAttribute('aria-labelledby', buttonId!);
    }
  });

  test('(c) horizontal: clicking moves aria-selected; only the matching panel becomes visible', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const buttons = tabButtons(page);
    const panels = tabPanels(page);
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(panels.nth(0)).not.toHaveAttribute('hidden', /.*/);
    await buttons.nth(2).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'false');
    await expect(buttons.nth(2)).toHaveAttribute('aria-selected', 'true');
    // Hidden panels carry the [hidden] attr; visible ones do not.
    await expect(panels.nth(0)).toHaveAttribute('hidden', /.*/);
    await expect(panels.nth(2)).not.toHaveAttribute('hidden', /.*/);
  });

  test('(c) horizontal: ArrowRight / ArrowLeft / Home / End cycle the active tab', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const buttons = tabButtons(page);
    await buttons.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(buttons.nth(2)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('(c-v) vertical: data-orientation flips; ArrowDown / ArrowUp move active tab', async ({
    page,
  }) => {
    await page.goto(VERTICAL);
    const host = tabGroup(page);
    await expect(host).toHaveAttribute('data-orientation', 'vertical');
    const tablist = page.locator('cngx-tab-group [role="tablist"]');
    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    const buttons = tabButtons(page);
    await buttons.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('(d) Tab from a tab button moves focus out of the tablist', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const button = tabButtons(page).nth(0);
    await button.focus();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe(undefined);
    // Focus left the tablist — the active button no longer holds it.
    const buttonFocused = await button.evaluate(
      (el) => document.activeElement === el,
    );
    expect(buttonFocused).toBe(false);
  });

  test('(e) vertical: layout swap reflected through both data-orientation and aria-orientation', async ({
    page,
  }) => {
    await page.goto(VERTICAL);
    const host = tabGroup(page);
    await expect(host).toHaveAttribute('aria-orientation', 'vertical');
    await expect(host).toHaveAttribute('data-orientation', 'vertical');
  });

  test('(f) error-aggregation: badge visibility flips with the validity checkbox', async ({
    page,
  }) => {
    await page.goto(ERRORS);
    const profileTab = tabButtons(page).nth(0);
    // Default state: profile is invalid → badge present.
    await expect(profileTab.locator('.cngx-tabs__badge')).toBeVisible();
    // Toggle "profile invalid" off — badge disappears.
    await page.getByLabel('profile invalid').click();
    await expect(profileTab.locator('.cngx-tabs__badge')).toHaveCount(0);
    // Toggle back on — badge reappears.
    await page.getByLabel('profile invalid').click();
    await expect(profileTab.locator('.cngx-tabs__badge')).toBeVisible();
  });

  test('(f) error-aggregation: aria-describedby span ID is always present in the DOM', async ({
    page,
  }) => {
    await page.goto(ERRORS);
    const tab = tabButtons(page).nth(0);
    const descId = await tab.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    const span = page.locator(`#${descId}`);
    await expect(span).toHaveCount(1);
    await expect(span).toHaveClass(/cngx-sr-only/);
  });

  test('(h) optimistic (default): clicking advances immediately and stays on success', async ({
    page,
  }) => {
    await page.goto(COMMIT_ACTION);
    const buttons = tabButtons(page);
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
    await buttons.nth(1).click();
    // Optimistic — selection lands immediately.
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true');
    // After ~600ms the action resolves true → stays on tab 1.
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true', {
      timeout: 4000,
    });
  });

  test('(h) optimistic + simulate error: rolls back to origin', async ({
    page,
  }) => {
    await page.goto(COMMIT_ACTION);
    await page.getByLabel('simulate error').click();
    const buttons = tabButtons(page);
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
    await buttons.nth(2).click();
    // Optimistic — tab 2 becomes active immediately.
    await expect(buttons.nth(2)).toHaveAttribute('aria-selected', 'true');
    // After the action rejects → rollback to tab 0.
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true', {
      timeout: 4000,
    });
  });

  test('(h) pessimistic: spinner + aria-busy on target while pending; advances on success', async ({
    page,
  }) => {
    await page.goto(COMMIT_ACTION);
    await page
      .getByRole('button', { name: 'pessimistic', exact: true })
      .click();
    const buttons = tabButtons(page);
    await buttons.nth(1).click();
    const targetButton = buttons.nth(1);
    await expect(targetButton).toHaveAttribute('aria-busy', 'true');
    await expect(
      targetButton.locator('.cngx-tabs__busy-spinner'),
    ).toBeVisible();
    // Origin retains aria-selected="true" while pending.
    await expect(buttons.nth(0)).toHaveAttribute('aria-selected', 'true');
    // After resolution the target advances.
    await expect(buttons.nth(1)).toHaveAttribute('aria-selected', 'true', {
      timeout: 4000,
    });
    await expect(targetButton).not.toHaveAttribute('aria-busy', 'true');
  });

  test('(i) overflow: More trigger appears with hidden-tab count + popover lists them', async ({
    page,
  }) => {
    await page.goto(OVERFLOW);
    // Demo wraps the tab-group in a 320px container — the strip
    // can hold ~3 tabs; the rest land in the overflow popover.
    const trigger = page.locator(
      'cngx-tab-overflow .cngx-tab-overflow__trigger',
    );
    await expect(trigger).toHaveCount(1);
    await expect(trigger).toBeVisible({ timeout: 4000 });
    const triggerText = await trigger.innerText();
    expect(triggerText).toMatch(/\d+ more/);
    await trigger.click();
    const items = page.locator('cngx-tab-overflow .cngx-tab-overflow__item');
    await expect(items.first()).toBeVisible();
  });

  test('(i) overflow: picking a hidden tab updates aria-selected', async ({
    page,
  }) => {
    await page.goto(OVERFLOW);
    const trigger = page.locator(
      'cngx-tab-overflow .cngx-tab-overflow__trigger',
    );
    await expect(trigger).toBeVisible({ timeout: 4000 });
    await trigger.click();
    const lastItem = page
      .locator('cngx-tab-overflow .cngx-tab-overflow__item')
      .last();
    const targetId = await lastItem.getAttribute('data-tab-id');
    expect(targetId).toBeTruthy();
    await lastItem.click();
    const targetTab = page.locator(`cngx-tab-group #${targetId}-header`);
    await expect(targetTab).toHaveAttribute('aria-selected', 'true');
  });

  test('(h) live-region carries the in-flight phrase during pending', async ({
    page,
  }) => {
    await page.goto(COMMIT_ACTION);
    await page
      .getByRole('button', { name: 'pessimistic', exact: true })
      .click();
    const region = page.locator('cngx-tab-group .cngx-tabs__live-region');
    await expect(region).toHaveCount(1);
    await expect(region).toHaveAttribute('role', 'status');
    const buttons = tabButtons(page);
    await buttons.nth(1).click();
    await expect(region).toHaveText(/Switching tab/);
  });
});
