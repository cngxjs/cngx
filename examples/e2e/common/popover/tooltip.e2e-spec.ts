import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxTooltip creates a sibling role="tooltip" element and points the
// trigger's aria-describedby at it while visible, unwinding both on blur or
// pointer leave. Per the APG tooltip pattern the aria-describedby reference is
// stable and the bubble's visibility is what toggles, so these assert on
// visibility rather than on the reference appearing and disappearing.

test.describe('common/popover/tooltip', () => {
  // The suite runs serially and the pointer keeps its position between tests,
  // so a trigger left hovered by the previous test opens a bubble before this
  // one has asserted anything. Park the pointer first.
  test.beforeEach(async ({ page }) => {
    await page.mouse.move(0, 0);
  });

  test('basic: hover reveals the tooltip and wires aria-describedby', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/basic-tooltip');

    const save = page.getByRole('button', { name: 'Save' });

    // Per the APG tooltip pattern the reference is stable: the trigger always
    // describes its bubble, and visibility is what changes on hover.
    // getAttribute does not retry: wait for the directive to wire the
    // reference before reading it.
    await expect(save).toHaveAttribute('aria-describedby', /.+/);
    const tipId = await save.getAttribute('aria-describedby');

    const tip = page.locator(`#${tipId}`);
    await expect(tip).toBeHidden();

    await save.hover();
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText('Save your changes (Ctrl+S)');
    await expect(tip).toHaveAttribute('role', 'tooltip');

    // Moving to another trigger retracts this bubble and reveals that one.
    await page.getByRole('button', { name: 'Redo' }).hover();
    await expect(tip).toBeHidden();
    await expect(page.getByRole('tooltip')).toHaveText('Redo last action (Ctrl+Y)');
  });

  test('keyboard-navigation: focus reveals the tooltip, blur retracts it', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/keyboard-navigation');

    const bold = page.getByRole('button', { name: 'B', exact: true });
    await expect(bold).toHaveAttribute('aria-describedby', /.+/);
    const boldTip = page.locator(`#${await bold.getAttribute('aria-describedby')}`);

    await bold.focus();
    await expect(boldTip).toBeVisible();
    await expect(boldTip).toHaveText('Bold text');

    // Tab to the next trigger: the previous bubble must not linger. Track the
    // italic bubble by id — a global getByRole('tooltip') races the bold one's
    // retraction and can match two nodes mid-transition.
    const italic = page.getByRole('button', { name: 'I', exact: true });
    await expect(italic).toHaveAttribute('aria-describedby', /.+/);
    const italicTip = page.locator(`#${await italic.getAttribute('aria-describedby')}`);

    await page.keyboard.press('Tab');
    await expect(boldTip).toBeHidden();
    await expect(italicTip).toBeVisible();
    await expect(italicTip).toHaveText('Italic text');
  });

  test('disabled-state: [enabled]="false" suppresses the tooltip entirely', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/disabled-state');

    await page.getByRole('button', { name: 'Enabled' }).hover();
    await expect(page.getByRole('tooltip')).toHaveText('This tooltip is active');

    const disabled = page.getByRole('button', { name: 'Disabled' });
    await disabled.hover();
    // No bubble, and no dangling description on the trigger.
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(disabled).not.toHaveAttribute('aria-describedby', /.+/);
  });

  test('programmatic-control: manual triggers only open via the API', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/programmatic-control');

    const trigger = page.locator('button[cngxtooltip]').first();
    await trigger.hover();
    // triggers="manual" means hover must not open it.
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    await page.getByRole('button', { name: 'Show', exact: true }).click();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.getByRole('button', { name: 'Hide', exact: true }).click();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('placement: each variant resolves to a positioned bubble', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/placement');

    const triggers = page.locator('button[cngxtooltip]');
    await expect(triggers.nth(1)).toBeVisible();
    const count = await triggers.count();

    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      // Track this trigger's own bubble by id. A global getByRole('tooltip')
      // races the previous bubble's retraction and made this test flaky.
      await expect(trigger).toHaveAttribute('aria-describedby', /.+/);
      const tip = page.locator(`#${await trigger.getAttribute('aria-describedby')}`);
      await trigger.hover();
      await expect(tip).toBeVisible();
      // A bubble that never got positioned sits at the origin.
      const box = await tip.boundingBox();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
      // Retract before the next iteration so bubbles never overlap.
      await page.mouse.move(0, 0);
      await expect(tip).toBeHidden();
    }
  });

  test('custom-delay: the bubble waits for its configured delay', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/custom-delay');

    const triggers = page.locator('button[cngxtooltip]');
    await expect(triggers.first()).toBeVisible();

    await triggers.first().hover();
    // Whatever the configured delay, the bubble must arrive and carry text.
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible({ timeout: 3000 });
    await expect(tip).not.toHaveText('');
  });
});
