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
  exit codes 0 (answered), 1 (not found or unresolved), 2 (usage error).
- Node 20 floor checked before anything else loads; a closed stdout pipe
  (`cngx list | head -1`) no longer crashes.
