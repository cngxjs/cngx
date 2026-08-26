# @cngx/mcp

A stdio [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes the cngx (`@cngx/*`) public API as typed, queryable tools for LLM coding
agents. It answers `get_api CngxSelect` with a few hundred bytes of typed API
instead of the multi-megabyte `llms-full.txt` dump.

The server queries a `documentation.json` snapshot bundled into the package at
build time, so `npx @cngx/mcp` runs standalone with no cngx repository present.
It is read-only: it never mutates any source.

## Usage

```bash
npx @cngx/mcp
```

The server speaks MCP over stdio. Register it with any MCP-capable client (see
Client setup below), then call the tools.

## Tools

|Tool|Input|Returns|
|-|-|-|
|`find_component`|`{ query: string, version?: string }`|Components and directives whose name, selector, or category matches the fragment: name, kind, selector, category, file.|
|`list_components`|`{ lib?: string, kind?: 'component' \| 'directive' }`|The deterministic catalog: every component and directive as `{ name, kind, selector, category, lib }`, sorted by name. Optionally filtered by lib and/or kind. Omit both for the full surface; an unmatched filter returns an empty list.|
|`get_api`|`{ name: string, version?: string }`|One component/directive's API: inputs, outputs, signal flag, host bindings, public methods, description. Resolves by class name or selector.|
|`get_slots`|`{ name: string, version?: string }`|The component's projected template slots, each a slot directive selector name plus its one-line doc.|
|`get_theme_tokens`|`{ name: string, version?: string }`|A component's theming tokens (the CSS custom properties it exposes) and theme overview, by class name or selector.|
|`get_di_tokens`|`{ query?: string, version?: string }`|The top-level DI injection tokens, optionally filtered by a name fragment. Omit the argument for the full list.|
|`get_config`|`{ name: string }`|A configuration cascade by config token name (`CNGX_SELECT_CONFIG`), stem (`select`), or best-effort component name (`CngxCombobox`): the config token, its co-located provider functions, the `with*` feature functions, and the resolution-priority ordering. Returns null when the name maps to no config token.|
|`get_story_example`|`{ name: string }`|The component's runnable example URLs (public documentation links) and a StackBlitz URL when one exists. Playground entries are labelled source references, not openable links.|
|`migrate_usage`|`{ from: string, to?: string }`|A structured API delta between two cngx releases: removed / renamed / signature-changed components, inputs, outputs, slots, and DI tokens. `to` defaults to the bundled snapshot version.|

Every read-only tool returns `null` (or an empty list) when a name resolves to
nothing, so an agent can tell "no such symbol" from "symbol with no data".

Every tool is read-only, and read-only tools answer offline against the bundled
snapshot by default. The network is reached only when a caller asks for another
release: `migrate_usage` always spans two versions, and `find_component`,
`get_api`, `get_slots`, `get_theme_tokens`, and `get_di_tokens` reach it only when
their optional `version` differs from the bundled one. Every such fetch is
fail-safe - a missing `gh`, no network, or an absent asset returns a typed error
result (`{ ok: false, reason }`, one of `gh-missing` / `network` / `asset-missing`),
never a crash.

### Version-scoped queries

`find_component`, `get_api`, `get_slots`, `get_theme_tokens`, and `get_di_tokens`
take an optional `version` (e.g. `"0.2.0"`). Omitted, or equal to the bundled
snapshot version, they answer offline against the bundled snapshot exactly as
before. Given a different version they resolve that release's `documentation.json`
from the GitHub Release assets via `gh` (fetched once, then cached in memory for
the session), query it, and wrap the answer as
`{ groundedVersion, result }` so the caller always knows which release the answer
grounds against. A fetch that fails returns the same typed
`{ ok: false, reason }` shape `migrate_usage` uses - the query never throws. Only
tagged releases (`v<version>`) are fetchable; branches and SHAs are not.

## Resources

The same offline snapshot is also served as browseable MCP resources, so a client
can list and attach cngx documents without an imperative tool call.

|URI|Returns|
|-|-|
|`cngx://catalog`|Every component and directive as `{ name, kind, selector, category, lib }`, sorted by name. The browse view of `list_components`.|
|`cngx://tokens`|The top-level DI injection tokens as `{ name, file, description }`.|
|`cngx://provenance`|Snapshot meta: cngx version, `generatedAt`, `schemaVersion`, compodocx version.|
|`cngx://api/{name}`|One component/directive's API surface by class name or selector. The `{name}` variable autocompletes against the catalog; an unknown name yields an empty resource.|

Every resource returns `application/json`.

## Prompts

Server-provided message templates a client exposes as slash-commands. Each is a
single framing message that names the tools to ground against; prompts carry no
data and never write code.

|Prompt|Arguments|Frames|
|-|-|-|
|`wire_component`|`{ component: string }`|Wiring one component - grounds via `get_api`, `get_slots`, `get_config`.|
|`theme_component`|`{ component: string }`|Theming one component through its exposed custom properties - grounds via `get_theme_tokens`, `get_config`.|
|`migrate_cngx`|`{ from: string, to?: string }`|A cross-version migration - grounds via `migrate_usage` then per-symbol `get_api`. `to` defaults to the bundled snapshot version.|

## Client setup

The package ships the same snippet as `mcp.json`.

### Claude Code

```bash
claude mcp add cngx -- npx -y @cngx/mcp
```

Or add it to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "cngx": {
      "command": "npx",
      "args": ["-y", "@cngx/mcp"]
    }
  }
}
```

### Claude Desktop

Add the same block to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cngx": {
      "command": "npx",
      "args": ["-y", "@cngx/mcp"]
    }
  }
}
```

## Provenance

Each answer grounds against one pinned cngx release. The server reports the cngx
version and snapshot timestamp in its connect-time instructions; confirm the
consuming app runs a matching release before relying on an answer.

## License

MIT
