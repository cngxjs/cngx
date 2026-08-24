import { expect, test, type Locator, type Page } from '@playwright/test';

// RTL anchor-positioning geometry contracts. Phase 1 resolves placement in TS
// (resolveDirectionalPlacement) at the CngxPopover effectivePlacement source and
// in the CngxTooltip directionalPlacement computed; the mirror LOGIC is proven
// browser-agnostically in the popover/tooltip/anchor-positioning unit specs.
// This file proves the visible result on real anchor geometry: a side-placed
// panel that opens inline-forward under ltr opens inline-start (left) under
// html[dir="rtl"]. Runtime-flip pattern mirrors e2e/css-contract-rtl.spec.ts.
//
// Chromium-only: the panels position through CSS Anchor Positioning
// (`position-area`), and the examples app registers no `provideFloatingFallback`.
// Anchor positioning is a Chromium capability today (the popover source records
// the Chrome-140 support baseline); firefox/webkit render these panels
// unanchored, so anchor geometry is not assertable there. The direction-mirror
// itself is TS and covered in every unit environment.
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'CSS Anchor Positioning is Chromium-only; the direction-mirror logic is covered by the unit specs across every environment',
);

const R = {
  menuSubmenu: '/#/common/interactive/menu/submenu/two-level-submenu',
  contextSubmenu: '/#/ui/context-menu/submenu/nested-export-menu',
  treeSelect: '/#/forms/select/tree-select/basic-single-level-toggle',
  popoverVariants: '/#/common/popover/placement-variants',
  tooltipPlacement: '/#/common/popover/tooltip/placement',
};

function setRtl(page: Page): Promise<void> {
  return page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'));
}

function clearRtl(page: Page): Promise<void> {
  return page.locator('html').evaluate((el) => el.removeAttribute('dir'));
}

async function centerX(loc: Locator): Promise<number> {
  const box = await loc.boundingBox();
  if (!box) {
    throw new Error('element has no bounding box (not rendered)');
  }
  return box.x + box.width / 2;
}

async function leftEdge(loc: Locator): Promise<number> {
  const box = await loc.boundingBox();
  if (!box) {
    throw new Error('element has no bounding box (not rendered)');
  }
  return box.x;
}

test.describe('RTL anchor positioning: side-placed panels mirror to the inline-start side', () => {
  test('menu submenu opens left of its parent item under rtl', async ({ page }) => {
    await page.goto(R.menuSubmenu);
    await page.setViewportSize({ width: 1280, height: 900 });
    await setRtl(page);

    const trigger = page.getByRole('button', { name: 'File menu' });
    await trigger.focus();
    await page.keyboard.press('ArrowDown'); // open outer, highlight New
    await expect(page.locator('[role="menu"]').first()).toBeVisible();
    await page.keyboard.press('ArrowDown'); // highlight Open Recent
    // rtl: physical ArrowLeft is inline-forward -> opens the submenu.
    await page.keyboard.press('ArrowLeft');

    const planItem = page.getByRole('menuitem', { name: 'plan.md' });
    await expect(planItem).toBeVisible();

    const parentItem = page.getByRole('menuitem', { name: 'Open Recent' });
    const submenu = page.locator('[role="menu"]').filter({ has: planItem });

    // right-start requested -> mirrored to left-start under rtl: the submenu
    // panel sits on the inline-start (left) side of the parent item.
    expect(await centerX(submenu)).toBeLessThan(await centerX(parentItem));
  });

  test('context-menu organism submenu opens left of its parent item under rtl', async ({
    page,
  }) => {
    await page.goto(R.contextSubmenu);
    await page.setViewportSize({ width: 1280, height: 900 });
    await setRtl(page);

    await page.locator('.demo-ctx-zone').click({ button: 'right' });
    await expect(page.locator('[role="menu"]').first()).toBeVisible();

    // Rename (0), Duplicate (1), Export as (2) - two ArrowDowns land on the parent.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    // rtl: physical ArrowLeft opens the export submenu.
    await page.keyboard.press('ArrowLeft');

    const pdfItem = page.getByRole('menuitem', { name: 'PDF' });
    await expect(pdfItem).toBeVisible();

    const parentItem = page.getByRole('menuitem', { name: 'Export as' });
    const submenu = page.locator('[role="menu"]').filter({ has: pdfItem });

    expect(await centerX(submenu)).toBeLessThan(await centerX(parentItem));
  });

  test('plain popover mirrors a side placement from right (ltr) to left (rtl)', async ({
    page,
  }) => {
    await page.goto(R.popoverVariants);
    await page.setViewportSize({ width: 1280, height: 900 });

    // The 'right' cell: exact-text button disambiguates it from right-start / right-end.
    const cell = page.locator('.demo-popover-placement-cell', {
      has: page.getByRole('button', { name: 'right', exact: true }),
    });
    const trigger = cell.getByRole('button');
    const tile = cell.locator('.demo-popover-tile');

    // ltr: placement="right" -> tile sits to the right of the trigger.
    await trigger.click();
    await expect(tile).toBeVisible();
    expect(await centerX(tile)).toBeGreaterThan(await centerX(trigger));
    await trigger.click(); // close

    // rtl: placement="right" mirrors to "left" -> tile sits to the left.
    await setRtl(page);
    await trigger.click();
    await expect(tile).toBeVisible();
    expect(await centerX(tile)).toBeLessThan(await centerX(trigger));
    await clearRtl(page);
  });

  test('tooltip mirrors a side placement from right (ltr) to left (rtl)', async ({ page }) => {
    await page.goto(R.tooltipPlacement);
    await page.setViewportSize({ width: 1280, height: 900 });

    const trigger = page.getByRole('button', { name: 'Right', exact: true });

    // ltr: tooltipPlacement="right" -> tooltip to the right of the trigger.
    await trigger.hover();
    const tooltip = page.locator('[role="tooltip"]', { hasText: 'Right tooltip' });
    await expect(tooltip).toBeVisible();
    expect(await centerX(tooltip)).toBeGreaterThan(await centerX(trigger));
    await page.mouse.move(0, 0); // dismiss

    // rtl: mirrors to "left" -> tooltip to the left of the trigger.
    await setRtl(page);
    await trigger.hover();
    await expect(tooltip).toBeVisible();
    expect(await centerX(tooltip)).toBeLessThan(await centerX(trigger));
    await clearRtl(page);
  });

  test('tree-select panel keeps its block-axis placement under rtl (no inline flip leaks)', async ({
    page,
  }) => {
    // The tree-select default popoverPlacement is 'bottom' - a block-axis token
    // with no inline component. resolveDirectionalPlacement must be the identity
    // for it: the panel stays centered below the trigger in both directions. This
    // guards the invariant the plan's Risk section names - a wrong axis must not
    // leak into vertical top/bottom placements.
    await page.goto(R.treeSelect);
    await page.setViewportSize({ width: 1280, height: 900 });

    const trigger = page.locator('cngx-tree-select [role="combobox"]').first();

    // ltr baseline: panel's inline offset from the trigger.
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('[role="tree"]').first();
    await expect(panel).toBeVisible();
    const ltrOffset = (await leftEdge(panel)) - (await leftEdge(trigger));
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // rtl: the same block placement -> the same inline offset (no mirror).
    await setRtl(page);
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    const rtlOffset = (await leftEdge(panel)) - (await leftEdge(trigger));
    await clearRtl(page);

    expect(Math.abs(rtlOffset - ltrOffset)).toBeLessThan(4);
  });
});
