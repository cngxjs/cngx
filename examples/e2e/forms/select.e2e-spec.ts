import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: forms/select family — 70 routes covering single/multi/combobox/
// typeahead/reorderable/select-shell variants, slots, async, RF/SF, etc.
// Smoke each route: page renders header without runtime errors.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['action-multi-select_async-error-rollback-observation', 'forms/select/action-multi-select/async-error-rollback-observation'],
  ['action-multi-select_basic-create-appends-panel-stays-open', 'forms/select/action-multi-select/basic-create-appends-panel-stays-open'],
  ['action-multi-select_closeoncreate-true-confirm-to-create-ux', 'forms/select/action-multi-select/closeoncreate-true-confirm-to-create-ux'],
  ['action-multi-select_dirty-guard-in-panel-mini-form', 'forms/select/action-multi-select/dirty-guard-in-panel-mini-form'],
  ['action-multi-select_pre-seeded-change-event-log', 'forms/select/action-multi-select/pre-seeded-change-event-log'],
  ['action-select_async-error-rollback-observation', 'forms/select/action-select/async-error-rollback-observation'],
  ['action-select_basic-sync-quick-create', 'forms/select/action-select/basic-sync-quick-create'],
  ['action-select_custom-action-template-split-actions', 'forms/select/action-select/custom-action-template-split-actions'],
  ['action-select_dirty-guard-escape-cancel-click-outside-blocked', 'forms/select/action-select/dirty-guard-escape-cancel-click-outside-blocked'],
  ['action-select_pre-seeded-created-output-log', 'forms/select/action-select/pre-seeded-created-output-log'],
  ['assemble-it-yourself-atoms-element-components', 'forms/select/assemble-it-yourself-atoms-element-components'],
  ['async-state-consumer', 'forms/select/async-state-consumer'],
  ['autofocus-on-mount', 'forms/select/autofocus-on-mount'],
  ['blocker-declarative-composition-inside-cngx-select', 'forms/select/blocker-declarative-composition-inside-cngx-select'],
  ['clearable', 'forms/select/clearable'],
  ['combobox-async-via-state-skipinitial-searchtermchange', 'forms/select/combobox-async-via-state-skipinitial-searchtermchange'],
  ['combobox-basic-tag-picker-with-typeahead-filter', 'forms/select/combobox-basic-tag-picker-with-typeahead-filter'],
  ['combobox-clearable-custom-cngxselectclearbutton', 'forms/select/combobox-clearable-custom-cngxselectclearbutton'],
  ['combobox-per-toggle-commitaction', 'forms/select/combobox-per-toggle-commitaction'],
  ['combobox-text-summary-via-cngxcomboboxtriggerlabel', 'forms/select/combobox-text-summary-via-cngxcomboboxtriggerlabel'],
  ['commit-action-async-write', 'forms/select/commit-action-async-write'],
  ['commiterrordisplay-variants-banner-inline-none', 'forms/select/commiterrordisplay-variants-banner-inline-none'],
  ['fixed-width-panel-number', 'forms/select/fixed-width-panel-number'],
  ['keyboard-pageup-pagedown-on-a-long-list', 'forms/select/keyboard-pageup-pagedown-on-a-long-list'],
  ['loading-empty-templates', 'forms/select/loading-empty-templates'],
  ['loading-variants', 'forms/select/loading-variants'],
  ['multi-async-options-via-state', 'forms/select/multi-async-options-via-state'],
  ['multi-basic', 'forms/select/multi-basic'],
  ['multi-clearable', 'forms/select/multi-clearable'],
  ['multi-custom-cngxmultiselectchip-template', 'forms/select/multi-custom-cngxmultiselectchip-template'],
  ['multi-per-toggle-commitaction', 'forms/select/multi-per-toggle-commitaction'],
  ['multi-text-summary-via-cngxmultiselecttriggerlabel', 'forms/select/multi-text-summary-via-cngxmultiselecttriggerlabel'],
  ['optgroups', 'forms/select/optgroups'],
  ['reactive-forms-adaptformcontrol', 'forms/select/reactive-forms-adaptformcontrol'],
  ['refreshing-variants', 'forms/select/refreshing-variants'],
  ['reorderable-multi-select_basic-drag-chips-via-mouse-touch', 'forms/select/reorderable-multi-select/basic-drag-chips-via-mouse-touch'],
  ['reorderable-multi-select_commit-action-optimistic-pessimistic-with-supersede', 'forms/select/reorderable-multi-select/commit-action-optimistic-pessimistic-with-supersede'],
  ['reorderable-multi-select_keyboard-reorder-alt-arrow-home-end', 'forms/select/reorderable-multi-select/keyboard-reorder-alt-arrow-home-end'],
  ['reorderable-multi-select_optional-drag-handle-glyph', 'forms/select/reorderable-multi-select/optional-drag-handle-glyph'],
  ['reorderable-multi-select_pre-seeded-values-reorder-log', 'forms/select/reorderable-multi-select/pre-seeded-values-reorder-log'],
  ['rich-option-rendering', 'forms/select/rich-option-rendering'],
  ['select-shell_async-commit-pending-error-inline-glyphs', 'forms/select/select-shell/async-commit-pending-error-inline-glyphs'],
  ['select-shell_basic-flat-declarative-options', 'forms/select/select-shell/basic-flat-declarative-options'],
  ['select-shell_custom-glyphs-clearglyph-caretglyph', 'forms/select/select-shell/custom-glyphs-clearglyph-caretglyph'],
  ['select-shell_empty-state-loading-flag', 'forms/select/select-shell/empty-state-loading-flag'],
  ['select-shell_grouped-divider-projected-hierarchy', 'forms/select/select-shell/grouped-divider-projected-hierarchy'],
  ['select-shell_inside-cngx-form-field-reactive-forms', 'forms/select/select-shell/inside-cngx-form-field-reactive-forms'],
  ['select-shell_rich-content-option-plain-text-trigger', 'forms/select/select-shell/rich-content-option-plain-text-trigger'],
  ['select-shell_search-declarative-cngx-select-search', 'forms/select/select-shell/search-declarative-cngx-select-search'],
  ['select-shell_showcase-every-feature-combined', 'forms/select/select-shell/showcase-every-feature-combined'],
  ['selection-indicator-variant-radio', 'forms/select/selection-indicator-variant-radio'],
  ['signal-forms-required', 'forms/select/signal-forms-required'],
  ['slot-override-cngxcomboboxchip', 'forms/select/slot-override-cngxcomboboxchip'],
  ['slot-override-cngxselectcommiterror', 'forms/select/slot-override-cngxselectcommiterror'],
  ['slot-override-cngxselectloading', 'forms/select/slot-override-cngxselectloading'],
  ['slot-override-cngxselectloadingglyph', 'forms/select/slot-override-cngxselectloadingglyph'],
  ['slot-override-cngxselectoptgroup', 'forms/select/slot-override-cngxselectoptgroup'],
  ['slot-override-cngxselectplaceholder', 'forms/select/slot-override-cngxselectplaceholder'],
  ['slot-override-cngxselectrefreshing', 'forms/select/slot-override-cngxselectrefreshing'],
  ['slot-override-cngxselectretrybutton', 'forms/select/slot-override-cngxselectretrybutton'],
  ['slot-overrides-cngxselectoptionpending-cngxselectoptionerror', 'forms/select/slot-overrides-cngxselectoptionpending-cngxselectoptionerror'],
  ['standalone', 'forms/select/standalone'],
  ['template-override-custom-caret', 'forms/select/template-override-custom-caret'],
  ['template-override-custom-check', 'forms/select/template-override-custom-check'],
  ['template-override-rich-trigger-label', 'forms/select/template-override-rich-trigger-label'],
  ['typeahead-async-state-load-error-retry', 'forms/select/typeahead-async-state-load-error-retry'],
  ['typeahead-bound-to-a-typed-form-field', 'forms/select/typeahead-bound-to-a-typed-form-field'],
  ['typeahead-cngxselectoptionlabel-slot-override', 'forms/select/typeahead-cngxselectoptionlabel-slot-override'],
  ['typeahead-commitaction-with-optimistic-pessimistic-mode', 'forms/select/typeahead-commitaction-with-optimistic-pessimistic-mode'],
  ['typeahead-single-value-async-autocomplete', 'forms/select/typeahead-single-value-async-autocomplete'],
];

test.describe('forms/select', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
