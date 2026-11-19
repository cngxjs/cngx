import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe('CngxSidenav layout regressions', () => {
  test('rail body does not overflow a non-default-width rail (side mode)', async ({ page }) => {
    // The story binds no mode: only the expanded width class docks the full
    // rail with its group heads, so pin a wide viewport and check for it.
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/#/ui/sidenav/full-navigation-sidebar');
    await expect(page.locator('cngx-sidenav').first()).toHaveAttribute(
      'data-sidebar-state',
      'expanded',
    );
    // An open overlay drawer also reports expanded; only a docked rail is side.
    await expect(page.locator('cngx-sidenav').first()).toHaveClass(/cngx-sidenav--side/);
    const nav = page.locator('cngx-sidenav').first();
    const body = nav.locator('.cngx-sidenav__body');
    await expect(nav).toBeVisible();

    const navBox = await nav.boundingBox();
    const bodyBox = await body.boundingBox();
    expect(navBox).not.toBeNull();
    expect(bodyBox).not.toBeNull();

    // Regression guard: `--cngx-sidenav-width` was a registered @property with
    // `inherits: false`, so the body's `min-width: var(--cngx-sidenav-width)`
    // fell back to the 280px initial and overflowed any non-280 rail (here 240).
    expect(bodyBox!.width).toBeLessThanOrEqual(navBox!.width + 1);
  });

  test('a collapsed rail peeks over content without shifting it', async ({ page }) => {
    await page.goto('/#/ui/sidenav/config-hover-dwell');
    const nav = page.locator('cngx-sidenav', { hasText: 'Config' }).first();
    const content = page.locator('cngx-sidenav-content').first();
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');

    const contentLeftBefore = (await content.boundingBox())!.x;

    // Rest on the rail past the ~250ms scoped dwell so it peeks.
    await nav.hover();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'peek', { timeout: 2000 });

    // The rail actually grows past the 61px rail width (the state flips at
    // the start of the width transition, so wait for the box)...
    await expect.poll(async () => (await nav.boundingBox())!.width).toBeGreaterThan(100);
    const contentLeftAfter = (await content.boundingBox())!.x;

    // ...but the sidebar's negative margin means content is not pushed right.
    expect(Math.abs(contentLeftAfter - contentLeftBefore)).toBeLessThanOrEqual(1);
  });

  // The rails resolve their width class one observation after the first
  // render. Neither the unbound nor the unsettled frame may be painted, and
  // the settle must not animate: the first visible frame is already final.
  for (const [width, widthClass] of [
    [1000, 'medium'],
    [1400, 'expanded'],
  ] as const) {
    test(`an auto layout paints its first frame without a layout shift (${widthClass})`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'the Layout Instability API is Chromium-only');
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(() => {
        const win = window as unknown as { __cngxShift: number };
        win.__cngxShift = 0;
        new PerformanceObserver((list) => {
          // Only shifts of the layout's own boxes count. The examples app
          // grows its page around the story on load; with classic scrollbars
          // (Linux CI) the scrollbar it brings narrows the demo chrome above
          // the layout, which is not the layout's first paint.
          type Shift = PerformanceEntry & {
            value: number;
            sources: { node: Node | null }[];
          };
          for (const entry of list.getEntries() as Shift[]) {
            const ownShift = entry.sources.some((source) => {
              const node = source.node;
              const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
              return element instanceof Element && element.closest('cngx-sidenav-layout') !== null;
            });
            if (ownShift) {
              win.__cngxShift += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto('/#/ui/sidenav/full-navigation-sidebar');
      await expect(page.locator('cngx-sidenav-layout').first()).toHaveClass(
        /cngx-sidenav-layout--ready/,
      );
      // An animated settle would still be running here: wait it out so every
      // frame of it reports its shift.
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document
                .querySelector('cngx-sidenav-layout')!
                .getAnimations({ subtree: true })
                .filter((a) => a instanceof CSSTransition).length,
          ),
        )
        .toBe(0);
      const shift = await page.evaluate(
        () => (window as unknown as { __cngxShift: number }).__cngxShift,
      );
      expect(shift).toBe(0);
    });
  }

  test('Tab skips the links of a collapsed animated nav group', async ({ page }) => {
    // The story binds no mode: only the expanded width class docks the full
    // rail with its group heads, so pin a wide viewport and check for it.
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/#/ui/sidenav/full-navigation-sidebar');
    await expect(page.locator('cngx-sidenav').first()).toHaveAttribute(
      'data-sidebar-state',
      'expanded',
    );
    // An open overlay drawer also reports expanded; only a docked rail is side.
    await expect(page.locator('cngx-sidenav').first()).toHaveClass(/cngx-sidenav--side/);
    const team = page.getByRole('button', { name: 'Team' });
    const members = page.locator('#team-items').getByText('Members');
    await expect(team).toHaveAttribute('aria-expanded', 'false');

    await team.focus();
    await page.keyboard.press('Tab');
    const focusedInCollapsedGroup = await page.evaluate(
      () => (document.activeElement?.closest('#team-items') ?? null) !== null,
    );
    expect(focusedInCollapsedGroup).toBe(false);
    await expect(members).not.toBeFocused();

    await team.focus();
    await page.keyboard.press('Enter');
    await expect(team).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(members).toBeFocused();
  });

  test('a nav group closing around focus hands focus to its trigger', async ({ page }) => {
    // The story binds no mode: only the expanded width class docks the full
    // rail with its group heads, so pin a wide viewport and check for it.
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/#/ui/sidenav/full-navigation-sidebar');
    await expect(page.locator('cngx-sidenav').first()).toHaveAttribute(
      'data-sidebar-state',
      'expanded',
    );
    // An open overlay drawer also reports expanded; only a docked rail is side.
    await expect(page.locator('cngx-sidenav').first()).toHaveClass(/cngx-sidenav--side/);
    const team = page.getByRole('button', { name: 'Team' });
    const members = page.locator('#team-items').getByText('Members');

    await team.click();
    await expect(team).toHaveAttribute('aria-expanded', 'true');
    await members.focus();
    await expect(members).toBeFocused();

    // A programmatic close (no pointer or key on the trigger) is the case
    // where inert would otherwise drop focus to <body>.
    await team.evaluate((el) => {
      const ngApi = (
        window as unknown as {
          ng: { getDirectives: (node: Element) => { constructor: { name: string } }[] };
        }
      ).ng;
      const disclosure = ngApi
        .getDirectives(el)
        .find((d) => typeof (d as { close?: unknown }).close === 'function') as
        { close: () => void } | undefined;
      disclosure!.close();
    });
    await expect(team).toHaveAttribute('aria-expanded', 'false');
    await expect(team).toBeFocused();
  });

  test('a non-modal end inspector keeps the list and the start rail operable', async ({ page }) => {
    // The inspector overlays the end of each row, so press the visible start
    // of a row: the list stays operable where the inspector does not cover it.
    const LIST_EDGE = { x: 16, y: 8 };
    await page.goto('/#/ui/sidenav/dual-sidebar-master-detail');
    const layout = page.locator('cngx-sidenav-layout').first();
    const inspector = layout.locator('cngx-sidenav.cngx-sidenav--end');
    const content = layout.locator('cngx-sidenav-content');
    const startRail = layout.locator('cngx-sidenav.cngx-sidenav--start');

    await content.getByRole('button', { name: 'Order #1042' }).click({ position: LIST_EDGE });
    await expect(inspector).toHaveClass(/cngx-sidenav--open/);
    await expect(inspector.getByRole('heading', { name: 'Order #1042' })).toBeVisible();

    // Non-modal: no dialog role, no backdrop, nothing outside made inert.
    await expect(inspector).not.toHaveAttribute('aria-modal', 'true');
    await expect(layout).not.toHaveClass(/cngx-sidenav-layout--has-overlay/);
    await expect(layout.locator('.cngx-sidenav-backdrop')).toBeHidden();
    await expect(content).not.toHaveAttribute('inert', '');
    await expect(startRail).not.toHaveAttribute('inert', '');

    // The list stays clickable: another order swaps the detail in place.
    await content.getByRole('button', { name: 'Order #1044' }).click({ position: LIST_EDGE });
    await expect(inspector).toHaveClass(/cngx-sidenav--open/);
    await expect(inspector.getByRole('heading', { name: 'Order #1044' })).toBeVisible();

    // The start rail stays clickable too (no backdrop intercepts the press);
    // a press outside a non-modal inspector still asks it to close.
    await startRail.getByText('Products').click();
    await expect(inspector).not.toHaveClass(/cngx-sidenav--open/);

    // Escape with focus inside the inspector dismisses it.
    await content.getByRole('button', { name: 'Order #1043' }).click({ position: LIST_EDGE });
    await expect(inspector).toHaveClass(/cngx-sidenav--open/);
    await inspector.getByRole('button', { name: 'Close' }).focus();
    await page.keyboard.press('Escape');
    await expect(inspector).not.toHaveClass(/cngx-sidenav--open/);
  });

  test('the auto-mode drawer starts closed at compact and returns focus to its trigger', async ({
    page,
  }) => {
    await page.goto('/#/ui/sidenav/auto-mode');
    const nav = page.locator('cngx-sidenav').first();
    const trigger = page.getByRole('button', { name: 'Toggle navigation' });
    await page.getByRole('button', { name: 'Width 40rem' }).click();
    await expect(nav).toHaveClass(/cngx-sidenav--over/);
    await expect(nav).not.toHaveClass(/cngx-sidenav--open/);
    await expect(nav).not.toHaveAttribute('aria-modal', 'true');

    await trigger.click();
    await expect(nav).toHaveClass(/cngx-sidenav--open/);
    await expect(nav).toHaveAttribute('aria-modal', 'true');

    await page.keyboard.press('Escape');
    await expect(nav).not.toHaveClass(/cngx-sidenav--open/);
    await expect(trigger).toBeFocused();
  });
});

test.describe('CngxSidenav user gestures', () => {
  const FULL_NAV = '/#/ui/sidenav/full-navigation-sidebar';

  // The full-navigation story binds no mode: only the expanded width class
  // docks the rail with its resize handle.
  async function dockedFullNav(page: Page) {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(FULL_NAV);
    const nav = page.locator('cngx-sidenav').first();
    await expect(nav).toHaveClass(/cngx-sidenav--side/);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'expanded');
    return nav;
  }

  const railWidth = (nav: Locator) =>
    nav.evaluate((el) => el.style.getPropertyValue('--cngx-sidenav-width'));

  test('a backdrop click closes the overlay and restores focus to the opener', async ({ page }) => {
    await page.goto('/#/ui/sidenav/router-sync/deep-linkable-overlay');
    const nav = page.locator('cngx-sidenav').first();
    const opener = page.getByRole('button', { name: 'Open menu' });
    await opener.click();
    await expect(nav).toHaveClass(/cngx-sidenav--open/);

    // The surface is engaged once focus has moved into the rail.
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeFocused();
    const backdrop = page.locator('.cngx-sidenav-backdrop').first();
    await expect(backdrop).toBeVisible();
    const backdropBox = (await backdrop.boundingBox())!;
    // Press the far end of the backdrop: the rail may still be sliding in, so
    // a point measured from its box could land inside it. A raw mouse press,
    // since the backdrop is a pointer target, not an actionable element.
    await page.mouse.click(
      backdropBox.x + backdropBox.width - 20,
      backdropBox.y + backdropBox.height / 2,
    );
    await expect(nav).not.toHaveClass(/cngx-sidenav--open/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('drag and arrow keys resize the rail and move aria-valuenow', async ({ page }) => {
    const nav = await dockedFullNav(page);
    const handle = nav.locator('.cngx-sidenav__resize-handle');
    await expect(handle).toHaveAttribute('aria-valuenow', '240');

    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
      .toBeGreaterThan(240);
    const afterKey = Number(await handle.getAttribute('aria-valuenow'));
    expect(await railWidth(nav)).toBe(`${afterKey}px`);

    const box = (await handle.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y, { steps: 6 });
    await page.mouse.up();
    const afterDrag = Number(await handle.getAttribute('aria-valuenow'));
    expect(afterDrag).toBeGreaterThanOrEqual(afterKey + 50);
    expect(await railWidth(nav)).toBe(`${afterDrag}px`);
  });

  test('a persisted collapsed state survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/#/ui/sidenav/persistence/collapsed-across-reloads');
    await page.evaluate(() => localStorage.removeItem('cngx-demo-sidenav:start'));
    await page.reload();
    const nav = page.locator('cngx-sidenav').first();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'expanded');

    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');

    await page.reload();
    await expect(page.locator('cngx-sidenav').first()).toHaveAttribute(
      'data-sidebar-state',
      'rail',
    );
    await page.evaluate(() => localStorage.removeItem('cngx-demo-sidenav:start'));
  });

  test('under rtl the start rail sits at the inline start and the arrow keys mirror', async ({
    page,
  }) => {
    const nav = await dockedFullNav(page);
    await page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'));
    const content = page.locator('cngx-sidenav-content').first();
    await expect
      .poll(async () => (await nav.boundingBox())!.x)
      .toBeGreaterThan((await content.boundingBox())!.x);

    const handle = nav.locator('.cngx-sidenav__resize-handle');
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    await expect
      .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
      .toBeGreaterThan(240);
  });

  test('the mod+. shortcut toggles the rail', async ({ page }) => {
    const nav = await dockedFullNav(page);
    // mod resolves from the page's platform (Client Hints first), which need
    // not match the host OS Playwright's ControlOrMeta reads.
    const mod = await page.evaluate(() => {
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      const platform = nav.userAgentData?.platform || nav.platform || '';
      return /mac|iphone|ipad|ipod/i.test(platform) ? 'Meta' : 'Control';
    });
    await page.keyboard.press(`${mod}+Period`);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    await page.keyboard.press(`${mod}+Period`);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'expanded');
  });

  test('a contained drawer blocks its layout only', async ({ page }) => {
    await page.goto('/#/ui/sidenav/contained-modality/drawer-inside-a-panel');
    const nav = page.locator('cngx-sidenav').first();
    await page.getByRole('button', { name: 'Open filters' }).click();
    await expect(nav).toHaveClass(/cngx-sidenav--open/);
    await expect(nav).not.toHaveAttribute('aria-modal', 'true');
    await expect(nav).toHaveAttribute('role', 'navigation');
    // The trigger stays live; its sibling inside the layout does not.
    await expect(page.getByRole('button', { name: 'Close filters' })).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator('cngx-sidenav-content button', { hasText: 'Export' })
          .evaluate((el) => el.closest('[inert]') !== null),
      )
      .toBe(true);

    const outside = page.getByRole('button', { name: /Outside the layout/ });
    await outside.click();
    await expect(outside).toHaveText(/Outside the layout: 1/);
    await expect(nav).not.toHaveClass(/cngx-sidenav--open/);
  });

  test('a ?nav=open deep link opens the overlay', async ({ page }) => {
    await page.goto('/#/ui/sidenav/router-sync/deep-linkable-overlay?nav=open');
    const nav = page.locator('cngx-sidenav').first();
    await expect(nav).toHaveClass(/cngx-sidenav--open/);
    await expect(nav).toHaveAttribute('aria-modal', 'true');
  });
});
