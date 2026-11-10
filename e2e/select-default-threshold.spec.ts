import { expect, test, type Locator, type Page } from '@playwright/test';

const ALL = '/#/forms/select/virtualization/default-threshold-all-variants';
const GROUPED = '/#/forms/select/virtualization/default-threshold-grouped';
const PRESELECTED = '/#/forms/select/virtualization/default-threshold-preselected';

interface Host {
  readonly region: string;
  readonly tag: string;
  /** Home and End edit the text of an input-led host, they do not navigate. */
  readonly led: 'button' | 'input';
}

const PANEL_HOSTS: readonly Host[] = [
  { region: 'CngxSelect', tag: 'cngx-select', led: 'button' },
  { region: 'CngxMultiSelect', tag: 'cngx-multi-select', led: 'button' },
  { region: 'CngxCombobox', tag: 'cngx-combobox', led: 'input' },
  { region: 'CngxTypeahead', tag: 'cngx-typeahead', led: 'input' },
  { region: 'CngxReorderableMultiSelect', tag: 'cngx-reorderable-multi-select', led: 'button' },
  { region: 'CngxActionSelect', tag: 'cngx-action-select', led: 'input' },
  { region: 'CngxActionMultiSelect', tag: 'cngx-action-multi-select', led: 'input' },
];
const SHELL: Host = { region: 'CngxSelectShell', tag: 'cngx-select-shell', led: 'button' };
const BUTTON_LED: readonly Host[] = [...PANEL_HOSTS, SHELL].filter((h) => h.led === 'button');

const section = (page: Page, host: Host): Locator => page.getByRole('region', { name: host.region });
const triggerOf = (page: Page, host: Host): Locator =>
  section(page, host).locator(`${host.tag} [role="combobox"]`).first();
const panelOf = (page: Page, host: Host): Locator =>
  section(page, host).locator('.cngx-select__panel').first();
const rowsOf = (panel: Locator): Locator => panel.locator('[role="option"]');
const highlightOf = (panel: Locator): Locator => panel.locator('.cngx-option--highlighted');

async function openPanel(page: Page, host: Host, gesture: 'click' | 'tap' = 'click'): Promise<Locator> {
  const trigger = triggerOf(page, host);
  await trigger[gesture]();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const panel = panelOf(page, host);
  await expect(rowsOf(panel).first()).toBeVisible();
  return panel;
}

interface SettledScroll {
  readonly scrollTop: number;
  readonly clientHeight: number;
  readonly scrollHeight: number;
  readonly firstRow: string;
  readonly lastRow: string;
  readonly rowsInView: number;
}

/**
 * Sets the position, then waits until position, extent and rendered window have
 * not moved for 400 ms. A one-shot read after the jump can catch the short lived
 * window between the jump and a bounce, so every assertion reads this end state.
 * The popover scrolls while anchored, the panel shell in a sheet.
 */
async function jumpAndSettle(panel: Locator, top: number): Promise<SettledScroll> {
  return panel.evaluate(
    (el, value) =>
      new Promise<SettledScroll>((resolve, reject) => {
        const shell = el.querySelector(':scope > cngx-select-panel-shell');
        const scroller = shell && getComputedStyle(el).overflowY === 'hidden' ? shell : el;
        const read = (): SettledScroll => {
          const rows = [...el.querySelectorAll('[role="option"]')];
          const view = scroller.getBoundingClientRect();
          return {
            scrollTop: scroller.scrollTop,
            clientHeight: scroller.clientHeight,
            scrollHeight: scroller.scrollHeight,
            firstRow: rows[0]?.textContent?.trim() ?? '',
            lastRow: rows[rows.length - 1]?.textContent?.trim() ?? '',
            rowsInView: rows.filter((row) => {
              const box = row.getBoundingClientRect();
              return box.bottom > view.top && box.top < view.bottom;
            }).length,
          };
        };
        scroller.scrollTop = value;
        const start = performance.now();
        let last = JSON.stringify(read());
        let lastChange = start;
        const sample = (): void => {
          const now = performance.now();
          const current = JSON.stringify(read());
          if (current !== last) {
            last = current;
            lastChange = now;
          }
          if (now - lastChange >= 400) {
            resolve(read());
          } else if (now - start > 5000) {
            reject(new Error(`scroll did not settle within 5 s: ${current}`));
          } else {
            requestAnimationFrame(sample);
          }
        };
        requestAnimationFrame(sample);
      }),
    top,
  );
}

/**
 * A sheet row is taller than the recycler's estimate, so the first jump can land
 * short once the window has grown: the last row is there, no bounce, and the
 * second jump arrives. Anchored rows match the estimate and arrive at once.
 */
async function expectJumpReachesEnd(panel: Locator, jumps: 1 | 2): Promise<void> {
  const first = await jumpAndSettle(panel, 1_000_000);
  expect(first.lastRow).toContain('Item 999');
  const settled = jumps === 2 ? await jumpAndSettle(panel, 1_000_000) : first;
  expect(settled.lastRow).toContain('Item 999');
  expect(settled.rowsInView).toBeGreaterThan(0);
  expect(
    Math.abs(settled.scrollTop + settled.clientHeight - settled.scrollHeight),
  ).toBeLessThanOrEqual(1);
}

async function expectJumpsBackFromEnd(panel: Locator, jumps: 1 | 2): Promise<void> {
  await expectJumpReachesEnd(panel, jumps);
  const atStart = await jumpAndSettle(panel, 0);
  expect(atStart.scrollTop).toBe(0);
  expect(atStart.firstRow).toContain('Item 0');
  expect(atStart.rowsInView).toBeGreaterThan(0);

  await expectJumpReachesEnd(panel, jumps);
  const middle = Math.floor(atStart.scrollHeight / 2);
  const atMiddle = await jumpAndSettle(panel, middle);
  expect(Math.abs(atMiddle.scrollTop - middle)).toBeLessThan(2);
  expect(atMiddle.rowsInView).toBeGreaterThan(0);
}

/**
 * Sets the position, then samples it on every frame for 400 ms, so a pull-back
 * that settles again inside the span still fails.
 */
async function expectScrollHolds(panel: Locator, top: number): Promise<void> {
  const samples = await panel.evaluate(
    (el, value) =>
      new Promise<number[]>((resolve) => {
        const shell = el.querySelector(':scope > cngx-select-panel-shell');
        const scroller = shell && getComputedStyle(el).overflowY === 'hidden' ? shell : el;
        scroller.scrollTop = value;
        const seen: number[] = [];
        const start = performance.now();
        const sample = (): void => {
          seen.push(scroller.scrollTop);
          if (performance.now() - start < 400) {
            requestAnimationFrame(sample);
          } else {
            resolve(seen);
          }
        };
        requestAnimationFrame(sample);
      }),
    top,
  );
  expect(samples.length).toBeGreaterThan(1);
  expect(samples.filter((seen) => Math.abs(seen - top) >= 2)).toEqual([]);
}

function reachLastKey(host: Host): string {
  return host.led === 'input' ? 'ArrowUp' : 'End';
}

function trackConsoleProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(message.text());
    }
  });
  page.on('pageerror', (error) => problems.push(error.message));
  return problems;
}

test.describe('select family at the default threshold, desktop', () => {
  for (const host of PANEL_HOSTS) {
    test.describe(host.tag, () => {
      test('windows the list and reaches the last option', async ({ page }) => {
        await page.goto(ALL);
        const panel = await openPanel(page, host);
        const count = await rowsOf(panel).count();
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(100);

        await page.keyboard.press(reachLastKey(host));
        await expect(highlightOf(panel)).toContainText('Item 999');
        await expect(highlightOf(panel)).toBeInViewport();
      });

      test('keeps a scrolled position with a highlight in the list', async ({ page }) => {
        await page.goto(ALL);
        const panel = await openPanel(page, host);
        await page.keyboard.press('ArrowDown');
        await expect(highlightOf(panel)).toHaveCount(1);
        await expectScrollHolds(panel, 3000);
      });

      test('a jump to the end stays there and jumps back hold', async ({ page }) => {
        await page.goto(ALL);
        const panel = await openPanel(page, host);
        await expectScrollHolds(panel, 3000);
        await expectJumpsBackFromEnd(panel, 1);
      });
    });
  }

  test.describe(SHELL.tag, () => {
    test('renders every projected row and reaches the last option', async ({ page }) => {
      await page.goto(ALL);
      const panel = await openPanel(page, SHELL);
      await expect(panel.locator('cngx-option')).toHaveCount(1000);

      await page.keyboard.press('End');
      await expect(highlightOf(panel)).toContainText('Item 999');
      await expect(highlightOf(panel)).toBeInViewport();
    });

    test('keeps a scrolled position', async ({ page }) => {
      await page.goto(ALL);
      const panel = await openPanel(page, SHELL);
      await expectScrollHolds(panel, 3000);
    });
  });

  for (const host of BUTTON_LED) {
    test.describe(`${host.tag} keyboard`, () => {
      test('open-panel typeahead finds an option far down the list', async ({ page }) => {
        await page.goto(ALL);
        const panel = await openPanel(page, host);
        await page.keyboard.press('z');
        await expect(highlightOf(panel)).toContainText('Zebra 800');
        await expect(highlightOf(panel)).toBeInViewport();
      });

      test('a first open by ArrowUp lands on the last option', async ({ page }) => {
        await page.goto(ALL);
        await triggerOf(page, host).focus();
        await page.keyboard.press('ArrowUp');
        const panel = panelOf(page, host);
        await expect(highlightOf(panel)).toContainText('Item 999');
        await expect(highlightOf(panel)).toBeInViewport();
      });
    });
  }

  for (const host of BUTTON_LED) {
    test(`${host.tag} opens on its selected option far down the list, first open by click`, async ({
      page,
    }) => {
      await page.goto(PRESELECTED);
      // Chips of the selection fill the multi triggers, and a press on a chip
      // is a reorder gesture there: click the trailing end, where the caret sits.
      const trigger = triggerOf(page, host);
      const box = await trigger.boundingBox();
      await trigger.click({ position: { x: box!.width - 12, y: box!.height / 2 } });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const panel = panelOf(page, host);
      await expect(highlightOf(panel)).toContainText('Item 900');
      await expect(highlightOf(panel)).toBeInViewport();
    });
  }

  test('a grouped list renders in full, holds its scroll and logs no CNGX2028', async ({ page }) => {
    const problems = trackConsoleProblems(page);
    await page.goto(GROUPED);
    const trigger = page.locator('cngx-select [role="combobox"]').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('.cngx-select__panel').first();
    await expect(rowsOf(panel)).toHaveCount(500);

    await page.keyboard.press('ArrowDown');
    await expectScrollHolds(panel, 5000);
    expect(problems.filter((text) => text.includes('CNGX2028'))).toEqual([]);
  });
});

test.describe('select family at the default threshold, phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox has no isMobile emulation');

  for (const host of PANEL_HOSTS) {
    test.describe(host.tag, () => {
      test('windows the sheet, scrolls the shell and reaches the last option', async ({ page }) => {
        await page.goto(ALL);
        const panel = await openPanel(page, host, 'tap');
        const count = await rowsOf(panel).count();
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(100);

        await expectScrollHolds(panel, 3000);
        await expect(rowsOf(panel).first()).not.toContainText('Item 0');

        await expectJumpReachesEnd(panel, 2);
      });

      test('jumps back from the end to the start and the middle hold', async ({ page }) => {
        await page.goto(ALL);
        const panel = await openPanel(page, host, 'tap');
        await expectJumpsBackFromEnd(panel, 2);
      });

      test('survives a sheet rotation without a console error', async ({ page }) => {
        const problems = trackConsoleProblems(page);
        await page.goto(ALL);
        const panel = await openPanel(page, host, 'tap');

        await page.setViewportSize({ width: 844, height: 390 });
        await expect(rowsOf(panel).first()).toBeVisible();
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(rowsOf(panel).first()).toBeVisible();

        expect(problems.filter((text) => /NG0|CNGX|ERROR/.test(text))).toEqual([]);
      });
    });
  }

  test('a letter typed while the combobox sheet listbox has focus finds a far option', async ({
    page,
  }) => {
    await page.goto(ALL);
    const host = PANEL_HOSTS.find((h) => h.tag === 'cngx-combobox')!;
    const panel = await openPanel(page, host, 'tap');
    await panel.locator('[role="listbox"]').focus();

    await page.keyboard.press('z');
    await expect(highlightOf(panel)).toContainText('Zebra 800');
  });
});
