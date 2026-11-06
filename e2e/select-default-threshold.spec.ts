import { expect, test, type Locator, type Page } from '@playwright/test';

const ALL = '/#/forms/select/virtualization/default-threshold-all-variants';
const GROUPED = '/#/forms/select/virtualization/default-threshold-grouped';

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

/** The popover scrolls while anchored, the panel shell in a sheet. */
async function setScrollTop(panel: Locator, top: number): Promise<void> {
  await panel.evaluate((el, value) => {
    scrollerOf(el).scrollTop = value;

    function scrollerOf(p: Element): Element {
      const shell = p.querySelector(':scope > cngx-select-panel-shell');
      return shell && getComputedStyle(p).overflowY === 'hidden' ? shell : p;
    }
  }, top);
}

async function getScrollTop(panel: Locator): Promise<number> {
  return panel.evaluate((el) => {
    const shell = el.querySelector(':scope > cngx-select-panel-shell');
    const scroller = shell && getComputedStyle(el).overflowY === 'hidden' ? shell : el;
    return scroller.scrollTop;
  });
}

async function expectScrollHolds(page: Page, panel: Locator, top: number): Promise<void> {
  await setScrollTop(panel, top);
  await page.waitForTimeout(400);
  expect(Math.abs((await getScrollTop(panel)) - top)).toBeLessThan(2);
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
        await expectScrollHolds(page, panel, 3000);
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
      await expectScrollHolds(page, panel, 3000);
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

  test('a grouped list renders in full, holds its scroll and logs no CNGX2028', async ({ page }) => {
    const problems = trackConsoleProblems(page);
    await page.goto(GROUPED);
    const trigger = page.locator('cngx-select [role="combobox"]').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('.cngx-select__panel').first();
    await expect(rowsOf(panel)).toHaveCount(500);

    await page.keyboard.press('ArrowDown');
    await expectScrollHolds(page, panel, 5000);
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

        await expectScrollHolds(page, panel, 3000);
        await expect(rowsOf(panel).first()).not.toContainText('Item 0');

        await setScrollTop(panel, 1_000_000);
        await expect(panel.locator('.cngx-select__option', { hasText: 'Item 999' })).toBeVisible();
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
