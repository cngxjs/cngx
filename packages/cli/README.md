# @cngx/cli

The cngx (`@cngx/*`) public API on the command line. `cngx` answers the same
queries as the `@cngx/mcp` server (API of a component,
slots, theme tokens, DI tokens, config cascade, examples, release deltas) for
coding agents and CI jobs that do not speak MCP.

Both packages share one query core: the command definitions live in
`@cngx/mcp`, and this package carries a byte copy of them, guarded in CI. The
CLI does not depend on the MCP SDK.

Answers come from a `documentation.json` snapshot bundled into the package at
build time, so the CLI runs offline with no cngx repository present. It is
read-only: it never mutates any source.

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

## Flags

|Flag|Meaning|
|-|-|
|`--format md\|json`|Output format. `md` (default) is markdown for people and agents; `json` is `{ "cngxVersion": "<version>", "result": <answer> }`, and a failure prints a failure document (see Failures).|
|`--cngx-version <version>`|Answer against another cngx release (`find`, `api`, `slots`, `theme`, `di`, `config`). The snapshot of that release is fetched through `gh`, or over HTTPS when `gh` is missing or fails. Other commands reject it.|
|`--version`, `-v`|Print the `@cngx/cli` version.|
|`--help`, `-h`|Print the command list, or a command's help after the command name.|

Every answer names the cngx release it came from: the first markdown line is
`> cngx <version>`, the JSON carries `cngxVersion`.

A repeated flag takes its last value: `--format md --format json` prints json.

Output is plain text, never coloured, identical on a terminal and in a pipe.
stdout carries the answer only; diagnostics go to stderr.

## Failures

Every failure writes one line to stderr, never a stack trace:

```text
cngx <command>: <reason>: <message>
```

|Reason|Meaning|
|-|-|
|`asset-missing`|The release or its `documentation.json` asset does not exist. Also covers a version that is not a release, a snapshot that cannot be read or has a schema this CLI does not know, and a query that threw (its message starts with `internal:`).|
|`network`|The download failed for a network reason.|

Under `--format json` a failure also prints one document to stdout, so `jq`
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

An ambiguous selector names every candidate, sorted by name; ask again with a
class name or a candidate's full selector. `list` exits 1 on an empty result too, for example `--lib` naming no lib. Over
MCP the same empty list is the answer.

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
|`0`|Answered.|
|`1`|The query ran but found nothing (an empty `list` included), or the requested release snapshot could not be resolved.|
|`2`|Usage error: no command (help goes to stderr), an unknown command or flag, invalid input, an empty or malformed `--cngx-version`, `--cngx-version` on a command that has no version, or a Node below 20.|
|`3`|Internal error: the bundled snapshot could not be loaded, a command, its rendering or the start-up threw, or writing the output failed. One `internal error` line on stderr, no stack; stdout holds the failure document under `--format json` and nothing under `md`.|

## License

MIT
