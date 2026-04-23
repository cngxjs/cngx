import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/reorderable-multi-select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

function triggerOf(section: Locator): Locator {
  return section
    .locator('cngx-reorderable-multi-select [role="combobox"]')
    .first();
}

function stripOf(section: Locator): Locator {
  return section.locator('.cngx-select__chip-list').first();
}

function chipAt(section: Locator, index: number): Locator {
  return section.locator(`[data-reorder-index="${index}"]`);
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
    await page.goto(ROUTE);
    const section = card(page, 'Basic — drag chips');
    const strip = stripOf(section);
    await expect(strip).toHaveAttribute('role', 'group');
    await expect(strip).toHaveAttribute(
      'aria-label',
      /Reihenfolge ändern mit Strg\+Pfeiltasten/,
    );
  });

  test('pointer drag rewrites the trigger chip order and the "Current order" row', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — drag chips');

    // Initial order from the demo fixture: ops → eng → legal.
    const orderRow = section
      .locator('.event-row', { hasText: 'Current order' })
      .locator('.event-value');
    await expect(orderRow).toHaveText('ops → eng → legal');

    const chip0 = chipAt(section, 0);
    const chip2 = chipAt(section, 2);
    await dragChip(page, chip0, chip2);

    // "ops" moved from index 0 to index 2 → final order: eng → legal → ops.
    await expect(orderRow).toHaveText('eng → legal → ops');
  });

  test('Ctrl+ArrowRight moves the focused chip one position forward', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Keyboard reorder');

    // Initial order from fixture: eng, legal, finance, ops.
    const orderRow = section
      .locator('.event-row', { hasText: 'Current order' })
      .locator('.event-value');
    await expect(orderRow).toHaveText('eng → legal → finance → ops');

    const firstChip = chipAt(section, 0);
    await firstChip.focus();
    await page.keyboard.press('Control+ArrowRight');

    await expect(orderRow).toHaveText('legal → eng → finance → ops');
  });

  test('pessimistic commit flips aria-disabled on the chip strip', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Commit action');

    // Switch to pessimistic mode so the strip freezes on pending.
    // Webkit's radio.check() is occasionally a no-op under the test
    // harness; click the label (which wraps the radio) for a
    // cross-browser-reliable toggle.
    await section
      .locator('label', { has: page.locator('input[value="pessimistic"]') })
      .click();

    const strip = stripOf(section);
    // Idle: strip is drag-enabled (no aria-disabled attribute).
    await expect(strip).not.toHaveAttribute('aria-disabled', 'true');

    // Kick off a drag — the pessimistic commit stays in flight for
    // ~700ms in the demo. During that window the strip's
    // `reorderDisabled` computed becomes true and the attribute
    // appears; Playwright's toHaveAttribute auto-retries up to 5s so
    // we catch the transient state deterministically even on slower
    // browsers.
    const chip0 = chipAt(section, 0);
    const chip2 = chipAt(section, 2);
    await dragChip(page, chip0, chip2);

    await expect(strip).toHaveAttribute('aria-disabled', 'true');
    // Commit completes → freeze lifts.
    await expect(strip).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('custom drag-handle template adds an opt-in glyph (default = no grip)', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    // Default chip strip in the basic card has NO grip glyph — the ✕
    // hover state is the only divider between drag and remove.
    const basicSection = card(page, 'Basic — drag chips');
    await expect(
      basicSection.locator('.cngx-select__chip-wrap'),
    ).toHaveCount(3);
    await expect(
      basicSection.locator('.cngx-select__chip-handle'),
    ).toHaveCount(0);

    // Opt-in card projects a [chipDragHandle] template — grips appear.
    const customSection = card(page, 'Optional drag-handle');
    await expect(
      customSection.locator('.cngx-select__chip-wrap'),
    ).toHaveCount(3);
    await expect(
      customSection.locator('.cngx-select__chip-handle'),
    ).toHaveCount(3);
    await expect(customSection).toContainText('\u2261'); // ≡
  });

  test('reorder fires a live-region announcement with "verschoben"', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Pre-seeded values + reorder log');

    // Seeded order: legal, finance, hr, ops, eng.
    const chip0 = chipAt(section, 0);
    await chip0.focus();
    await page.keyboard.press('Control+End');

    // The shared CngxSelectAnnouncer publishes to a body-level
    // aria-live region. A 'reordered' action flows through the default
    // German formatter → "<label>: <value> verschoben auf Position N".
    const live = page.locator('.cngx-select-announcer--polite').first();
    await expect(live).toContainText(/verschoben/i);
  });
});
