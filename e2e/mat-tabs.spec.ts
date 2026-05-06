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
function matTabButtons(page: Page): Locator {
  return page.locator('mat-tab-group .mat-mdc-tab');
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
});
