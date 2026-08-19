/**
 * The source of record for the `track-b-css-not-imported` check: the cngx
 * `@Directive`s whose externalised CSS ships in the `cngx.components` cascade
 * layer of `@cngx/themes/cngx.css`. Importing any of these without importing the
 * Track-B stylesheet leaves them unstyled.
 *
 * There is no machine-readable Track-A/B map in the workspace - the set lives
 * only in the `@overview` doc-comment of `projects/themes/cngx.css` (the
 * `cngx.components` bullet). This list is a committed copy of that set and is
 * drift-guarded against the comment by `test/doctor.spec.mjs`, which fails CI on
 * divergence (the same committed-copy-plus-drift pattern as `plugin:drift`).
 *
 * Origin: the `cngx.components` bullet in `projects/themes/cngx.css`.
 */

/** @type {readonly string[]} */
export const TRACK_B_SYMBOLS = [
  'CngxAccordion',
  'CngxAsync',
  'CngxBackdrop',
  'CngxBadge',
  'CngxBottomSheet',
  'CngxBreadcrumb',
  'CngxButtonToggle',
  'CngxDialog',
  'CngxDivider',
  'CngxListbox',
  'CngxMenu',
  'CngxRipple',
  'CngxSlider',
  'CngxTooltip',
  'CngxFileDrop',
];
