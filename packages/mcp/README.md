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
|`find_component`|`{ query: string }`|Components and directives whose name, selector, or category matches the fragment: name, kind, selector, category, file.|
|`get_api`|`{ name: string }`|One component/directive's API: inputs, outputs, signal flag, host bindings, public methods, description. Resolves by class name or selector.|
|`get_slots`|`{ name: string }`|The component's projected template slots, each a slot directive selector name plus its one-line doc.|
|`get_theme_tokens`|`{ name: string }`|A component's theming tokens (the CSS custom properties it exposes) and theme overview, by class name or selector.|
|`get_di_tokens`|`{ query?: string }`|The top-level DI injection tokens, optionally filtered by a name fragment. Omit the argument for the full list.|
|`get_story_example`|`{ name: string }`|The component's runnable example URLs (public documentation links) and a StackBlitz URL when one exists. Playground entries are labelled source references, not openable links.|

Every tool returns `null` (or an empty list) when a name resolves to nothing, so
an agent can tell "no such symbol" from "symbol with no data".

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
