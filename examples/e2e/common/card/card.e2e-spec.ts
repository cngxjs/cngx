import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: forms/card/card-demo is the flat-demo for CngxCard — 12 stories
// at common/card/<slug> (no extra category nesting). Smoke each.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['action-card-with-selection', 'common/card/action-card-with-selection'],
  ['card-with-badge', 'common/card/card-with-badge'],
  ['card-with-disclosure', 'common/card/card-with-disclosure-expand-collapse'],
  ['card-with-expandable-text', 'common/card/card-with-expandable-text'],
  ['card-with-image', 'common/card/card-with-image'],
  ['card-with-speak-badge', 'common/card/card-with-speak-badge'],
  ['disabled-with-reason', 'common/card/disabled-with-reason'],
  ['interactive-with-actions', 'common/card/interactive-card-with-actions'],
  ['loading-state', 'common/card/loading-state'],
  ['severity-accent', 'common/card/severity-accent'],
  ['skeleton-loading', 'common/card/skeleton-loading'],
  ['title-subtitle-footer', 'common/card/title-subtitle-footer'],
];

test.describe('common/card/card', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
