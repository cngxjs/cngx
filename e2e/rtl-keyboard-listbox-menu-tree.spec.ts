import { expect, test, type Locator, type Page } from '@playwright/test';

// RTL keyboard-navigation contracts for the listbox/roving, menu+submenu,
// ui/context-menu organism, and tree-select families. Each family reads a
// live `injectDirection()` signal; flipping `html[dir="rtl"]` at runtime must
// invert the inline-axis arrows per WAI-ARIA APG while the block axis stays
// fixed. Mirrors the runtime-flip pattern in e2e/css-contract-rtl.spec.ts.

const R = {
  roving: '/#/common/a11y/roving-tabindex/horizontal-toolbar',
  menuSubmenu: '/#/common/interactive/menu/submenu/two-level-submenu',
  contextSubmenu: '/#/ui/context-menu/submenu/nested-export-menu',
  treeSelect: '/#/forms/select/tree-select/basic-single-level-toggle',
};

function setRtl(page: Page): Promise<void> {
  return page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'));
}

test.describe('RTL keyboard navigation — listbox, menu, tree', () => {
  test('roving toolbar: ArrowLeft advances in reading order, ArrowRight retreats', async ({
    page,
  }) => {
    await page.goto(R.roving);
    await setRtl(page);
    const buttons = page.locator('.cngx-ex-artifact button.chip');
    await expect(buttons.first()).toBeVisible();

    // Bold (index 0) is the initial tab stop.
    await buttons.nth(0).focus();
    await expect(buttons.nth(0)).toBeFocused();

    // Under rtl the physical ArrowLeft is inline-forward: Bold -> Italic -> Underline.
    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(2)).toBeFocused();

    // Physical ArrowRight is inline-back: Underline -> Italic.
    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(1)).toBeFocused();
  });

  test('menu submenu: ArrowLeft opens the submenu, ArrowRight pops it', async ({ page }) => {
    await page.goto(R.menuSubmenu);
    await setRtl(page);

    const trigger = page.getByRole('button', { name: 'File menu' });
    await trigger.focus();
    await page.keyboard.press('ArrowDown'); // open outer, highlight New
    await expect(page.locator('[role="menu"]').first()).toBeVisible();
    await page.keyboard.press('ArrowDown'); // highlight Open Recent

    const planItem = page.getByRole('menuitem', { name: 'plan.md' });
    await expect(planItem).toBeHidden();

    // rtl: physical ArrowLeft is inline-forward -> opens the submenu.
    await page.keyboard.press('ArrowLeft');
    await expect(planItem).toBeVisible();

    // rtl: physical ArrowRight is inline-back -> pops the submenu.
    await page.keyboard.press('ArrowRight');
    await expect(planItem).toBeHidden();
  });

  test('ui/context-menu organism: ArrowLeft opens the submenu, ArrowRight pops it', async ({
    page,
  }) => {
    await page.goto(R.contextSubmenu);
    await setRtl(page);

    const zone = page.locator('.demo-ctx-zone');
    await zone.click({ button: 'right' });
    await expect(page.locator('[role="menu"]').first()).toBeVisible();

    const pdfItem = page.getByRole('menuitem', { name: 'PDF' });
    await expect(pdfItem).toBeHidden();

    // Rename (0), Duplicate (1), Export as (2) — two ArrowDowns land on the submenu parent.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // rtl: physical ArrowLeft opens the export submenu; ArrowRight pops it.
    await page.keyboard.press('ArrowLeft');
    await expect(pdfItem).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(pdfItem).toBeHidden();
  });

  test('tree-select: ArrowRight collapses a parent, ArrowLeft expands it', async ({ page }) => {
    await page.goto(R.treeSelect);
    await setRtl(page);

    const section = page.locator('main');
    const trigger = section.locator('cngx-tree-select [role="combobox"]').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const tree = page.locator('[role="tree"]').first();
    const frontend: Locator = tree.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });

    // initiallyExpanded='all' -> Frontend starts open.
    await expect(frontend).toHaveAttribute('aria-expanded', 'true');

    // rtl: physical ArrowRight is inline-back -> collapse.
    await tree.press('ArrowRight');
    await expect(frontend).toHaveAttribute('aria-expanded', 'false');

    // rtl: physical ArrowLeft is inline-forward -> expand.
    await tree.press('ArrowLeft');
    await expect(frontend).toHaveAttribute('aria-expanded', 'true');
  });
});
