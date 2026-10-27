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
|`cngx migrate <from> [--to <version>]`|`migrate_usage`|Removed, renamed and signature-changed API between two releases.|

## Flags

|Flag|Meaning|
|-|-|
|`--format md\|json`|Output format. `md` (default) is markdown for people and agents; `json` is the query result as JSON.|
|`--cngx-version <version>`|Answer against another cngx release (`find`, `api`, `slots`, `theme`, `di`, `config`). The snapshot of that release is fetched through `gh`, or over HTTPS when `gh` is missing or fails. Other commands reject it.|
|`--version`, `-v`|Print the `@cngx/cli` version.|
|`--help`, `-h`|Print the command list, or a command's help after the command name.|

Output is plain text, never coloured, identical on a terminal and in a pipe.
stdout carries the answer only; diagnostics go to stderr.

## Exit codes

|Code|Meaning|
|-|-|
|`0`|Answered.|
|`1`|The query ran but found nothing, or the requested release snapshot could not be resolved.|
|`2`|Usage error: unknown command or flag, invalid input, or `--cngx-version` on a command that has no version.|

## License

MIT
