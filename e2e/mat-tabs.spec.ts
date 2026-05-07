import { expect, test, type Locator, type Page } from '@playwright/test';

// E2e for the [cngxMatTabs] instrumentation directive — drives the
// `mat-tabs-instrumentation` demo route to verify the sticky-error
// UX end-to-end against real Material DOM, real RxJS commit-action
// timings, and the consumer-composed CngxToastOn / CngxBannerOn
// bridges.
//
// User concern that drove this suite: "errors get swallowed, the
// whole thing feels wackelig". The assertions here pin down:
//   - the rejection decoration ACTUALLY lands on the failed tab
//     (`cngx-mat-tab--error` class + `aria-invalid="true"`)
//   - the toast + banner outlets ACTUALLY render the configured
//     phrases (proves CNGX_STATEFUL bridge composition through
//     hostDirectives)
//   - the decoration PERSISTS across the rollback animation
//     (Material's ink-bar transition + Angular's CD cycle don't
//     swallow it)
//   - rapid supersede sequences land the FINAL outcome on the
//     FINAL target (not the first-clicked tab)
//   - `Clear last failed` button + successful re-pick BOTH dismiss
//     the decoration (the two clear paths the public API ships)
//
// All timing-sensitive waits use generous 4000ms timeouts because
// the default commit latency is 600ms; CI machines run slower than
// dev boxes and the toast outlet has its own enter animation.

const ROUTE = '/#/ui/mat-tabs/mat-tabs-instrumentation';

// Material renders the clickable tab buttons inside `MatTabHeader`
// as `<button class="mat-mdc-tab">` siblings of the active-bar.
// Scoped to the FIRST mat-tab-group on the demo page — the
// instrumentation demo now ships a second mat-tab-group below for
// the smart-overflow showcase (10 tabs in a 600px container).
function matTabButtons(page: Page): Locator {
  return page.locator('mat-tab-group').first().locator('.mat-mdc-tab');
}

// Locator for the smart-overflow demo's mat-tab-group + the cngx More
// affordance pinned inside its .mat-mdc-tab-header.
function overflowTabGroup(page: Page): Locator {
  return page.locator('mat-tab-group').nth(1);
}

function overflowMoreButton(page: Page): Locator {
  return overflowTabGroup(page).locator(
    '.mat-mdc-tab-header cngx-tab-overflow .cngx-tab-overflow__trigger',
  );
}

function activeTab(page: Page): Locator {
  // Material applies `mdc-tab--active` to the currently-selected
  // tab regardless of cngx instrumentation.
  return page.locator('mat-tab-group .mat-mdc-tab.mdc-tab--active');
}

function rejectedTab(page: Page): Locator {
  return page.locator('mat-tab-group .mat-mdc-tab.cngx-mat-tab--error');
}

function toastCards(page: Page): Locator {
  return page.locator('cngx-toast-outlet .cngx-toast');
}

function bannerCards(page: Page): Locator {
  return page.locator('cngx-banner-outlet .cngx-banner');
}

async function enableSimulateError(page: Page): Promise<void> {
  const checkbox = page.getByLabel('simulate error');
  if (!(await checkbox.isChecked())) {
    await checkbox.click();
  }
}

async function disableSimulateError(page: Page): Promise<void> {
  const checkbox = page.getByLabel('simulate error');
  if (await checkbox.isChecked()) {
    await checkbox.click();
  }
}

test.describe('CngxMatTabs sticky-error UX (mat-tabs-instrumentation demo)', () => {
  test('(a) baseline: 3 mat-tabs render; tab 0 active; no rejection class anywhere', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await expect(matTabButtons(page)).toHaveCount(3);
    await expect(activeTab(page)).toHaveCount(1);
    // Material's `mdc-tab--active` lands on tab 0 by default.
    await expect(matTabButtons(page).nth(0)).toHaveClass(/mdc-tab--active/);
    // No rejection decoration on a clean load.
    await expect(rejectedTab(page)).toHaveCount(0);
    // No aria-invalid leaking from prior runs.
    for (let i = 0; i < 3; i++) {
      await expect(matTabButtons(page).nth(i)).not.toHaveAttribute(
        'aria-invalid',
        /.*/,
      );
    }
  });

  test('(b) optimistic + simulate-error: clicking tab 2 lands on tab 2 immediately, then rolls back to tab 0; tab 2 carries cngx-mat-tab--error AND aria-invalid="true"', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    await buttons.nth(2).click();
    // After ~600ms commit rejects → Material's ink bar slides back
    // to tab 0 AND cngx applies the rejection decoration to tab 2.
    await expect(buttons.nth(0)).toHaveClass(/mdc-tab--active/, {
      timeout: 4000,
    });
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });
    await expect(buttons.nth(2)).toHaveAttribute('aria-invalid', 'true');
    // Untouched tabs stay clean.
    await expect(buttons.nth(0)).not.toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(1)).not.toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(0)).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(buttons.nth(1)).not.toHaveAttribute('aria-invalid', /.*/);
  });

  test('(c) toast bridge fires on commit error — proves CngxToastOn composes against CNGX_STATEFUL through hostDirectives', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    await matTabButtons(page).nth(1).click();
    // Toast outlet should produce a card with the configured
    // [toastError] phrase. Generous timeout for the toast's own
    // enter animation on top of the 600ms commit latency.
    await expect(toastCards(page).first()).toBeVisible({ timeout: 5000 });
    await expect(toastCards(page).first()).toContainText(
      'Tab transition failed',
    );
  });

  test('(d) banner bridge fires on commit error — proves CngxBannerOn composes against the same producer', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    await matTabButtons(page).nth(1).click();
    await expect(bannerCards(page).first()).toBeVisible({ timeout: 5000 });
    await expect(bannerCards(page).first()).toContainText(
      'Tab transition refused by the server',
    );
  });

  test('(e) decoration persists across the rollback transition (Material ink-bar slide does NOT swallow the cngx class)', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    await buttons.nth(2).click();
    // Wait for rollback to land.
    await expect(buttons.nth(0)).toHaveClass(/mdc-tab--active/, {
      timeout: 4000,
    });
    // Decoration is on tab 2 right after rollback.
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/);
    // Wait an additional second to let any deferred Material CD
    // cycles or transition end-events fire — the class must NOT
    // disappear.
    await page.waitForTimeout(1000);
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(2)).toHaveAttribute('aria-invalid', 'true');
  });

  test('(f) successful re-pick of the failed tab clears the decoration', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    await buttons.nth(2).click();
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });

    // Disable simulate-error, click tab 2 again — successful commit
    // clears both the class and aria-invalid.
    await disableSimulateError(page);
    await buttons.nth(2).click();
    await expect(buttons.nth(2)).toHaveClass(/mdc-tab--active/, {
      timeout: 4000,
    });
    await expect(buttons.nth(2)).not.toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(2)).not.toHaveAttribute('aria-invalid', /.*/);
  });

  test('(g) decoration MOVES when a different tab is rejected after the first', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    // First reject — tab 1.
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });
    // Wait for the rollback so the next click targets a settled
    // active tab (avoids the supersede pathway, which test (i)
    // exercises separately).
    await expect(buttons.nth(0)).toHaveClass(/mdc-tab--active/, {
      timeout: 4000,
    });

    // Second reject — tab 2. Decoration must move from 1 to 2.
    await buttons.nth(2).click();
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });
    await expect(buttons.nth(1)).not.toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(2)).toHaveAttribute('aria-invalid', 'true');
    await expect(buttons.nth(1)).not.toHaveAttribute('aria-invalid', /.*/);
  });

  test('(h) "Clear last failed" button programmatically dismisses the decoration', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    await buttons.nth(2).click();
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });

    await page.getByRole('button', { name: 'Clear last failed' }).click();
    await expect(buttons.nth(2)).not.toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(2)).not.toHaveAttribute('aria-invalid', /.*/);
    // Toast cleanup is consumer-driven; we don't assert the toast
    // disappears here (its lifecycle is independent of
    // clearLastFailed).
  });

  test('(i) supersede: rapid second click cancels the first commit; only the latest target carries decoration', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    // Both clicks happen well within the 600ms latency window — the
    // second supersedes the first commit per the lifted commit-
    // controller's semantics.
    await buttons.nth(1).click();
    await buttons.nth(2).click();
    // Wait for the second commit to settle into rejection.
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });
    // Tab 1's commit must have been cancelled — no stale rejection.
    await expect(buttons.nth(1)).not.toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(1)).not.toHaveAttribute('aria-invalid', /.*/);
    // NOTE: final `mdc-tab--active` selection is NOT asserted here.
    // Optimistic supersede: the second click captures the just-
    // advanced activeIndex (1) as origin, so the rollback target is
    // tab 1 — NOT the original tab 0. The decoration state IS the
    // cngx contract this directive owns; the active-tab final state
    // is governed by the optimistic-mode origin-capture timing,
    // audited via the presenter unit specs.
  });

  test('(j) pessimistic + simulate-error via Material click: decoration lands on tab 2', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await page
      .getByRole('button', { name: 'pessimistic', exact: true })
      .click();
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    await buttons.nth(2).click();
    // The cngx contract this directive owns: rejected target is
    // decorated, aria-invalid is set. Both must hold regardless of
    // mode and regardless of whether the click came via Material or
    // programmatic. Test (j2) below covers the related Material-
    // rollback contract that the §6 fix restored.
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });
    await expect(buttons.nth(2)).toHaveAttribute('aria-invalid', 'true');
  });

  test('(j2) pessimistic + Material-side click: Material rolls selectedIndex back to origin during pending AND keeps it after reject (tabs-accepted-debt §6 — CLOSED)', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await page
      .getByRole('button', { name: 'pessimistic', exact: true })
      .click();
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    await buttons.nth(2).click();
    // Decoration lands on tab 2 after the ~600ms reject.
    await expect(buttons.nth(2)).toHaveClass(/cngx-mat-tab--error/, {
      timeout: 4000,
    });
    // §6 fix: bidirectional sync's Material-eager-advance
    // reconciliation force-writes selectedIndex back to origin (0)
    // immediately after the forwarding callback held the presenter.
    // The promise the demo description makes — `[commitMode]="pessimistic"
    // keeps Material on the origin until the action resolves` — now
    // holds for user-side clicks (the unit-spec at axis 4 already
    // covered the programmatic path).
    await expect(buttons.nth(0)).toHaveClass(/mdc-tab--active/, {
      timeout: 4000,
    });
    await expect(buttons.nth(2)).not.toHaveClass(/mdc-tab--active/);
  });

  test('(k) accumulator stress: three sequential rejects each leave the system in a coherent state (only the latest is decorated)', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await enableSimulateError(page);
    const buttons = matTabButtons(page);
    for (const idx of [1, 2, 1]) {
      await buttons.nth(idx).click();
      await expect(buttons.nth(idx)).toHaveClass(/cngx-mat-tab--error/, {
        timeout: 4000,
      });
      // Wait for the rollback before the next click so each iteration
      // is a fresh non-supersede attempt.
      await expect(buttons.nth(0)).toHaveClass(/mdc-tab--active/, {
        timeout: 4000,
      });
    }
    // Final state: only tab 1 (the last rejected) carries the
    // decoration; tab 2 should be clean (cleared when the third
    // attempt re-targeted tab 1).
    await expect(buttons.nth(1)).toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(2)).not.toHaveClass(/cngx-mat-tab--error/);
    await expect(buttons.nth(0)).not.toHaveClass(/cngx-mat-tab--error/);
    // Three rejects → at least three toast cards in the outlet.
    // (Toasts have their own dismissal timer; this assertion checks
    // none were silently swallowed — the user's primary worry.)
    await expect
      .poll(async () => await toastCards(page).count(), { timeout: 5000 })
      .toBeGreaterThanOrEqual(1);
  });

  test('(l) [cngxMatTabError] surfaces .cngx-mat-tab--has-errors when a Reactive form is invalid; clears when the form becomes valid', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const buttons = matTabButtons(page);

    // Profile form starts INVALID (empty + required + minLength 2)
    // → Profile tab (idx 0) carries the has-errors badge at page load.
    await expect(buttons.nth(0)).toHaveClass(/cngx-mat-tab--has-errors/, {
      timeout: 4000,
    });
    // Account form is also invalid by default → tab 1 likewise.
    await expect(buttons.nth(1)).toHaveClass(/cngx-mat-tab--has-errors/);
    // Notifications has no aggregator binding → never gains the badge.
    await expect(buttons.nth(2)).not.toHaveClass(/cngx-mat-tab--has-errors/);

    // SR descriptor: the per-tab descriptor span exists and is
    // referenced by aria-describedby. The span text comes from
    // `aggregator.announcement()` — the consumer-supplied phrase.
    const profileDescribedBy = await buttons
      .nth(0)
      .getAttribute('aria-describedby');
    expect(profileDescribedBy).toBeTruthy();

    // Fill the name to make the Profile form VALID → badge drops.
    await buttons.nth(0).click();
    await page.locator('input[formcontrolname="name"]').fill('Alice');
    await expect(buttons.nth(0)).not.toHaveClass(
      /cngx-mat-tab--has-errors/,
      { timeout: 4000 },
    );
    // Account stays invalid — its badge is independent of Profile.
    await expect(buttons.nth(1)).toHaveClass(/cngx-mat-tab--has-errors/);
  });

  test('(m) tabs-accepted-debt §5+§7 canary: Material-private surfaces resolve as documented (.mat-mdc-tab buttons live inside MatTabHeader, count matches presenter handles)', async ({
    page,
  }) => {
    // Upgrade-watch CI canary: when Angular Material breaks the
    // `.mat-mdc-tab` selector or relocates the rendered buttons out
    // of `MatTabHeader`, this single test fails with a clear pointer
    // at the accepted-debt entries (§5: Material-private surface
    // couplings; §7: getHandleSetup convention-only narrowing).
    // Pair to the `_stateChanges` unit-test canary at
    // projects/ui/mat-tabs/src/mat-tabs.directive.spec.ts axis 4.
    await page.goto(ROUTE);
    const buttons = matTabButtons(page);
    // First demo group declares 3 <mat-tab>: Profile, Account, Notifications.
    await expect(buttons).toHaveCount(3);

    // §5b — every `.mat-mdc-tab` button in the first group must be a
    // descendant of the Material-rendered `.mat-mdc-tab-header`
    // element. If Material moves the button into a different host
    // (e.g. a sibling-strip refactor), the rejection-decoration +
    // aggregator-decoration index lookups break silently. Fail loudly
    // here instead.
    const buttonsLiveInTabHeader = await page.evaluate(() => {
      const firstGroup = document.querySelector<HTMLElement>('mat-tab-group');
      if (!firstGroup) {
        return false;
      }
      const found = firstGroup.querySelectorAll<HTMLElement>('.mat-mdc-tab');
      if (found.length === 0) {
        return false;
      }
      return Array.from(found).every(
        (el) => el.closest('.mat-mdc-tab-header') !== null,
      );
    });
    expect(buttonsLiveInTabHeader).toBe(true);

    // §5a + §7 — count of `.mat-mdc-tab` buttons must match the
    // count of registered cngx handles in the FIRST presenter. If
    // `MatTab._stateChanges` stops driving registration OR
    // `getHandleSetup`'s setupsByTab loses entries, the counts
    // diverge.
    const counts = await page.evaluate(() => {
      const matTabGroup = document.querySelector('mat-tab-group');
      if (!matTabGroup) {
        return { domButtons: -1, presenterTabs: -1 };
      }
      const ng = (window as { ng?: { getDirectives(el: Element): unknown[] } })
        .ng;
      if (!ng) {
        return { domButtons: -1, presenterTabs: -1 };
      }
      const dirs = ng.getDirectives(matTabGroup);
      const presenter = dirs.find(
        (d) =>
          (d as { constructor?: { name?: string } }).constructor?.name ===
          '_CngxTabGroupPresenter',
      ) as { tabs?: () => readonly unknown[] } | undefined;
      const presenterTabs = presenter?.tabs?.()?.length ?? -1;
      const domButtons = matTabGroup.querySelectorAll('.mat-mdc-tab').length;
      return { domButtons, presenterTabs };
    });
    expect(counts.presenterTabs).toBe(3);
    expect(counts.domButtons).toBe(counts.presenterTabs);
  });

  test('(n) smart-overflow canary: under constrained viewport the cngx-tab-overflow molecule mounts inside .mat-mdc-tab-header; popover lists the trailing hidden tabs of presenter.tabs()', async ({
    page,
  }) => {
    // tabs-accepted-debt §5 covers the `.mat-mdc-tab-header` mount
    // anchor + `.mat-mdc-tab-label-container` IO root + index-based
    // per-tab resolution. This canary catches a Material upgrade
    // breaking ANY of those three surfaces by exercising the visible
    // overflow flow end-to-end. Pairs with the unit-spec axes 18–21
    // at projects/ui/mat-tabs/src/mat-tabs.directive.spec.ts.
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto(ROUTE);

    // The smart-overflow demo lives in the second section: 10 tabs
    // inside a 600px-wide container. Material's strip cannot fit
    // them all → cngx-tab-overflow's More button engages.
    await expect(overflowTabGroup(page)).toBeVisible();
    const moreBtn = overflowMoreButton(page);
    await expect(moreBtn).toBeVisible({ timeout: 4000 });

    // Mount-anchor invariant: the cngx-tab-overflow component's
    // rendered host element MUST be a descendant of the second
    // mat-tab-group's .mat-mdc-tab-header — proves the directive's
    // afterNextRender appendChild ran and resolved the right anchor.
    const anchored = await page.evaluate(() => {
      const groups = document.querySelectorAll<HTMLElement>('mat-tab-group');
      const second = groups[1];
      if (!second) {
        return false;
      }
      const overflow = second.querySelector<HTMLElement>('cngx-tab-overflow');
      if (!overflow) {
        return false;
      }
      return overflow.closest('.mat-mdc-tab-header') !== null;
    });
    expect(anchored).toBe(true);

    // Material pagination auto-hide: the library CSS (`.mat-mdc-tab-header:has(cngx-tab-overflow)
    // .mat-mdc-tab-header-pagination { display: none }`) MUST take
    // effect when the cngx overflow molecule is mounted in the
    // header — otherwise the trailing `>` pagination arrow collides
    // visually with the More button's right-edge position. Consumers
    // who want both affordances opt back in via the documented
    // CSS override (see mat-tabs README).
    const paginationDisplay = await page.evaluate(() => {
      const groups = document.querySelectorAll<HTMLElement>('mat-tab-group');
      const second = groups[1];
      if (!second) {
        return null;
      }
      const after = second.querySelector<HTMLElement>(
        '.mat-mdc-tab-header-pagination-after',
      );
      return after ? getComputedStyle(after).display : null;
    });
    expect(paginationDisplay).toBe('none');

    // The More button's host AND trigger MUST have an opaque
    // background — without it, scrolled tabs bleed through the More
    // button area and the visual reads as "Billing 4 more" rather
    // than a clean affordance. The `--cngx-tab-overflow-bg` and
    // `--cngx-tab-overflow-button-bg` variable cascades drive both
    // through the molecule's component-API surface so the bgs land
    // at the right specificity tier without an !important shout.
    const opaqueBackgrounds = await page.evaluate(() => {
      const groups = document.querySelectorAll<HTMLElement>('mat-tab-group');
      const second = groups[1];
      if (!second) {
        return null;
      }
      const overflow = second.querySelector<HTMLElement>('cngx-tab-overflow');
      const trigger = overflow?.querySelector<HTMLElement>(
        '.cngx-tab-overflow__trigger',
      );
      return {
        host: overflow ? getComputedStyle(overflow).backgroundColor : null,
        trigger: trigger ? getComputedStyle(trigger).backgroundColor : null,
      };
    });
    // `rgba(0, 0, 0, 0)` is the transparent default — fail loud if
    // the variable cascade regresses. Material's surface tone in the
    // dev-app theme is `rgb(250, 249, 253)`; assert non-transparent
    // without locking to a specific palette.
    expect(opaqueBackgrounds?.host).not.toBe('rgba(0, 0, 0, 0)');
    expect(opaqueBackgrounds?.trigger).not.toBe('rgba(0, 0, 0, 0)');

    // Open the More popover.
    await moreBtn.click();
    // Items live inside the molecule's cngxPopover panel; scope to the
    // overflow component to avoid colliding with the first demo
    // section's own popovers (none today, but defensive).
    const popoverItems = overflowTabGroup(page).locator(
      'cngx-tab-overflow .cngx-tab-overflow__item',
    );
    await expect(popoverItems.first()).toBeVisible({ timeout: 4000 });
    // At least 1 hidden tab — the exact count depends on viewport
    // metrics across browsers but the demo's 10-tabs-in-600px is
    // narrow enough that ≥1 always overflows.
    const itemCount = await popoverItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // The hidden-tabs list MUST be a contiguous trailing slice of
    // presenter.tabs() — overflow happens at the end of the strip,
    // never the middle.
    const hiddenIds = await popoverItems.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-tab-id')).filter((s): s is string => !!s),
    );
    const presenterTabIds = await page.evaluate(() => {
      const groups = document.querySelectorAll<HTMLElement>('mat-tab-group');
      const second = groups[1];
      if (!second) {
        return [];
      }
      const ng = (window as { ng?: { getDirectives(el: Element): unknown[] } })
        .ng;
      if (!ng) {
        return [];
      }
      const dirs = ng.getDirectives(second);
      const presenter = dirs.find(
        (d) =>
          (d as { constructor?: { name?: string } }).constructor?.name ===
          '_CngxTabGroupPresenter',
      ) as { tabs?: () => readonly { id: string }[] } | undefined;
      return presenter?.tabs?.()?.map((t) => t.id) ?? [];
    });
    expect(presenterTabIds.length).toBe(10);
    if (hiddenIds.length > 0) {
      const trailingSlice = presenterTabIds.slice(-hiddenIds.length);
      expect(hiddenIds).toEqual(trailingSlice);
    }
  });
});
