# @cngx/mcp changelog

Hand-maintained, per package version. The root CHANGELOG.md tracks the cngx
library releases; this file tracks the MCP server package. It is released in
lockstep with the cngx libraries: `@cngx/mcp` X.Y.Z bundles the X.Y.Z snapshot,
and a tool's `version` argument still grounds an answer against another
release (`cngx://provenance` and `groundedVersion` name the one that answered).

## Unreleased

### Breaking

- `get_story_example` answers `{ ok: true, groundedVersion, result }` like the
  other name tools instead of the bare result. Narrow on `ok === true`;
  `groundedVersion` is the bundled release, since the tool has no `version`
  input.
- A malformed version answers the new failure reason `invalid-version` before
  any fetch, on every version-scoped tool and on `migrate_usage` (both `from`
  and `to` are checked before either is resolved; a blank one fails input
  validation instead, see below). `asset-missing` no longer
  covers it. A client that switches exhaustively on `reason` sees a new value.
  Leading zeros (`01.2.3`) and empty prerelease ids (`1.2.3-rc.`) are now
  rejected.
- When a selector matches several entries equally well, `get_api`,
  `get_slots`, `get_theme_tokens`, `get_config` and `get_story_example` answer
  `result: { ambiguous: true, candidates }` (each `{ name, kind, selector }`,
  sorted by name) instead of one entry. An exact class name still wins over
  every selector. A typed client that reads entry fields from `result` must
  narrow on `ambiguous` first.
- A blank `version` (`""` or `" "`) answers `invalid-version` on every
  version-scoped tool instead of the bundled snapshot. Omit `version` for the
  bundled release.
- A blank `migrate_usage` `from` or `to` and a blank `find_component` `query`
  (`""` or `" "`) fail input validation (`minLength: 1` after trimming, exit 2
  in the CLI) instead of being resolved or searched.

### Added

- Snapshots of `documentation.json` schema 7 (compodocx 0.16) load like
  schema 6, from the bundled snapshot and from a fetched release. A schema the
  package cannot read now lists every supported version (`reads 2, 6 and 7`).
- `get_error_code` returns a CNGX error code's title, lib, severity, production
  behaviour, messages and doc page from the bundled snapshot. It takes an optional
  `version`, resolved from the release's `error-codes.json` asset.
- A `migrate_usage` `signatureChanged` row of an input carries `changed`, the
  parts of its binding contract that moved (`type`, `required`,
  `binding kind`). Rows of the other categories have no `changed` field.
- `get_theme_tokens` answers the `kind` and `selector` of the resolved entry.
- A `migrate_usage` `renamed` row of a component or directive carries
  `inferred: true`: the pair was matched by lib and binding shape, not by name.

### Changed

- The bundled snapshot and the `error-codes.json` release asset link error
  codes to the docs of that release (`/cngx/v<version>/`), and the snapshot
  links examples to its examples build (`/cngx/examples/v<version>`). A
  prerelease keeps the links to `main`.
- The tarball ships the MIT license text (`LICENSE`).
- Released in lockstep with the cngx libraries through `publish:*`: one
  version for the libs, `@cngx/mcp` and `@cngx/cli`, published in the same run.
- `list_components` matches the `lib` filter case-insensitively (it was exact)
  and sorts by code point, not by locale; its description and `lib` input say so.
- `get_api` lists only public methods; private and protected ones are dropped.
- A version may carry a leading `v` or `V` (`v0.2.0`); it answers like `0.2.0`.
  The `version` input of `find_component`, `get_api`, `get_slots`,
  `get_theme_tokens`, `get_di_tokens` and `get_config`, and `migrate_usage`
  `from` and `to`, say so in their descriptions (eight input descriptions).
- `get_slots` splits a slot name that carries its description into the name and
  the description, and drops slots without a usable name.
- `migrate_usage` diffs inputs and outputs on their public name (the alias when
  one is set), so an alias change is a `renamed` row. An input's signature
  includes `required` and its signal kind. DI tokens are diffed on their token
  type. Every list is sorted by owner, then name.
- `migrate_usage` reports a component that became a directive (or back) as a
  `components` `signatureChanged` row `component -> directive`, not as a
  removal.
- A local temp-directory or write failure answers `asset-missing` with a
  message that names it, not `network`. A query that throws answers
  `asset-missing` with a message that starts with `internal:`.
- An `invalid-version` answer of `migrate_usage` names the argument:
  `from "1.2" is not a release version; ...`.
- The `category` of three folders follows their new docs pages:
  `CngxAsyncClick`, `CngxPending`, `CngxFailed` and `CngxSucceeded` answer
  `common/interactive/async-click` (was `common/interactive/action-status`),
  the listbox family `common/interactive/listbox` (was
  `common/interactive/keyboard`), and the select slot directives and
  `CngxSelectAnnouncer` `forms/select/shared` (was `forms/select`).

### Fixed

- A release fetched through `version` links its examples to the examples build
  of that release (`/cngx/examples/v<version>`), like the bundled snapshot; it
  linked them to `main`. A prerelease keeps the links to `main`.
- `cngx://llms-full` of a final release links its examples to the examples
  build of that release (`/cngx/examples/v<version>`), like `exampleUrls`; it
  linked them to `main`. A prerelease keeps the links to `main`.
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
- A compound selector (`cngx-checkbox, [cngxCheckbox]`) resolves by any of its
  parts, including the bare attribute name (`cngxCheckbox`).
- `""` is invalid input on every name tool instead of being queried.
- `migrate_usage` infers a rename only when exactly one removed and one added
  entry share the key, never for an entry without inputs and outputs and never
  for a slot with a blank description; such entries report as removed.
- `migrate_usage` skips a malformed slot instead of failing the whole diff.
- A fetched release snapshot with an unknown schema or a malformed shape
  answers `asset-missing` with
  `Fetched snapshot for v<version> could not be read: Malformed documentation.json: <detail>`.
  It used to advise regenerating the snapshot; neither that nor a reinstall
  repairs a release asset.

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
