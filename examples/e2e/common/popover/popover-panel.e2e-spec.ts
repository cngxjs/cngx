import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPopoverPanel renders a styled panel attached to a trigger.

test.describe('common/popover/popover-panel', () => {
  test('content-states: panel mounts under its trigger', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/content-states');
    const triggers = page.getByRole('button');
    await expect(triggers).not.toHaveCount(0);
  });

  test('variants: each variant opens its own panel', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/variants');

    for (const variant of ['default', 'info', 'success', 'warning', 'danger']) {
      await page.getByRole('button', { name: variant, exact: true }).click();
      const panel = page.locator('cngx-popover-panel', { hasText: `${variant} panel` });
      await expect(panel).toBeVisible();
      await expect(panel).toContainText(`This is a ${variant} popover panel`);
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
    }
  });

  test('with-footer-actions: panel includes a footer actions row', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/with-footer-actions');

    await page.getByRole('button', { name: /Save/ }).first().click();
    const panel = page.locator('cngx-popover-panel', { hasText: 'Save Changes?' });
    await expect(panel).toBeVisible();
    // The footer is the point of this demo: it must carry actionable controls.
    await expect(panel.locator('[cngxpopoverfooter] button')).not.toHaveCount(0);
  });

  // The footer hosts own no focus restore: the panel's restore claim returns
  // focus to the trigger after a dismiss and after a confirm run.
  test('with-footer-actions: dismiss and confirm return focus to the trigger', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/with-footer-actions');
    const trigger = page.locator('.cngx-ex-artifact button.chip', { hasText: 'Save Confirm' });
    const panel = page.locator('cngx-popover-panel', { hasText: 'Save Changes?' });
    const open = async (): Promise<void> => {
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(panel).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    };

    await open();
    // focus() rather than Tab: WebKit skips buttons in the Tab order by default.
    const cancel = panel.locator('button.cngx-popover-dismiss', { hasText: 'Cancel' });
    await cancel.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await open();
    const confirm = panel.locator('button.cngx-popover-action');
    await confirm.focus();
    await page.keyboard.press('Enter');
    await expect(confirm).toContainText('Saved!');
    // The story installs no withCloseOnSuccess(); Escape closes after the run.
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('footer-actions-plain: slotted icons, a ghost dismiss and the pending label through the dwell', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/popover/popover-panel/footer-actions-plain');
    await page.locator('.cngx-ex-artifact button.chip', { hasText: 'Publish draft' }).click();
    const panel = page.locator('cngx-popover-panel', { hasText: 'Release notes 0.3' });
    await expect(panel).toBeVisible();

    const cancel = panel.locator('button.cngx-popover-dismiss');
    await expect(cancel).toHaveAttribute('data-variant', 'ghost');
    await expect(cancel).toHaveAttribute('data-start', '');
    await expect(cancel.locator('svg[cngxbuttonstart]')).toHaveAttribute('aria-hidden', 'true');
    await expect(cancel).toHaveAccessibleName('Cancel');

    const schedule = panel.locator('button.cngx-popover-action', { hasText: 'Schedule' });
    await expect(schedule).toHaveAccessibleDescription('Pick a publish date first');
    await expect(page.locator('.cngx-ex-sr-output')).toContainText('Pick a publish date first');

    const publish = panel.locator('button.cngx-popover-action[data-tone="primary"]');
    await expect(publish).toHaveAttribute('data-start', '');
    await expect(publish.locator('svg[cngxbuttonstart]')).toHaveAttribute('aria-hidden', 'true');
    await expect(publish).toHaveAccessibleName('Publish');
    await publish.click();
    await expect(publish).toHaveAccessibleName('Publishing...');
    // The pending label holds until the busy visual releases, then the result.
    await expect(publish).toHaveAccessibleName('Published');
    await expect(publish).not.toHaveAttribute('data-busy', /.*/);
    await expect(publish.locator('.cngx-button__busy')).toHaveCount(0);
  });

  // Regression: the arrow ornament must track the trigger horizontally even
  // when the browser shifts the panel for viewport-fit recovery. The `info`
  // chip in the variants story sits close to the viewport's left edge so a
  // wide panel cannot anchor-centre without clipping — the browser shifts
  // the panel right and a plain `left: 50%` arrow used to follow the panel,
  // landing over an unrelated chip. CngxPopover writes the offset from the
  // live trigger / panel geometry to keep the arrow pinned to the trigger.
  test('variants: arrow tracks trigger after viewport-shift recovery', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/variants');
    const trigger = page.getByRole('button', { name: 'info' });
    await trigger.click();

    const panel = page.locator('cngx-popover-panel.cngx-popover-panel--info');
    await panel.waitFor({ state: 'visible' });

    const arrow = panel.locator('.cngx-popover-panel__arrow');
    await arrow.waitFor({ state: 'visible' });

    const triggerBox = await trigger.boundingBox();
    const arrowBox = await arrow.boundingBox();
    expect(triggerBox, 'trigger has bounding box').not.toBeNull();
    expect(arrowBox, 'arrow has bounding box').not.toBeNull();

    const triggerCenterX = triggerBox!.x + triggerBox!.width / 2;
    const arrowCenterX = arrowBox!.x + arrowBox!.width / 2;
    const delta = Math.abs(arrowCenterX - triggerCenterX);

    // 5px tolerance covers sub-pixel rounding plus the rounded-corner clamp
    // (the clamp kicks in when the trigger sits outside the panel's inline
    // extent; for the info chip the clamp does NOT engage so the arrow
    // should land within a pixel of the trigger centre).
    expect(delta, `arrow off trigger centre by ${delta.toFixed(1)}px`).toBeLessThan(5);
  });

  // Regression: compound placements (`bottom-start`, `top-end`, …) write
  // `position-area: bottom span-right` which browsers serialise back as
  // `span-right bottom`. Earlier the arrow CSS selected on substring
  // `style*='position-area: bottom'` which never matched the reordered
  // value, leaving the arrow at its static-flow position in the panel
  // corner. The placement is now keyed off `data-arrow-placement` so the
  // arrow sits at the expected edge regardless of keyword order.
  test('with-dividers: bottom-start arrow sits on the top edge of the panel', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/with-dividers');
    const trigger = page.getByRole('button', { name: 'BA 247 to NRT' });
    await trigger.click();

    const panel = page.locator('cngx-popover-panel');
    await panel.waitFor({ state: 'visible' });

    const arrow = panel.locator('.cngx-popover-panel__arrow');
    const panelBox = await panel.boundingBox();
    const arrowBox = await arrow.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(arrowBox).not.toBeNull();

    // Arrow should hug the panel's top edge for `bottom-*` placements,
    // not be tucked inside the padding (the visual bug we were fixing).
    const arrowCentreY = arrowBox!.y + arrowBox!.height / 2;
    const panelTop = panelBox!.y;
    expect(Math.abs(arrowCentreY - panelTop), 'arrow centre should sit on panel top edge').toBeLessThan(6);

    // Horizontal pin: trigger centre vs arrow centre within the clamp.
    const triggerBox = await trigger.boundingBox();
    const triggerCentreX = triggerBox!.x + triggerBox!.width / 2;
    const arrowCentreX = arrowBox!.x + arrowBox!.width / 2;
    expect(Math.abs(arrowCentreX - triggerCentreX), 'arrow should pin to trigger centre').toBeLessThan(5);
  });

  // Regression: when positionTryFallbacks lets the browser flip the panel
  // from `bottom` to `top`, the arrow's edge must follow. The library reads
  // the live trigger/panel rects on every show and routes the arrow to the
  // panel edge that faces the trigger — no consumer wiring required.
  test('edge-shift-arrow: arrow follows browser flip recovery', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, 'common/popover/popover-panel/edge-shift-arrow');
    const trigger = page.getByRole('button', { name: 'flip if no room below' });

    // Park the trigger near the viewport bottom: enough room above for the
    // panel, almost none below. Forces position-try-fallbacks to flip.
    await trigger.evaluate((el) => el.scrollIntoView({ block: 'end' }));
    await trigger.click();

    const panel = page.locator('cngx-popover-panel.cngx-popover--open').first();
    await panel.waitFor({ state: 'visible' });

    const dataPlacement = await panel.evaluate((el) => el.getAttribute('data-arrow-placement'));
    const arrow = panel.locator('.cngx-popover-panel__arrow');
    const panelBox = await panel.boundingBox();
    const triggerBox = await trigger.boundingBox();
    const arrowBox = await arrow.boundingBox();

    // Browser should have flipped: requested bottom, but no room below,
    // so the panel sits ABOVE the trigger. The arrow must therefore sit
    // on the panel's BOTTOM edge (data-arrow-placement === 'top').
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(triggerBox!.y + 6);
    expect(dataPlacement, 'arrow edge should reflect actual rendered placement').toBe('top');

    const arrowCentreY = arrowBox!.y + arrowBox!.height / 2;
    const panelBottom = panelBox!.y + panelBox!.height;
    expect(Math.abs(arrowCentreY - panelBottom), 'arrow should sit on panel bottom edge after flip').toBeLessThan(6);
  });
});

test.describe('common/popover/popover-panel close-and-empty-slots', () => {
  const ROUTE = 'common/popover/popover-panel/close-and-empty-slots';

  function trigger(page: Page): Locator {
    return page.getByRole('button', { name: 'Recent activity', exact: true });
  }

  function panel(page: Page): Locator {
    return page.locator('cngx-popover-panel');
  }

  async function idText(page: Page, attr: string): Promise<string | null> {
    return panel(page).evaluate((el, name) => {
      const id = el.getAttribute(name);
      return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null;
    }, attr);
  }

  async function open(page: Page): Promise<void> {
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
  }

  test('Done returns focus to the trigger', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await open(page);
    // focus() rather than Tab: WebKit skips buttons in the Tab order by default.
    const done = page.getByRole('button', { name: 'Done' });
    await done.focus();
    await expect(done).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    await expect(
      page.locator('.cngx-ex-sr-output__list dt', { hasText: 'focus after close' }).locator('+ dd'),
    ).toHaveText('Recent activity');
  });

  test('Escape from inside the panel returns focus to the trigger', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await open(page);
    // focus() rather than Tab: WebKit skips buttons in the Tab order by default.
    const done = page.getByRole('button', { name: 'Done' });
    await done.focus();
    await expect(done).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  const views = [
    { label: 'Loading', copy: 'Loading', describes: false },
    { label: 'Load error', copy: 'Could not load', describes: true },
    { label: 'No activity (empty state)', copy: 'Nothing to show', describes: true },
  ] as const;

  for (const view of views) {
    test(`default copy and header in the ${view.copy} view`, async ({ page }) => {
      await gotoDemo(page, ROUTE);
      await page.getByLabel('Use custom slot templates').uncheck();
      await page.getByLabel(view.label, { exact: true }).check();
      await open(page);

      await expect(panel(page).locator('.cngx-popover-panel__header')).toHaveText(
        'Recent activity',
      );
      expect(await idText(page, 'aria-labelledby')).toBe('Recent activity');
      await expect(panel(page)).toContainText(view.copy);
      if (view.describes) {
        expect(await idText(page, 'aria-describedby')).toBe(view.copy);
      } else {
        await expect(panel(page)).toHaveAttribute('aria-busy', 'true');
        await expect(panel(page)).not.toHaveAttribute('aria-describedby', /.+/);
      }
    });
  }

  test('the built-in close in the empty view closes and returns focus', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await page.getByLabel('Use custom slot templates').uncheck();
    await page.getByLabel('No activity (empty state)').check();
    await open(page);
    await panel(page).locator('button.cngx-popover-panel__close').click();
    await expect(panel(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test('content-states: the error view keeps the header', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/content-states');
    await page.getByRole('button', { name: /Load with Error/ }).click();
    const errPanel = page.locator('cngx-popover-panel', { hasText: 'Network timeout' });
    await expect(errPanel).toBeVisible({ timeout: 5000 });
    await expect(errPanel.locator('.cngx-popover-panel__header')).toHaveText('User Details');
  });

  test('state-copy: the config tier and the input tier each reach their panel', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/popover/popover-panel/state-copy');
    await page.getByRole('radio', { name: 'Load error', exact: true }).check();
    const cases = [
      { trigger: 'Shared files', copy: 'Shared files are unavailable' },
      { trigger: 'Team files', copy: 'Team files are unavailable' },
    ];
    for (const { trigger: name, copy } of cases) {
      await page.getByRole('button', { name, exact: true }).click();
      const statePanel = page.locator('cngx-popover-panel', { hasText: copy });
      await expect(statePanel).toBeVisible();
      const describedBy = await statePanel.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(copy);
      await page.keyboard.press('Escape');
      await expect(statePanel).toBeHidden();
    }
  });
});
