import type { Page } from '@playwright/test';

import { ROUTES_META } from '../../src/app/_routes-meta';
import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Story: forms/select family - single/multi/combobox/
// typeahead/reorderable/select-shell variants, slots, async, RF/SF, etc.
// Smoke each route: the story's select element mounts without runtime errors.

/**
 * Element selector per select-family class a story can name in
 * `apiComponents`. The nine composites come first so a story that also lists
 * declarative parts is checked against its composite.
 */
const SELECTOR_OF: ReadonlyMap<string, string> = new Map([
  ['CngxSelect', 'cngx-select'],
  ['CngxMultiSelect', 'cngx-multi-select'],
  ['CngxCombobox', 'cngx-combobox'],
  ['CngxTypeahead', 'cngx-typeahead'],
  ['CngxTreeSelect', 'cngx-tree-select'],
  ['CngxReorderableMultiSelect', 'cngx-reorderable-multi-select'],
  ['CngxActionSelect', 'cngx-action-select'],
  ['CngxActionMultiSelect', 'cngx-action-multi-select'],
  ['CngxSelectShell', 'cngx-select-shell'],
  ['CngxSelectOption', 'cngx-option'],
  ['CngxSelectOptgroup', 'cngx-optgroup'],
  ['CngxSelectDivider', 'cngx-select-divider'],
]);

/** Stories whose select mounts on demand, with the step that mounts it. */
const MOUNT_ON_DEMAND: ReadonlyMap<string, (page: Page) => Promise<void>> = new Map([
  [
    'forms/select/single-select/autofocus-on-mount',
    (page: Page) => page.locator('.cngx-ex-artifact button.chip').click(),
  ],
]);

function mountedSelectorOf(path: string): string | undefined {
  const api = ROUTES_META.find((meta) => meta.path === path)?.apiComponents ?? [];
  const known = [...SELECTOR_OF.keys()].find((name) => api.includes(name));
  return known === undefined ? undefined : SELECTOR_OF.get(known);
}

test.describe('forms/select', () => {
  for (const { name, path } of routesUnder('forms', 'select')) {
    test(`${name}: the select mounts`, async ({ page }) => {
      const selector = mountedSelectorOf(path);
      expect(selector, `${path} names no select-family element in apiComponents`).toBeDefined();
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await MOUNT_ON_DEMAND.get(path)?.(page);
      await expect(page.locator(`.cngx-ex-artifact ${selector}`).first()).toBeAttached();
    });
  }
});
