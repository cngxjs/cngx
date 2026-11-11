# @cngx/cli changelog

Hand-maintained, per package version. The root CHANGELOG.md tracks the cngx
library releases; this file tracks the CLI package. It is released in lockstep
with the cngx libraries: `@cngx/cli` X.Y.Z bundles the X.Y.Z snapshot, and
`--cngx-version` or the installed release still grounds an answer against
another release.

## Unreleased

### Added

- Reads `documentation.json` schema 7 (compodocx 0.16) next to schema 2 and 6,
  from the bundled snapshot and from a fetched release.
- Package scaffold with a guarded copy of the shared query core from
  `@cngx/mcp` and the bundled API snapshot.
- `cngx` subcommands generated from the shared command registry: `find`,
  `list`, `api`, `slots`, `theme`, `di`, `config`, `example`, `migrate`,
  `explain`.
- `cngx explain <code>` prints the doc entry of a CNGX error code: its title,
  lib, severity, production behaviour, messages and docs URL. Accepts `CNGX0001`,
  `cngx0001`, `0001` or a pasted console line; exits 1 for an unknown code, listing
  the nearest codes of its lib. Takes `--cngx-version` and `--offline`; another
  release answers from its `error-codes.json` asset.
- `--format md|json`, `--cngx-version`, `--version` / `-v`, `--help` / `-h`;
  exit codes 0 (answered), 1 (not found or unresolved), 2 (usage error),
  3 (internal error: a snapshot that cannot load, a throw, a failed write).
- Node 20 floor checked before anything else loads; a closed stdout pipe
  (`cngx list | head -1`) no longer crashes.
- Under `--format json` every run except a usage error prints exactly one
  document: a resolve or internal failure prints
  `{ "cngxVersion": null, "result": null, "error": { "reason", "message" } }`
  (reason `internal` for exit 3) next to its stderr line; a not-found answer
  keeps `result` empty with no `error`.
- Markdown output keeps a numeric character entity past U+10FFFF or naming a
  lone surrogate as written instead of failing the render.
- `find`, `api`, `slots`, `theme`, `di` and `config` answer for the cngx
  release installed in the project when `--cngx-version` is absent: the
  installed `@cngx/core` (npm, pnpm, hoisted workspaces), else an exact
  version declared in the nearest `package.json`, else the bundled snapshot.
  stderr names a detected release other than the bundled one and why a
  declaration did not pin. A detected release that cannot be resolved falls
  back to the bundled snapshot with exit 0 and one stderr line.
- Fetched release snapshots are cached on disk (`CNGX_CACHE_DIR`, else
  `XDG_CACHE_HOME/cngx`, else the platform cache directory; a relative
  variable is ignored), 16 releases at most; a second run for the same release does not fetch.
- `--offline` on the same commands: answer from the disk cache or the bundled
  snapshot, never fetch; an uncached explicit `--cngx-version` exits 1.
- `api`, `slots`, `theme`, `config` and `example` take several names (md: one
  block per name; json: a `result` array, `null` per missing name; exit 1 when
  any name is missing), `--from <file>` (the names a file imports from
  `@cngx/*`; json `result` is always an array; a token, a function or a
  type-only import is skipped with one stderr line; a file with no such import
  exits 1) and `--compact` (markdown without descriptions).
- `cngx doctor` runs the `@cngx/doctor` wiring scan with the CLI exit
  contract: `--format json` prints doctor's findings array, exit 1 means an
  error finding, an unknown flag, a `<projectDir>` that is not a directory, a
  second `<projectDir>` or `--json` exits 2 before any scan, a throw exits 3;
  `--version` and `--help` print the CLI's version and the `cngx doctor` help.

### Changed

- The bundled snapshot and the `error-codes.json` release asset link error
  codes to the docs of that release (`/cngx/v<version>/`), and the snapshot
  links examples to its examples build (`/cngx/examples/v<version>`). A
  prerelease keeps the links to `main`.
- Released in lockstep with the cngx libraries through `publish:*`: one
  version for the libs, `@cngx/mcp` and `@cngx/cli`, published in the same run.
- `cngx doctor` requires `@cngx/doctor` 0.3 (missing-directory and
  commented-import fixes).
- A positional argument is taken only by position: `--name` and `migrate --from`
  are not flags and exit 2 as an unknown option.
- Default markdown prints every description in full. `--compact` drops the
  description column for `api`, `slots` and `theme`; `di` and `migrate` have no
  short view.
- The tarball ships the MIT license text (`LICENSE`).
- `cngx doctor` exits 2 for a `<projectDir>` it cannot read (a locked directory,
  or a path component that denies access) instead of a clean `[]` or an internal
  error.

### Fixed

- A fetched release (`--cngx-version` or the installed release) links its
  examples to the examples build of that release (`/cngx/examples/v<version>`),
  like the bundled snapshot; it linked them to `main`. A prerelease keeps the
  links to `main`.
