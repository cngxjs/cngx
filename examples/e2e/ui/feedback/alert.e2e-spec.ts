import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['action-buttons', 'ui/feedback/alert/action-buttons'],
  ['auto-collapse', 'ui/feedback/alert/auto-collapse'],
  ['boolean-trigger', 'ui/feedback/alert/boolean-trigger-when'],
  ['closable', 'ui/feedback/alert/closable'],
  ['severities', 'ui/feedback/alert/severities'],
  ['state-driven', 'ui/feedback/alert/state-driven-visibility'],
];

test.describe('ui/feedback/alert', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
