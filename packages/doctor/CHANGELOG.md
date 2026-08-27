# @cngx/doctor changelog

Hand-maintained, per package version. The root CHANGELOG.md tracks the cngx
library releases; this file tracks the doctor package.

## 0.2.0 - 2026-08-27

### Breaking

- The exit code follows lint semantics: only error-severity findings exit
  non-zero. A project with only warn findings (e.g. `track-b-css-not-imported`)
  now exits `0`; the findings are still reported in both output forms. A CI job
  that gated on warn findings must read the `--json` contract instead.

### Added

- Style entries resolve from Nx `project.json` files (root, `apps/*`, `libs/*`;
  `architect` and `targets` shapes) in addition to `angular.json` and the
  conventional `src/styles.*` defaults - Nx workspaces no longer false-positive
  on the Track-B check.
- The Track-B stylesheet marker matches the entry path as well as its text, so
  listing `node_modules/@cngx/themes/cngx.css` directly in a build `styles`
  array counts as wired.
- `--help`/`-h` and `--version`/`-v`; unknown flags warn on stderr instead of
  being silently ignored.

## 0.1.0 - 2026-08-20

Initial release: deterministic project-wiring scanner with three checks
(`toaster-without-withtoasts`, `track-b-css-not-imported`,
`floating-fallback-missing`), human and `--json` output, and finding metadata
mirroring the `@cngx/eslint-plugin` shape.
