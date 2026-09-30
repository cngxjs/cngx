import { expect, test } from '@playwright/test';

import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Proves the reactive i18n surfaces switch EN -> DE without a reload,
// and the flip rule for live regions: the shown text stays until the next
// status change, which then speaks German. Only the surfaces listed here are
// claimed live; static-by-necessity inputs and older tokens are not.

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
    await expect(trend).toHaveAttribute('aria-label', '+5.3% up');
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
});
