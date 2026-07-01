// Canonical Conventional-Commit scope allow-list for cngx.
//
// Single source of truth for commit-message and PR-title validation. Mirrors
// the "Scopes" section of CONTRIBUTING.md. Library scopes feed the changelog;
// non-library scopes are valid but filtered out of it (see cliff.toml).
//
// commitlint imports this directly (commitlint.config.mjs). The PR-title
// GitHub Action (.github/workflows/pr-title.yml) embeds the same list under
// `scopes:` - keep the two in sync when adding a scope.

// Library scopes - <lib> and <lib>/<area>. These reach the changelog.
export const LIBRARY_SCOPES = [
  'utils',
  'core',
  'common',
  'common/a11y',
  'common/interactive',
  'common/display',
  'common/popover',
  'common/chart',
  'common/stepper',
  'common/tabs',
  'common/card',
  'common/dialog',
  'common/data',
  'common/layout',
  'forms',
  'forms/controls',
  'forms/validators',
  'forms/field',
  'forms/input',
  'forms/select',
  'forms/filter-builder',
  'data-display',
  'data-display/treetable',
  'ui',
  'ui/layout',
  'ui/overlay',
  'ui/mat-paginator',
  'ui/paginator',
  'ui/empty-state',
  'ui/feedback',
  'ui/stepper',
  'ui/mat-stepper',
  'ui/tabs',
  'ui/mat-tabs',
  'ui/breadcrumb',
  'ui/sidenav',
  'ui/skeleton',
  'ui/speak',
  'ui/action-button',
  'themes/material',
];

// Non-library scopes - valid on commits/PRs but excluded from the changelog.
export const NON_LIBRARY_SCOPES = [
  'examples',
  'examples-gen',
  'docs',
  'ci',
  'build',
  'chore',
  'changelog',
  'deps',
  'release',
];

export const ALL_SCOPES = [...LIBRARY_SCOPES, ...NON_LIBRARY_SCOPES];
