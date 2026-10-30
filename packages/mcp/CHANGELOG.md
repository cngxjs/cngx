# @cngx/mcp changelog

Hand-maintained, per package version. The root CHANGELOG.md tracks the cngx
library releases; this file tracks the MCP server package. The cngx release an
answer grounds against is a runtime property (`cngx://provenance`,
`groundedVersion`), not this version.

## Unreleased

### Breaking

- `get_story_example` answers `{ ok: true, groundedVersion, result }` like the
  other name tools instead of the bare result. Narrow on `ok === true`;
  `groundedVersion` is the bundled release, since the tool has no `version`
  input.
- A malformed version answers the new failure reason `invalid-version` before
  any fetch, on every version-scoped tool and on `migrate_usage` (both `from`
  and `to` are checked before either is resolved). `asset-missing` no longer
  covers it. A client that switches exhaustively on `reason` sees a new value.
  Leading zeros (`01.2.3`) and empty prerelease ids (`1.2.3-rc.`) are now
  rejected.

### Added

- A `migrate_usage` `signatureChanged` row of an input carries `changed`, the
  parts of its binding contract that moved (`type`, `required`,
  `binding kind`). Rows of the other categories have no `changed` field.

### Changed

- The `list_components` description and its `lib` input say the lib filter is
  matched case-insensitively; they used to say exact. The filter itself is
  unchanged.
- An `invalid-version` answer of `migrate_usage` names the argument:
  `from "1.2" is not a release version; ...`.

### Fixed

- `migrate_usage` reports the selector change of an inferred entry rename.
- `get_config` lists providers and features in code-point order, not locale
  order.
- An ambiguous name whose candidates all map to the same config token resolves
  in `get_config` instead of answering the ambiguity.
- The ambiguity hint asks for the class name of a candidate, never for a
  selector that would be ambiguous again.
- A blank name (`" "`) is invalid input on every name tool, like `""`.
- `migrate_usage` without `to` over an unstamped bundled snapshot answers
  `asset-missing` naming the cause, instead of treating the label `unknown` as
  a version.
- A numeric prerelease id with a leading zero (`1.2.3-rc.01`) is rejected as
  `invalid-version`.
- `cngx://api/{name}` completions are in code-point order, not locale order.

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
