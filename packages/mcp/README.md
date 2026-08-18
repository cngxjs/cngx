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
the client-config snippet shipped alongside this package).

## Tools

The five read-only query tools (`find_component`, `get_api`, `get_slots`,
`get_tokens`, `get_story_example`) land in a follow-up release. This build starts
the server and reports, at connect, which cngx release the bundled snapshot
grounds against.

## Provenance

Each answer grounds against one pinned cngx release. The server reports the cngx
version and snapshot timestamp in its connect-time instructions; confirm the
consuming app runs a matching release before relying on an answer.

## License

MIT
