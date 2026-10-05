import { expect, test } from '@playwright/test';

import { gotoDemo, gotoDemoLang } from '../../_helpers';
import { routesIn } from '../../_routes';

// Proves every cngx i18n surface switches EN -> DE without a reload over one
// language Signal (`DEMO_LANG`), and the flip rule for live regions: the shown
// text stays until the next status change, which then speaks German.

const ROUTE = 'core/i18n/language-pack/live-switch';

test.describe('live language switch', () => {
  test('re-renders the reactive surfaces and keeps the live region until the next status', async ({
    page,
  }) => {
    // Step 6 waits out the story's 30 s action feedback window.
    test.setTimeout(90_000);
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(ROUTE);
    await gotoDemo(page, ROUTE);

    const delta = page.locator('cngx-delta');
    const trend = page.locator('cngx-trend');
    const goal = page.locator('cngx-goal');
    const progress = page.locator('cngx-progress');
    const segmented = page.locator('cngx-segmented-progress');
    const avatarGroup = page.locator('cngx-avatar-group');
    const liveRegion = page.locator('cngx-action-button .cngx-action-button__sr-only[aria-live]');
    const actionButton = page.locator('cngx-action-button').getByRole('button');

    // (1) EN baseline.
    await expect(delta).toHaveAttribute('aria-label', /declined|improved/);
    await expect(trend).toHaveAttribute('aria-label', '\u2068+5.3%\u2069 \u2068up\u2069');
    await expect(progress).toHaveAttribute('aria-valuetext', '42%');

    // (2) An announcement in English.
    await actionButton.click();
    await expect(liveRegion).toHaveText('Action succeeded');

    // (3) Flip to German, no reload.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(trend).toHaveAttribute('aria-label', /^\+5,3\u00a0% aufwärts$/);
    await expect(delta).toHaveAttribute('aria-label', /^2,1\u00a0% (verbessert|verschlechtert)$/);
    await expect(goal).toHaveAttribute('aria-valuetext', '73 von 100');
    await expect(page.getByLabel('beschäftigt')).toHaveCount(1);
    await expect(avatarGroup).toHaveAttribute('aria-label', /Avatare/);
    await expect(segmented).toHaveAttribute('aria-valuetext', '2 von 4');
    await expect(progress).toHaveAttribute('aria-valuetext', '42\u00a0%');

    // (4) The live region did not re-speak in German.
    await expect(liveRegion).toHaveText('Action succeeded');

    // (5) Popover close button in German.
    await page.getByRole('button', { name: 'Details' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button').last()).toHaveAccessibleName('Schließen');
    await page.keyboard.press('Escape');

    // (6) The next status change speaks German.
    await expect(liveRegion).toHaveText('', { timeout: 40_000 });
    await actionButton.click();
    await expect(liveRegion).toHaveText('Aktion erfolgreich');
  });

  test('stepper and tabs switch labels at once and keep a pending announcement', async ({
    page,
  }) => {
    const route = 'core/i18n/language-pack/live-switch-stepper-tabs';
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(route);
    await gotoDemo(page, route);

    const stepper = page.locator('cngx-stepper');
    const tabGroup = page.locator('cngx-tab-group');
    const stepperRegion = page.locator('.cngx-stepper__live-region');
    const tabsRegion = page.locator('.cngx-tabs__live-region');

    // (1) EN baseline.
    await expect(stepper).toHaveAttribute('aria-label', 'Stepper');
    await expect(stepper).toHaveAttribute('aria-roledescription', 'stepper');
    await expect(tabGroup).toHaveAttribute('aria-label', 'Tabs');
    await expect(tabGroup).toHaveAttribute('aria-roledescription', 'tab list');

    // (2) Start both pessimistic commits in English.
    await page.locator('button.cngx-stepper__step').nth(1).click();
    await tabGroup.getByRole('tab', { name: /Account/ }).click();
    await expect(stepperRegion).toHaveText('Committing step…');
    await expect(tabsRegion).toHaveText('Switching tab…');

    // (3) Flip to German mid-commit: labels switch, the pending phrases stay.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(stepper).toHaveAttribute('aria-label', 'Bestellschritte');
    await expect(stepper).toHaveAttribute('aria-roledescription', 'Schrittfolge');
    await expect(tabGroup).toHaveAttribute('aria-label', 'Reiter');
    await expect(tabGroup).toHaveAttribute('aria-roledescription', 'Reiterliste');
    await expect(stepperRegion).toHaveText('Committing step…');
    await expect(tabsRegion).toHaveText('Switching tab…');

    // (4) The landing announcements speak German, consumer labels included.
    await expect(stepperRegion).toHaveText('Schritt 2 von 3: Zahlung');
    await expect(tabsRegion).toHaveText('Nächster Reiter: Reiter 2 von 3: Konto');

    // (5) A flip after landing re-labels the landmarks, not the landed phrases.
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(stepper).toHaveAttribute('aria-label', 'Stepper');
    await expect(tabGroup).toHaveAttribute('aria-label', 'Tabs');
    await expect(stepperRegion).toHaveText('Schritt 2 von 3: Zahlung');
    await expect(tabsRegion).toHaveText('Nächster Reiter: Reiter 2 von 3: Konto');
  });

  test('common surfaces switch labels at once and keep a shown announcement', async ({ page }) => {
    const route = 'core/i18n/language-pack/live-switch-common';
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(route);
    await gotoDemo(page, route);

    const card = page.locator('cngx-card');
    const cardRegion = card.locator('[aria-live="polite"]');
    const copyBlock = page.locator('cngx-copy-block');
    const copyButton = copyBlock.getByRole('button');
    const copyRegion = copyBlock.locator('[aria-live="polite"]');
    const breadcrumb = page.locator('nav[cngxBreadcrumb]');
    const chipRemove = page.locator('cngx-chip button');
    const thumbs = page.locator('cngx-range-slider [cngxSliderThumb]');
    const toggle = page.locator('.cngx-expandable-text__toggle');
    const chartFallback = page.locator('cngx-chart .cngx-chart__fallback');
    const timelineEmpty = page.locator('cngx-timeline .cngx-timeline__empty');

    // (1) EN baseline.
    await expect(breadcrumb).toHaveAttribute('aria-label', 'Breadcrumb');
    await expect(chipRemove).toHaveAccessibleName('Remove');
    await expect(thumbs.first()).toHaveAttribute('aria-label', 'Minimum');
    await expect(toggle).toHaveText('Show less');
    await expect(chartFallback).toHaveText('No data');
    await expect(timelineEmpty).toHaveText('No events yet.');
    await expect(copyButton).toHaveText('Copy');

    // (2) Announcements in English.
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await card.click();
    await expect(cardRegion).toHaveText('Selected');
    await copyButton.click();
    await expect(copyRegion).toHaveText('Copied to clipboard');

    // (3) Flip to German, no reload: labels switch, announcements stay.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(breadcrumb).toHaveAttribute('aria-label', 'Brotkrumennavigation');
    await expect(chipRemove).toHaveAccessibleName('Entfernen');
    await expect(toggle).toHaveText('Weniger anzeigen');
    await expect(chartFallback).toHaveText('Keine Daten');
    await expect(timelineEmpty).toHaveText('Noch keine Ereignisse.');
    await expect(copyButton).toHaveText('Kopiert!');
    await expect(cardRegion).toHaveText('Selected');
    await expect(copyRegion).toHaveText('Copied to clipboard');

    // (4) The next change speaks German.
    await card.click();
    await expect(cardRegion).toHaveText('Abgewählt');
  });

  test('select copy switches labels at once and keeps a shown announcement', async ({ page }) => {
    const route = 'core/i18n/language-pack/live-switch-select';
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(route);
    await gotoDemo(page, route);

    const select = page.locator('cngx-multi-select');
    const clearAll = select.locator('.cngx-multi-select__clear-all');
    const chipRemove = (label: string) =>
      select.locator(`cngx-chip button[aria-label$=": ${label}"]`);
    const liveRegion = page.locator('body > span.cngx-sr-only[aria-live="polite"]');

    // (1) EN baseline.
    await expect(clearAll).toHaveAttribute('aria-label', 'Reset selection');
    await expect(chipRemove('Red')).toHaveAttribute('aria-label', 'Remove: Red');

    // (2) An announcement in English.
    await chipRemove('Blue').click();
    await expect(liveRegion).toHaveText('Colors: Blue removed, 2 selected');

    // (3) Flip to German, no reload: labels switch, the announcement stays.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(clearAll).toHaveAttribute('aria-label', 'Auswahl zurücksetzen');
    await expect(chipRemove('Red')).toHaveAttribute('aria-label', 'Entfernen: Red');
    await expect(liveRegion).toHaveText('Colors: Blue removed, 2 selected');

    // (4) The next change speaks German.
    await chipRemove('Green').click();
    await expect(liveRegion).toHaveText('Colors: Green entfernt, 1 ausgewählt');
  });

  test('forms and treetable copy switch labels at once and keep a shown validation message', async ({
    page,
  }) => {
    const route = 'core/i18n/language-pack/live-switch-forms';
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(route);
    await gotoDemo(page, route);

    const field = page.locator('cngx-form-field');
    const input = field.locator('input');
    const clear = field.locator('button[aria-label]');
    const errors = field.locator('cngx-field-errors');
    const expandToggle = page.locator('cngx-treetable .cngx-treetable__expand-cell button').first();

    // (1) EN baseline.
    await expect(clear).toHaveAttribute('aria-label', 'Clear');
    await expect(expandToggle).toHaveAttribute('aria-label', /^(Expand|Collapse)$/);

    // (2) A shown validation message in English.
    await input.click();
    await page.keyboard.press('Tab');
    await expect(errors).toHaveText('This field is required.');

    // (3) Flip to German, no reload: labels switch, the shown message stays.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(clear).toHaveAttribute('aria-label', 'Leeren');
    await expect(expandToggle).toHaveAttribute('aria-label', /^(Aufklappen|Zuklappen)$/);
    await expect(errors).toHaveText('This field is required.');

    // (4) The next error change speaks German.
    await input.fill('abc');
    await expect(errors).toHaveText('Mindestens 6 Zeichen.');
  });

  test('feedback and paginator copy switch labels at once and keep a spoken page change', async ({
    page,
  }) => {
    const route = 'core/i18n/language-pack/live-switch-ui-a';
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(route);
    await gotoDemo(page, route);

    const stack = page.locator('cngx-alert-stack');
    const paginator = page.locator('cngx-paginator');
    const next = paginator.locator('cngx-pgn-next button');
    const status = paginator.locator('cngx-pgn-status');
    const liveRegion = paginator.locator('.cngx-paginator__sr');

    // (1) EN baseline.
    await expect(stack).toHaveAttribute('aria-label', 'Alerts');
    await expect(paginator).toHaveAttribute('aria-label', 'Pagination');
    await expect(next).toHaveAccessibleName('Next page');
    await expect(status).toHaveText('Page 1 of 10');

    // (2) A spoken page change in English.
    await next.click();
    await expect(liveRegion).toHaveText('Page 2 of 10');

    // (3) Flip to German, no reload: labels switch, the spoken page stays.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(stack).toHaveAttribute('aria-label', 'Hinweise');
    await expect(paginator).toHaveAttribute('aria-label', 'Seitennavigation');
    await expect(next).toHaveAccessibleName('Nächste Seite');
    await expect(status).toHaveText('Seite 2 von 10');
    await expect(liveRegion).toHaveText('Page 2 of 10');

    // (4) The next page change speaks German.
    await next.click();
    await expect(liveRegion).toHaveText('Seite 3 von 10');
  });

  test('accordion and breadcrumb copy switch labels at once and keep a shown section error', async ({
    page,
  }) => {
    const route = 'core/i18n/language-pack/live-switch-ui-b';
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(route);
    await gotoDemo(page, route);

    const trail = page.locator('cngx-breadcrumb nav');
    const alert = page.locator('cngx-accordion-item [role="alert"]');
    const lockedHeader = page.locator('cngx-accordion-item button[aria-disabled="true"]');

    // (1) EN baseline: the failed section speaks its error.
    await expect(trail).toHaveAttribute('aria-label', 'Breadcrumb');
    await expect(alert).toHaveText('This section could not be loaded.');
    await expect(lockedHeader).toHaveAccessibleDescription('This section is currently unavailable.');

    // (2) Flip to German, no reload: labels switch, the shown error stays.
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(trail).toHaveAttribute('aria-label', 'Brotkrumenpfad');
    await expect(lockedHeader).toHaveAccessibleDescription(
      'Dieser Abschnitt ist derzeit nicht verfügbar.',
    );
    await expect(alert).toHaveText('This section could not be loaded.');

    // (3) The next failure speaks German.
    await page.getByRole('button', { name: 'Recover invoices' }).click();
    await expect(alert).toHaveCount(0);
    await page.getByRole('button', { name: 'Fail invoices' }).click();
    await expect(alert).toHaveText('Dieser Abschnitt konnte nicht geladen werden.');
  });

  test('the ?lang=de pack starts the same language signal in German and switches back', async ({
    page,
  }) => {
    await gotoDemoLang(page, ROUTE, 'de');

    const trend = page.locator('cngx-trend');
    const progress = page.locator('cngx-progress');
    const de = page.getByRole('button', { name: 'DE', exact: true });

    // (1) Bootstrapped in German, and the story's toggle reads the same signal.
    await expect(de).toHaveAttribute('aria-pressed', 'true');
    await expect(trend).toHaveAttribute('aria-label', /^\+5,3 % aufwärts$/);
    await expect(progress).toHaveAttribute('aria-valuetext', '42 %');

    // (2) Back to English, no reload.
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(trend).toHaveAttribute('aria-label', '\u2068+5.3%\u2069 \u2068up\u2069');
    await expect(progress).toHaveAttribute('aria-valuetext', '42%');
  });

  // The unbound-defaults story provides nothing itself, so only the root
  // `?lang=de` pack can localise it; hash navigation keeps the document, and
  // with it the language signal, alive between the two stories.
  test('the root ?lang=de pack follows the language signal', async ({ page }) => {
    const unbound = 'core/i18n/language-pack/unbound-defaults';
    expect(routesIn('core', 'i18n', 'language-pack').map((r) => r.path)).toContain(unbound);
    await gotoDemoLang(page, unbound, 'de');

    const indicator = page.locator(
      'cngx-loading-indicator:not(cngx-loading-overlay cngx-loading-indicator)',
    );
    const progress = page.locator('cngx-progress');
    await expect(indicator).toHaveAttribute('aria-label', 'Wird geladen');
    await expect(progress).toHaveAttribute('aria-label', 'Fortschritt');

    await page.evaluate((route) => (location.hash = `#/${route}`), ROUTE);
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await page.evaluate((route) => (location.hash = `#/${route}`), unbound);

    await expect(indicator).toHaveAttribute('aria-label', 'Loading');
    await expect(progress).toHaveAttribute('aria-label', 'Progress');
  });
});
