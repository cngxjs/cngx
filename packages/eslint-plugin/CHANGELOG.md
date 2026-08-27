# @cngx/eslint-plugin changelog

Hand-maintained, per package version. The root CHANGELOG.md tracks the cngx
library releases; this file tracks the lint plugin.

## 0.2.0 - unreleased

### Breaking

- `no-required-on-bridge-input` no longer treats any
  `inject(X, { optional: true })` as the bridge shape. The trigger keys on named
  fallback tokens - `CNGX_STATEFUL` out of the box - so a class injecting an
  unrelated optional token with a genuinely required pure-data input is no
  longer flagged. A custom bridge token is named via the new `tokens` option:
  `['error', { tokens: ['MY_BRIDGE_TOKEN'] }]`.

### Added

- Per-rule reference pages under `docs/rules/` - the pages `meta.docs.url` has
  always pointed at now exist.
- `plugin.meta.version`, kept in step with `package.json` by a spec.

## 0.1.0 - 2026-08-20

Initial release: six rules (`no-effect-in-ngoninit`,
`no-behaviorsubject-local-state`, `model-for-two-way`,
`no-required-on-bridge-input`, `menu-trigger-needs-popover-anchor`,
`untracked-in-effect`), the `recommended` and `all` flat configs derived from
the metadata seam, and the dependency-free `@cngx/eslint-plugin/metadata` entry.
