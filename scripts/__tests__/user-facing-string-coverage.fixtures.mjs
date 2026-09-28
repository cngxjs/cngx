/**
 * Manifests for `user-facing-string-coverage.test.mjs`.
 *
 * Kept beside the guard rather than inside it: the three lists are the
 * auditable artefact of the i18n coverage program, they change on a different
 * cadence than the scanner, and a reviewer should be able to read the ratchet
 * without paging past 200 lines of regex.
 *
 * A row is keyed by `file` + `value`, never by line - a string that moves
 * within its file is the same gap, and a ratchet keyed on line numbers would
 * fail on every unrelated edit above it.
 */

/**
 * One row of any of the three manifests.
 *
 * @typedef {object} StringManifestEntry
 * @property {string} file Repo-relative path, exactly as the scanner reports it.
 * @property {string} value The literal, verbatim.
 * @property {string} note Why this row exists. One clause, no prose.
 * @property {2 | 3 | 4} [closesIn] RATCHET rows only: the phase of the i18n
 *   residue program whose PR removes the row.
 */

/**
 * The last phase of the i18n residue program that has fully landed. Bumped by
 * the final commit of each phase; a RATCHET row whose `closesIn` is at or
 * below it fails the suite, so no row outlives the phase that owns it.
 */
export const COMPLETED_PHASE = 1;

/**
 * Exact RATCHET length. Asserted equal, so the ceiling cannot be padded:
 * every row-closing commit removes its rows and lowers this number with them.
 */
export const RATCHET_CEILING = 71;

/**
 * The ceiling at the end of Phase 1, frozen. Never raised again: from
 * `COMPLETED_PHASE >= 1` on, `RATCHET_CEILING` may never exceed it, so no new
 * row enters after Phase 1.
 */
export const PHASE_1_CEILING = 71;

/**
 * The gap list: user-facing strings that ship with no app-wide override path.
 *
 * Temporarily non-empty while the i18n residue program closes the gaps the
 * hardened scanner surfaced. Its length is pinned to `RATCHET_CEILING`
 * exactly, every row names the phase that closes it, and the list only
 * shrinks. It is empty again, and asserted empty, by the end of Phase 4.
 *
 * @type {readonly StringManifestEntry[]}
 */
export const RATCHET = [
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'United States',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'United Kingdom',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Germany',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Austria',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Switzerland',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'France',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Italy',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Spain',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Slovenia',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Croatia',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Poland',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Japan',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/forms/input/phone-input/countries.ts',
    value: 'Brazil',
    note: 'CNGX_PHONE_COUNTRIES label, only a per-instance [countries] swap reaches it',
    closesIn: 4,
  },
  {
    file: 'projects/ui/action-button/action-button.ts',
    value: 'Action succeeded',
    note: 'per-instance [succeededAnnouncement] / [succeededLabel] only, no app-wide path',
    closesIn: 2,
  },
  {
    file: 'projects/ui/action-button/action-button.ts',
    value: 'Action failed',
    note: 'per-instance [failedAnnouncement] / [failedLabel] only, no app-wide path',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/loading/progress.ts',
    value: '{} percent',
    note: 'progress aria-valuetext composed by hand, not locale-formatted',
    closesIn: 2,
  },
  {
    file: 'projects/common/data/display/goal/goal.component.ts',
    value: '{} of {}',
    note: 'goal readout composed in English word order',
    closesIn: 3,
  },
  {
    file: 'projects/common/display/segmented-progress/segmented-progress.component.ts',
    value: '{} of {}',
    note: 'segment readout composed in English word order',
    closesIn: 3,
  },
  {
    file: 'projects/common/display/avatar-group/avatar-group.component.ts',
    value: '{} {}, {} not shown',
    note: 'overflow label composed in English word order',
    closesIn: 3,
  },
  {
    file: 'projects/ui/mat-stepper/material-bridge/handle.ts',
    value: 'Step {}',
    note: 'fallback step label composed by hand',
    closesIn: 3,
  },
  {
    file: 'projects/data-display/treetable/treetable.component.ts',
    value: '{} rows selected',
    note: 'selection announcement plural composed by hand',
    closesIn: 4,
  },
  {
    file: 'projects/data-display/treetable/treetable.component.ts',
    value: '{} rows deselected',
    note: 'deselection announcement plural composed by hand',
    closesIn: 4,
  },
  {
    file: 'projects/data-display/treetable/treetable.component.ts',
    value: '1 row selected',
    note: 'selection announcement singular hardcoded',
    closesIn: 4,
  },
  {
    file: 'projects/data-display/treetable/treetable.component.ts',
    value: '1 row deselected',
    note: 'deselection announcement singular hardcoded',
    closesIn: 4,
  },
  {
    file: 'projects/ui/feedback/alert/alert.ts',
    value: 'Dismiss',
    note: 'dismiss button label static in the template',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/alert/alert-stack.ts',
    value: 'Dismiss',
    note: 'dismiss button label static in the template',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/alert/alert-stack.ts',
    value: '+ {} more',
    note: 'overflow button text composed in the template',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/toast/toast-outlet.ts',
    value: 'Dismiss',
    note: 'dismiss button label static in the template',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/banner/banner-outlet.ts',
    value: 'Dismiss',
    note: 'dismiss button label static in the template',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/banner/banner-outlet.ts',
    value: 'Action failed',
    note: 'banner action error text static in the template',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/async-container/async-container.ts',
    value: 'Refreshing content',
    note: 'refreshing live-region text static in the template',
    closesIn: 2,
  },
  {
    file: 'projects/common/popover/popover-panel.component.ts',
    value: 'Close',
    note: 'close button label static in the template',
    closesIn: 3,
  },
  {
    file: 'projects/forms/input/char-count.component.ts',
    value: '{} (min {})',
    note: 'minimum readout composed in the template',
    closesIn: 4,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-accordion-skins.css',
    value: 'NOTE',
    note: 'skin tag generated by CSS content, read by screen readers, no token reaches it',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-count.directive.ts',
    value: 'result',
    note: 'count noun is a bare input default',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-count.directive.ts',
    value: 'results',
    note: 'count noun is a bare input default',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-sort-header.directive.ts',
    value: 'not sorted, activate to sort ascending',
    note: 'sort status is a bare input default through a const',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-sort-header.directive.ts',
    value: 'sorted ascending, activate to sort descending',
    note: 'sort status is a bare input default through a const',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-sort-header.directive.ts',
    value: 'sorted descending, activate to sort ascending',
    note: 'sort status is a bare input default through a const',
    closesIn: 2,
  },
  {
    file: 'projects/common/data/display/delta/delta.component.ts',
    value: 'improved',
    note: 'sentiment word spoken in the label, no token',
    closesIn: 3,
  },
  {
    file: 'projects/common/data/display/delta/delta.component.ts',
    value: 'declined',
    note: 'sentiment word spoken in the label, no token',
    closesIn: 3,
  },
  {
    file: 'projects/common/data/display/delta/delta.component.ts',
    value: 'unchanged',
    note: 'sentiment word spoken in the label, no token',
    closesIn: 3,
  },
  {
    file: 'projects/common/data/display/trend/trend.component.ts',
    value: 'up',
    note: 'direction word spoken in the label, no token',
    closesIn: 3,
  },
  {
    file: 'projects/common/data/display/trend/trend.component.ts',
    value: 'down',
    note: 'direction word spoken in the label, no token',
    closesIn: 3,
  },
  {
    file: 'projects/common/data/display/trend/trend.component.ts',
    value: 'unchanged',
    note: 'direction word spoken in the label, no token',
    closesIn: 3,
  },
  {
    file: 'projects/common/display/avatar-group/avatar-group.component.ts',
    value: 'avatars',
    note: 'overflow noun is a bare input default',
    closesIn: 3,
  },
  {
    file: 'projects/ui/feedback/loading/loading-indicator.ts',
    value: 'Loading',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/loading/loading-overlay.ts',
    value: 'Loading',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/feedback/loading/progress.ts',
    value: 'Progress',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/sidenav/sidenav.ts',
    value: 'Resize navigation',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/speak/speak-button.ts',
    value: 'Read aloud',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/speak/speak-button.ts',
    value: 'Stop speaking',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/command-palette/palette/command-palette.component.ts',
    value: 'Command palette',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-filter-field.component.ts',
    value: 'Filter',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-filter.directive.ts',
    value: 'Filter rows',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-row.component.ts',
    value: 'Failed to load',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-sort-header.directive.ts',
    value: 'Sorted by {label} ascending',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-sort-header.directive.ts',
    value: 'Sorted by {label} descending',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-sort-header.directive.ts',
    value: 'Sorting by {label} cleared',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/common/interactive/async-click/async-click.directive.ts',
    value: 'Action succeeded',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/common/interactive/async-click/async-click.directive.ts',
    value: 'Action failed',
    note: 'bare input default, per-instance only',
    closesIn: 2,
  },
  {
    file: 'projects/common/display/chip/chip.component.ts',
    value: 'Remove',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/interactive/breadcrumb/breadcrumb.directive.ts',
    value: 'Breadcrumb',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/interactive/copy/copy-block.ts',
    value: 'Copy',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/interactive/copy/copy-block.ts',
    value: 'Copied!',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/interactive/copy/copy-block.ts',
    value: 'Copied to clipboard',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/interactive/slider/range-slider.component.ts',
    value: 'Minimum',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/interactive/slider/range-slider.component.ts',
    value: 'Maximum',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/layout/text/expandable-text.ts',
    value: 'Show more',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/common/layout/text/expandable-text.ts',
    value: 'Show less',
    note: 'bare input default, per-instance only',
    closesIn: 3,
  },
  {
    file: 'projects/forms/select/declarative/select-search.component.ts',
    value: 'Search…',
    note: 'bare input default, per-instance only',
    closesIn: 4,
  },
];

/**
 * Strings the scanner cannot prove are covered, but which are - the override
 * read happens through an indirection the scanner does not follow.
 *
 * Not a parking lot: every row names the token that overrides it.
 *
 * @type {readonly StringManifestEntry[]}
 */
export const ALREADY_COVERED = [];

/**
 * Deliberate non-hooks. Each row cites the accepted-debt entry or the design
 * reason that settled it, so the guard does not re-raise a closed decision on
 * every run.
 *
 * @type {readonly StringManifestEntry[]}
 */
export const EXCLUDED = [
  {
    file: 'projects/common/interactive/guard/can-deactivate.ts',
    value: 'You have unsaved changes. Leave anyway?',
    note: 'design reason: canDeactivateWhenClean(message) takes the caller copy, this is its fallback',
  },
];
