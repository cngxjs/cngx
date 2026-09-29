import { expect, test, type Page } from '@playwright/test';

import { EN_RESIDUE_STRINGS } from '../../../fixtures/i18n-en-residue.fixture';
import { gotoDemoLang } from '../../_helpers';
import { routesIn } from '../../_routes';

// Proves the German reference pack (`?lang=de`) leaves no library English on
// the residue pages. Every negative assert follows a positive web-first wait
// that proves the German copy rendered, and every assert is scoped to a
// `cngx-*` host: demo chrome is story copy, not library copy.

/** Fails loudly on a renamed story instead of landing on the home page. */
async function openDe(page: Page, route: string): Promise<void> {
  const segments = route.split('/').slice(0, -1);
  expect(routesIn(...segments).map((r) => r.path)).toContain(route);
  await gotoDemoLang(page, route, 'de');
}

test.describe('German language pack', () => {
  test('alert-stack overflow and dismiss', async ({ page }) => {
    await openDe(page, 'ui/feedback/alert-stack/overflow-collapse');
    await page.getByRole('button', { name: 'Add 7 Errors' }).click();
    const stack = page.locator('cngx-alert-stack');
    const overflow = stack.getByRole('button', { name: /^\+ \d+ weitere Meldungen$/ });
    await expect(overflow).toBeVisible();
    await expect(overflow).toHaveText(/^\s*\+ \d+ weitere\s*$/);
    await expect(stack.getByRole('button', { name: 'Schließen' }).first()).toBeVisible();
    await expect(stack).not.toContainText(EN_RESIDUE_STRINGS.overflowMore);
    await expect(stack.getByRole('button', { name: /Dismiss|more alerts/ })).toHaveCount(0);
  });

  test('toast repeat count and dismiss', async ({ page }) => {
    await openDe(page, 'ui/feedback/toast/programmatic-cngxtoaster');
    await page.getByRole('button', { name: '5x Dedup' }).click();
    const outlet = page.locator('cngx-toast-outlet');
    await expect(outlet).toContainText(/\(\d+-mal\)/);
    await expect(outlet.getByRole('button', { name: 'Schließen' }).first()).toBeVisible();
    await expect(outlet).not.toContainText(/\(x\d+\)/);
    await expect(outlet.getByRole('button', { name: EN_RESIDUE_STRINGS.dismiss })).toHaveCount(0);
  });

  test('banner dismiss', async ({ page }) => {
    await openDe(page, 'ui/feedback/banner/async-action');
    await page.getByRole('button', { name: 'Show Payment Banner (50/50 success)' }).click();
    const banner = page.locator('cngx-banner-outlet');
    await expect(banner.getByRole('button', { name: 'Schließen' })).toBeVisible();
    await expect(banner.getByRole('button', { name: EN_RESIDUE_STRINGS.dismiss })).toHaveCount(0);
  });

  test('async-container refresh indicator', async ({ page }) => {
    await openDe(page, 'ui/feedback/async-container/cngx-async-container-full-control-toast');
    await page.getByRole('button', { name: 'Load', exact: true }).click();
    await expect(page.locator('cngx-async-container')).toContainText('Gamma');
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    const indicator = page.locator('cngx-async-container cngx-loading-indicator');
    await expect(indicator).toHaveAttribute('aria-label', 'Inhalt wird aktualisiert');
    await expect(indicator).not.toHaveAttribute('aria-label', EN_RESIDUE_STRINGS.refreshing);
  });

  test('progress value text in the German percent format', async ({ page }) => {
    await openDe(page, 'ui/feedback/progress/linear-determinate');
    await page.getByRole('button', { name: 'Start Upload' }).click();
    const progress = page.locator('cngx-progress');
    await expect(progress).toHaveAttribute('aria-valuetext', /^\d+\u00a0%$/);
    await expect(progress).not.toHaveAttribute('aria-valuetext', /percent/);
  });

  test('unbound defaults', async ({ page }) => {
    await openDe(page, 'core/i18n/language-pack/unbound-defaults');
    const indicator = page.locator(
      'cngx-loading-indicator:not(cngx-loading-overlay cngx-loading-indicator)',
    );
    const overlay = page.locator('cngx-loading-overlay [aria-label]').first();
    const progress = page.locator('cngx-progress');
    const goal = page.locator('cngx-goal');
    await expect(indicator).toHaveAttribute('aria-label', 'Wird geladen');
    await expect(overlay).toHaveAttribute('aria-label', 'Wird geladen');
    await expect(progress).toHaveAttribute('aria-label', 'Fortschritt');
    await expect(goal).toHaveAttribute('aria-valuetext', '73 von 100');

    await page.locator('cngx-select-shell').getByRole('combobox').click();
    const search = page.locator('cngx-select-search input');
    await expect(search).toHaveAttribute('placeholder', 'Suchen…');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Show failing banner' }).click();
    const banner = page.locator('cngx-banner-outlet');
    await banner.getByRole('button', { name: 'Retry sync' }).click();
    await expect(banner).toContainText('Aktion fehlgeschlagen');

    await expect(indicator).not.toHaveAttribute('aria-label', EN_RESIDUE_STRINGS.loading);
    await expect(overlay).not.toHaveAttribute('aria-label', EN_RESIDUE_STRINGS.loading);
    await expect(progress).not.toHaveAttribute('aria-label', EN_RESIDUE_STRINGS.progress);
    await expect(goal).not.toHaveAttribute('aria-valuetext', EN_RESIDUE_STRINGS.goalValueText);
    await expect(search).not.toHaveAttribute('placeholder', EN_RESIDUE_STRINGS.searchPlaceholder);
    await expect(banner).not.toContainText(EN_RESIDUE_STRINGS.bannerActionFailed);
  });

  test('treetable bulk-selection announcements', async ({ page }) => {
    await openDe(page, 'data-display/treetable/base/multi-select-checkboxes');
    const table = page.locator('cngx-treetable');
    const selectAll = table.getByRole('columnheader').getByRole('checkbox');
    const region = table.locator('.cngx-treetable__sr').first();
    await selectAll.click();
    await expect(region).toHaveText(/^\d+ Zeilen ausgewählt$|^1 Zeile ausgewählt$/);
    await selectAll.click();
    await expect(region).toHaveText(/Zeilen? abgewählt$/);
    await expect(region).not.toHaveText(/rows? (de)?selected/);
  });

  test('filter-builder operator announcement', async ({ page }) => {
    await openDe(page, 'forms/filter-builder/basic-two-way-binding-json-inspection');
    const fb = page.locator('cngx-filter-builder');
    await fb.getByRole('button', { name: 'Filter hinzufügen' }).click();
    await fb.locator('.cngx-filter-builder__field-select').getByRole('combobox').first().click();
    await page.getByRole('option').first().click();
    await fb.locator('.cngx-filter-builder__operator-select').getByRole('combobox').first().click();
    await page.getByRole('option').nth(1).click();
    const region = fb.locator('.cngx-filter-builder__sr');
    await expect(region).toHaveText(/^Operator geändert zu /);
    await expect(region).not.toHaveText(/\b(eq|neq|gt|gte|lt|lte|contains|startsWith|endsWith)\b/);
    await expect(region).not.toContainText('Operator changed');
  });

  test('delta sentiment in German', async ({ page }) => {
    await openDe(page, 'common/data/delta/sentiment-polarity');
    const delta = page.locator('cngx-delta').first();
    await expect(delta).toHaveAttribute('aria-label', /^2,1\u00a0% (verbessert|verschlechtert)$/);
    await expect(delta).not.toHaveAttribute('aria-label', /improved|declined|unchanged/);
  });

  test('trend directions in German', async ({ page }) => {
    await openDe(page, 'common/data/trend/trend-directions');
    const trends = page.locator('cngx-trend');
    await expect(trends.nth(0)).toHaveAttribute('aria-label', /^\+5,3\u00a0% aufwärts$/);
    await expect(trends.nth(1)).toHaveAttribute('aria-label', /^2,1\u00a0% abwärts$/);
    await expect(trends.nth(2)).toHaveAttribute('aria-label', /^0,0\u00a0% unverändert$/);
    for (const i of [0, 1, 2]) {
      await expect(trends.nth(i)).not.toHaveAttribute('aria-label', /\b(up|down|unchanged)\b/);
    }
  });

  test('char-count readout', async ({ page }) => {
    await openDe(page, 'forms/input/character-counter');
    await page.getByRole('textbox').first().fill('abc');
    const count = page.locator('cngx-char-count').first();
    await expect(count).toHaveText('3 von 140');
    await expect(count).not.toHaveText('3/140');
  });
});
