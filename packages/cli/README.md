# @cngx/cli

The cngx (`@cngx/*`) public API on the command line. `cngx` answers the same
queries as the `@cngx/mcp` server (API of a component,
slots, theme tokens, DI tokens, config cascade, examples, release deltas) for
coding agents and CI jobs that do not speak MCP.

Both packages share one query core: the command definitions live in
`@cngx/mcp`, and this package carries a byte copy of them, guarded in CI. The
CLI does not depend on the MCP SDK.

Answers come from a `documentation.json` snapshot bundled into the package at
build time, so the CLI runs with no cngx repository present. Inside a project
that uses another cngx release, the commands that take `--cngx-version` answer
for that release instead (see Which release answers). It is read-only: it never
mutates any source.

## Usage

Inside a project that has `@cngx/cli` installed:

```bash
npx cngx <command> [args]
```

Outside a project, run the scoped package:

```bash
npx @cngx/cli <command> [args]
```

Plain `npx cngx` outside a project does not work: npx then looks for an
unscoped `cngx` package, which does not exist.

Requires Node 20 or newer.

## Commands

Each command is generated from the same definition as its `@cngx/mcp` tool.
`cngx <command> --help` prints its arguments.

|Command|MCP tool|Answers|
|-|-|-|
|`cngx find <query>`|`find_component`|Components, directives and services whose name, selector or category matches the fragment.|
|`cngx list [--lib <lib>] [--kind <kind>]`|`list_components`|The full catalog, sorted by name, optionally filtered by lib and kind (`component`, `directive`, `injectable`).|
|`cngx api <name>`|`get_api`|Inputs, outputs, host bindings, methods and description of one component, directive or service.|
|`cngx slots <name>`|`get_slots`|The template slots a component projects.|
|`cngx theme <name>`|`get_theme_tokens`|The CSS custom properties a component exposes, with its theme overview.|
|`cngx di [<query>]`|`get_di_tokens`|The DI tokens, optionally filtered by a name fragment.|
|`cngx config <name>`|`get_config`|A configuration cascade: config token, providers, `with*` features and resolution order.|
|`cngx example <name>`|`get_story_example`|Runnable example links for a component.|
|`cngx migrate <from> [--to <version>]`|`migrate_usage`|Removed, renamed and signature-changed API between two releases. `--to` defaults to the bundled release.|
|`cngx doctor [<projectDir>]`|-|The project-wiring scan of `@cngx/doctor`, the same as `npx cngx-doctor`. `--format json` prints doctor's findings array. Exit 1 means at least one error-severity finding. A `<projectDir>` that is not a directory, a second `<projectDir>`, `cngx-doctor`'s own json switch (use `--format json`), an unknown flag, `--cngx-version` or `--offline` is a usage error before any scan. `--version` and `--help` are the CLI's, as for every other command.|

## Flags

|Flag|Meaning|
|-|-|
|`--format md\|json`|Output format. `md` (default) is markdown for people and agents; `json` is `{ "cngxVersion": "<version>", "result": <answer> }`, and a failure prints a failure document (see Failures). It has no short form.|
|`--cngx-version <version>`|Answer against this cngx release (`find`, `api`, `slots`, `theme`, `di`, `config`); a leading `v` or `V` is accepted. Without it these commands answer for the release installed in the project (see Which release answers). The snapshot of a non-bundled release is fetched through `gh`, or over HTTPS when `gh` is missing or fails, and cached on disk. Other commands reject it.|
|`--from <file>`|Also answer for every name the file imports from `@cngx/*` (`api`, `slots`, `theme`, `config`, `example`): named imports, `import type` and `as` aliases, LF or CRLF. An unreadable file is a usage error; a file with no such import exits 1, also beside positional names, and under `--format json` prints `{ "cngxVersion": null, "result": [] }`.|
|`--compact`|Shorter markdown (`api`, `slots`, `theme`, `config`, `example`): names and types without descriptions, no resolution-priority list, no repo-internal source references. JSON is unchanged.|
|`--offline`|Never fetch (`find`, `api`, `slots`, `theme`, `di`, `config`): answer from the disk cache, else the bundled snapshot. An explicit `--cngx-version` that is not cached fails with exit 1 instead of answering for another release. Other commands reject it.|
|`--version`, `-v`|Print the `@cngx/cli` version.|
|`--help`, `-h`|Print the command list, or a command's help after the command name.|

## Which release answers

`find`, `api`, `slots`, `theme`, `di` and `config` answer for, in this order:

1. the release given with `--cngx-version`;
2. the `@cngx/core` version installed in the current project, resolved the way
   Node resolves it from the working directory (npm, pnpm, a hoisted workspace
   root, the nearest `node_modules` first). Without `@cngx/core`, the first of
   `common`, `forms`, `ui`, `data-display`, `interop`, `utils`, `themes` wins;
3. with nothing installed, an exact version declared in the nearest
   `package.json` (`0.2.0`, `=0.2.0`, `v0.2.0`, `npm:@cngx/core@0.2.0`). A range
   or another specifier (`^0.2.0`, `workspace:*`, `catalog:`, a git or file URL)
   does not pin;
4. the bundled snapshot.

stderr says which: a detected release other than the bundled one, a range that
did not pin, installed packages at mixed versions, or no `@cngx` package at all.
Under Yarn PnP run `yarn cngx`; plain `npx` cannot see a PnP install. When a
detected release cannot be fetched or read, the answer comes from the bundled
snapshot with exit 0 and one stderr line naming both releases; an explicit
`--cngx-version` never falls back. `list`, `example` and `migrate` always answer
from the bundled snapshot (`migrate` takes its releases as arguments).

A fetched release snapshot is cached on disk and never fetched again: in
`$CNGX_CACHE_DIR`, else `$XDG_CACHE_HOME/cngx`, else `~/Library/Caches/cngx`
(macOS), `%LOCALAPPDATA%\cngx\Cache` (Windows) or `~/.cache/cngx`. The cache
keeps the 16 most recently read releases. An unreadable entry is removed and
fetched again; a cache directory that cannot be written answers without caching
and says so on stderr. Without a network, a detected release costs one fetch
timeout per run before the fallback; pass `--offline` to skip it.

`api`, `slots`, `theme`, `config` and `example` take several names:
`cngx api CngxSelect CngxChip`. Repeated names answer once. Markdown prints one
block per name under one `> cngx <version>` line; JSON prints
`{ "cngxVersion": "<version>", "result": [<answer per name>] }`, with `null` for a
name that matched nothing. When a name is not found the others still print,
stderr lists the missing ones and the run exits 1. A single name keeps the
single-answer shapes.

Every answer names the cngx release it came from: the first markdown line is
`> cngx <version>`, the JSON carries `cngxVersion`.

A repeated flag takes its last value: `--format md --format json` prints json.

Output is plain text, never coloured, identical on a terminal and in a pipe.
stdout carries the answer only; diagnostics go to stderr.

## Failures

Every failure except a usage error writes one line to stderr, never a stack trace:

```text
cngx <command>: <reason>: <message>
```

A usage error (exit 2) writes `cngx: <message>` plus the command hint instead.

|Reason|Meaning|
|-|-|
|`asset-missing`|The release or its `documentation.json` asset does not exist. Also covers a snapshot that cannot be read or has a schema this CLI does not know, a local temp-directory or write failure (the message names it), and a query that threw (its message starts with `internal:`).|
|`network`|The download failed for a network reason.|
|`invalid-version`|A `migrate` version is not a release version (`1.2`, `01.2.3`, `1.2.3-rc.`). Checked before any fetch and reported as a usage error: exit 2, `cngx: <message>` plus the usage hint on stderr, no json document.|

Under `--format json` a resolve or internal failure also prints one document to stdout, so `jq`
reads every run the same way:

```json
{ "cngxVersion": null, "result": null, "error": { "reason": "asset-missing", "message": "..." } }
```

A query that finds nothing is not a failure: it prints the empty answer with no
`error` and exits 1. The empty answer depends on the command:

|Commands|Empty `result`|
|-|-|
|`find`, `list`, `di`|`[]`|
|`api`, `slots`, `theme`, `config`, `example`|`null`|
|`api`, `slots`, `theme`, `config`, `example`, when a selector matches several entries|`{ "ambiguous": true, "candidates": [{ "name", "kind", "selector" }] }`|

An ambiguous selector names every candidate, sorted by name. Ask again with a
candidate's class name, which always resolves to that entry; a full selector does
not always. `list` exits 1 on an empty result too, for example `--lib` naming no
lib. Over MCP the same empty list is the answer.

An internal error (exit 3) prints `cngx: internal error: <message>` (or
`cngx <command>: internal error: <message>` once a command ran) and, under
`--format json`, the same document with `"reason": "internal"`. A bundled
snapshot that cannot be loaded is an internal error.

Releases are fetched only for tagged versions such as `0.2.0` or `0.2.0-rc.1`,
never for a branch or commit. `gh` is tried first, then a plain HTTPS download;
each path times out after 15 seconds, so a failing request can take up to 30
seconds. The HTTPS path does not read `HTTPS_PROXY`; behind a proxy, use an
authenticated `gh`.

## Exit codes

|Code|Meaning|
|-|-|
|`0`|Answered, including the fallback to the bundled snapshot when a detected release cannot be resolved.|
|`1`|`doctor`: at least one error-severity finding. Every other command: the query ran but found nothing (an empty `list` included), the requested release snapshot could not be resolved (under `--offline`: is not cached), or a query threw while answering (`asset-missing`, message `internal: ...`).|
|`2`|Usage error: no command (help goes to stderr), an unknown command or flag, invalid input, an empty or malformed `--cngx-version`, a malformed `migrate` version (`<from>` or `--to`), `--cngx-version` or `--offline` on a command that has no version, a `doctor` `<projectDir>` that is not a directory, or a Node below 20. Usage errors and the Node floor print no json document, even under `--format json`; stdout stays empty.|
|`3`|Internal error: the bundled snapshot could not be loaded, a command, its rendering or the start-up threw, or writing stdout failed. A query that throws while answering a snapshot (every command but `list`) is not one of them: it answers `asset-missing` with an `internal:` message and exits 1 (see Failures). One `internal error` line on stderr, no stack; stdout holds the failure document under `--format json` and nothing under `md`. A failed stderr never changes the exit code: the run exits with the code its answer earned. A closed stdout pipe (EPIPE, as in `cngx list \| head -1`) is not a failure either: the run ends quietly with the code its answer earned.|

## License

MIT
