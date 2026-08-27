# @cngx/mcp changelog

Hand-maintained, per package version. The root CHANGELOG.md tracks the cngx
library releases; this file tracks the MCP server package. The cngx release an
answer grounds against is a runtime property (`cngx://provenance`,
`groundedVersion`), not this version.

## 0.2.0 - 2026-08-27

### Breaking

- The six version-scoped tools (`find_component`, `get_api`, `get_slots`,
  `get_theme_tokens`, `get_di_tokens`, `get_config`) answer
  `{ ok: true, groundedVersion, result }` instead of `{ groundedVersion, result }`.
  Narrow on `ok === true`; the failure shape (`{ ok: false, reason, message }`)
  is unchanged.

### Added

- Injectable services (CngxToaster, CngxDialogOpener, ...) resolve through the
  query layer as `kind: 'injectable'`: `find_component`, `list_components`
  (kind filter extended), `get_api`, the `cngx://catalog` resource, and the
  `cngx://api/{name}` autocomplete. `migrate_usage` reports a removed service
  under the components delta (removal only, no rename inference).

### Fixed

- `gh release download` is pinned to `cngxjs/cngx` with `--repo`. Without it the
  repo resolved from the git remote of the current working directory, so every
  version-scoped fetch failed outside the cngx checkout (masked as
  `asset-missing`).

## 0.1.0 - 2026-08-20

Initial release: stdio MCP server over a bundled compodocx snapshot. Nine
read-only query tools, six browseable resources (catalog, tokens, provenance,
`api/{name}`, llms index, llms-full dump), three grounding prompts,
version-scoped queries via fail-safe `gh` fetch, and the `migrate_usage`
cross-release delta.
