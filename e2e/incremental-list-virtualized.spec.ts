import { expect, test } from '@playwright/test';

// Three regressions only a real browser can catch (jsdom has no layout, no UA
// stylesheet, no scroll anchoring), all found on the virtualized demo:
//
// 1. The viewport host is a custom element - UA default `display: inline`
//    ignores max-block-size and never becomes a scroll container, so the
//    recycler saw clientHeight 0 and rendered nothing.
// 2. The announcer's absolutely-positioned sr-only span escaped the statically
//    positioned scrollport (not its containing block) and stretched the PAGE
//    scrollbar to the list's full virtual height.
// 3. Chrome's scroll anchoring compensated the spacer resizes of every window
//    move, feeding the next move - a runaway scroll that only stopped at the
//    end of the list.

test.describe('CngxIncrementalList virtualized viewport', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/ui/collection/incremental-list/virtualized');
    await expect(page.locator('.cngx-incremental-list__item').first()).toBeVisible();
  });

  test('renders a bounded window of rows inside a real scrollport', async ({ page }) => {
    const viewport = page.locator('cngx-incremental-virtualized-body');

    // display: block makes the bounded scrollport real (an inline box reports
    // clientHeight 0 and the recycler renders nothing).
    const box = await viewport.evaluate((el) => ({
      display: getComputedStyle(el).display,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }));
    expect(box.display).toBe('block');
    expect(box.clientHeight).toBeGreaterThan(0);
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);

    const rows = await page.locator('.cngx-incremental-list__item').count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(100);
  });

  test('the sr-only announcer stays inside the scrollport instead of stretching the page', async ({
    page,
  }) => {
    const pageScrollHeight = await page.evaluate(
      () => document.scrollingElement!.scrollHeight,
    );
    const viewportScrollHeight = await page
      .locator('cngx-incremental-virtualized-body')
      .evaluate((el) => el.scrollHeight);

    // The list's virtual height lives INSIDE the clipped viewport; the page
    // itself stays regular-article sized. Without position: relative on the
    // scrollport the escaped sr-span pushed the page past the full spacer
    // height.
    expect(viewportScrollHeight).toBeGreaterThan(10_000);
    expect(pageScrollHeight).toBeLessThan(5_000);
  });

  test('a scroll nudge settles instead of running away to the end', async ({ page }) => {
    const viewport = page.locator('cngx-incremental-virtualized-body');

    await viewport.evaluate((el) => {
      el.scrollTop = 5000;
    });
    // Give scroll anchoring time to misbehave - the runaway reached the list
    // end within ~1s before overflow-anchor: none.
    await page.waitForTimeout(1000);

    const scrollTop = await viewport.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(4000);
    expect(scrollTop).toBeLessThan(6000);

    // The window follows the scroll position: first rendered row is near
    // 5000px / 36px-per-row, nowhere near the end of the 10k list.
    const firstRowText = await page
      .locator('.cngx-incremental-list__item')
      .first()
      .innerText();
    const firstRowIndex = Number(firstRowText.replace(/\D+/g, ''));
    expect(firstRowIndex).toBeGreaterThan(50);
    expect(firstRowIndex).toBeLessThan(400);
  });

  test('the load-more trigger appends batches until the end message replaces it', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: /load more/i });
    await expect(trigger).toBeVisible();

    const setsize = () =>
      page.locator('.cngx-incremental-list__item').first().getAttribute('aria-setsize');
    expect(await setsize()).toBe('2000');

    await trigger.click();
    await expect
      .poll(async () => setsize())
      .toBe('4000');

    // Rendering stays windowed while the revealed set grows.
    expect(await page.locator('.cngx-incremental-list__item').count()).toBeLessThan(100);

    for (let i = 0; i < 3; i++) {
      await trigger.click();
    }
    await expect(page.locator('.cngx-incremental-list__end')).toHaveText(/all 10000 loaded/i);
    await expect(trigger).toBeHidden();
  });
});

test.describe('CngxSelect virtualized panel', () => {
  test('panel scroll settles with anchoring opted out', async ({ page }) => {
    await page.goto('/#/forms/select/virtualization/ten-thousand-option-window');
    await page.locator('.cngx-select__trigger').first().click();

    const panel = page.locator('.cngx-select__panel.cngx-popover--open');
    await expect(panel.locator('.cngx-select__option').first()).toBeVisible();

    // WebKit has no scroll anchoring and no overflow-anchor property - the
    // opt-out only needs to hold where anchoring exists.
    const anchorSupport = await page.evaluate(() => CSS.supports('overflow-anchor: none'));
    if (anchorSupport) {
      expect(await panel.evaluate((el) => getComputedStyle(el).overflowAnchor)).toBe('none');
    }

    await panel.evaluate((el) => {
      el.scrollTop = 5000;
    });
    await page.waitForTimeout(800);
    const scrollTop = await panel.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(4000);
    expect(scrollTop).toBeLessThan(6000);
  });
});
