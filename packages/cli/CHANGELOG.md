# @cngx/cli changelog

Hand-maintained, per package version. The root CHANGELOG.md tracks the cngx
library releases; this file tracks the CLI package. The cngx release an answer
grounds against is a property of the bundled snapshot, not this version.

## Unreleased

### Added

- Package scaffold with a guarded copy of the shared query core from
  `@cngx/mcp` and the bundled API snapshot.
- `cngx` subcommands generated from the shared command registry: `find`,
  `list`, `api`, `slots`, `theme`, `di`, `config`, `example`, `migrate`.
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
  `@cngx/*`; json `result` is always an array; a name the command has no
  entry for is skipped with one stderr line; a file with no such import
  exits 1) and `--compact` (markdown without descriptions).
- `cngx doctor` runs the `@cngx/doctor` wiring scan with the CLI exit
  contract: `--format json` prints doctor's findings array, exit 1 means an
  error finding, an unknown flag, a `<projectDir>` that is not a directory, a
  second `<projectDir>` or `--json` exits 2 before any scan, a throw exits 3;
  `--version` and `--help` print the CLI's version and the `cngx doctor` help.
