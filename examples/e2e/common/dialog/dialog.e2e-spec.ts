import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxDialog — 10 routes covering alert, bottom-sheet, draggable,
// grid-snap, nested-stack, programmatic, template-directives, etc.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['alert', 'common/dialog/alert-dialog'],
  ['bottom-sheet', 'common/dialog/bottom-sheet'],
  ['opener-programmatic', 'common/dialog/cngxdialogopener-programmatic'],
  ['draggable', 'common/dialog/draggable-dialog'],
  ['fully-declarative', 'common/dialog/fully-declarative'],
  ['grid-snap', 'common/dialog/grid-snap-live-vs-release'],
  ['nested-stack', 'common/dialog/nested-dialogs-cngxdialogstack'],
  ['non-modal', 'common/dialog/non-modal-panel'],
  ['programmatic-control', 'common/dialog/programmatic-control'],
  ['template-directives', 'common/dialog/template-directives'],
];

test.describe('common/dialog/dialog', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`dialog-${name}.png`, { fullPage: true });
    });
  }
});
