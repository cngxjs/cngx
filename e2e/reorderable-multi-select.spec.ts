import { expect, test, type Locator, type Page } from '@playwright/test';

// One story = one example page. Each behaviour lives on its own leaf route.
const BASE = '/#/forms/select/reorderable-multi-select';
const ROUTES = {
  basic: `${BASE}/basic-drag-chips-via-mouse-touch`,
  keyboard: `${BASE}/keyboard-reorder-alt-arrow-home-end`,
  commit: `${BASE}/commit-action-optimistic-pessimistic-with-supersede`,
  optional: `${BASE}/optional-drag-handle-glyph`,
  preSeeded: `${BASE}/pre-seeded-values-reorder-log`,
};

function chrome(page: Page): Locator {
  return page.locator('.cngx-ex-chrome');
}

function stripOf(page: Page): Locator {
  return page.locator('.cngx-select__chip-list').first();
}

function chipAt(page: Page, index: number): Locator {
  return page.locator(`[data-reorder-index="${index}"]`);
}

async function dragChip(
  page: Page,
  source: Locator,
  target: Locator,
): Promise<void> {
  // `page.mouse.*` takes viewport coordinates without auto-scroll; if
  // the chip strip sits below the fold, boundingBox() still reports
  // page coords and the click lands on the header instead. Pin both
  // source + target into view before grabbing their geometry.
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const srcBox = await source.boundingBox();
  const dstBox = await target.boundingBox();
  if (!srcBox || !dstBox) {
    throw new Error('bounding box missing — chip not visible');
  }
  const sx = srcBox.x + srcBox.width / 2;
  const sy = srcBox.y + srcBox.height / 2;
  const dx = dstBox.x + dstBox.width / 2;
  const dy = dstBox.y + dstBox.height / 2;
  // Real pointer gesture: down on source → move over target via a few
  // intermediate steps (CngxReorder reads document.elementFromPoint
  // during the move, so the trajectory must pass through the drop
  // target). `pointermove` steps sampled at 6 points yield a smooth
  // drag that works across all browsers under the harness.
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      sx + ((dx - sx) * i) / steps,
      sy + ((dy - sy) * i) / steps,
      { steps: 4 },
    );
  }
  await page.mouse.up();
}

test.describe('CngxReorderableMultiSelect demo', () => {
  test('chip strip carries role="group" + the reorder ARIA label', async ({ page }) => {
    await page.goto(ROUTES.basic);
    const strip = stripOf(page);
    await expect(strip).toHaveAttribute('role', 'group');
    // Library default label is English ('Reorder with Alt + arrow keys').
    await expect(strip).toHaveAttribute(
      'aria-label',
      /Reorder with Alt \+ arrow keys/,
    );
  });

  test('pointer drag rewrites the trigger chip order and the "Current order" row', async ({
    page,
  }) => {
    await page.goto(ROUTES.basic);

    // Initial order from the demo fixture: ops → eng → legal.
    const orderRow = chrome(page)
      .locator('.event-row', { hasText: 'Current order' })
      .locator('.event-value');
    await expect(orderRow).toHaveText('ops → eng → legal');

    const chip0 = chipAt(page, 0);
    const chip2 = chipAt(page, 2);
    await dragChip(page, chip0, chip2);

    // "ops" moved from index 0 to index 2 → final order: eng → legal → ops.
    await expect(orderRow).toHaveText('eng → legal → ops');
  });

  test('Alt+ArrowRight moves the focused chip one position forward', async ({
    page,
  }) => {
    await page.goto(ROUTES.keyboard);

    // Initial order from fixture: eng, legal, finance, ops.
    const orderRow = chrome(page)
      .locator('.event-row', { hasText: 'Current order' })
      .locator('.event-value');
    await expect(orderRow).toHaveText('eng → legal → finance → ops');

    const firstChip = chipAt(page, 0);
    await firstChip.focus();
    // Library default reorder modifier is Alt (not Ctrl).
    await page.keyboard.press('Alt+ArrowRight');

    await expect(orderRow).toHaveText('legal → eng → finance → ops');
  });

  test('pessimistic commit flips aria-disabled on the chip strip', async ({
    page,
  }) => {
    await page.goto(ROUTES.commit);

    // Switch to pessimistic mode so the strip freezes on pending.
    // Webkit's radio.check() is occasionally a no-op under the test
    // harness; click the label (which wraps the radio) for a
    // cross-browser-reliable toggle.
    await chrome(page)
      .locator('label', { has: page.locator('input[value="pessimistic"]') })
      .click();

    const strip = stripOf(page);
    // Idle: strip is drag-enabled (no aria-disabled attribute).
    await expect(strip).not.toHaveAttribute('aria-disabled', 'true');

    // Kick off a drag — the pessimistic commit stays in flight for
    // ~700ms in the demo. During that window the strip's
    // `reorderDisabled` computed becomes true and the attribute
    // appears; Playwright's toHaveAttribute auto-retries up to 5s so
    // we catch the transient state deterministically even on slower
    // browsers.
    const chip0 = chipAt(page, 0);
    const chip2 = chipAt(page, 2);
    await dragChip(page, chip0, chip2);

    await expect(strip).toHaveAttribute('aria-disabled', 'true');
    // Commit completes → freeze lifts.
    await expect(strip).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('custom drag-handle template adds an opt-in glyph (default = no grip)', async ({
    page,
  }) => {
    await page.goto(ROUTES.basic);
    // Default chip strip in the basic example has NO grip glyph — the ✕
    // hover state is the only divider between drag and remove.
    await expect(page.locator('.cngx-select__chip-wrap')).toHaveCount(3);
    await expect(page.locator('.cngx-select__chip-handle')).toHaveCount(0);

    // Opt-in example projects a [chipDragHandle] template — grips appear.
    await page.goto(ROUTES.optional);
    await expect(page.locator('.cngx-select__chip-wrap')).toHaveCount(3);
    await expect(page.locator('.cngx-select__chip-handle')).toHaveCount(3);
    await expect(page.locator('.cngx-ex-artifact')).toContainText('≡'); // ≡
  });

  test('reorder fires a live-region announcement with "moved to position"', async ({
    page,
  }) => {
    await page.goto(ROUTES.preSeeded);

    // Seeded order: legal, finance, hr, ops, eng.
    const chip0 = chipAt(page, 0);
    await chip0.focus();
    // Library default reorder modifier is Alt (not Ctrl).
    await page.keyboard.press('Alt+End');

    // CngxSelectAnnouncer now delegates to the shared CngxLiveAnnouncer,
    // which publishes to a body-level polite aria-live region (a direct
    // child of <body>, so it does not collide with in-component regions).
    // A 'reordered' action flows through the default English formatter to
    // "<label>: <value> moved to position N".
    const live = page.locator('body > span.cngx-sr-only[aria-live="polite"]').first();
    await expect(live).toContainText(/moved to position/i);
  });
});
