# cngx plugin

A Claude Code plugin that grounds a consumer app's coding agent in cngx. It
auto-starts the `@cngx/mcp` server so the agent can query the cngx public API,
and points it at the published cngx documentation.

## Install

Add the cngx marketplace, then install the plugin:

```
/plugin marketplace add cngxjs/cngx
/plugin install cngx
```

## What it does

- Bundles a version-pinned MCP wiring (`.mcp.json`) that starts
  `@cngx/mcp@0.1.0-rc.0` via `npx`, exposing the cngx public-API surface as
  typed, queryable tools.
- Serves as the delivery vehicle for cngx agent grounding; it invents no new
  data, building only on the public MCP server and the published docs at
  <https://cngxjs.github.io/cngx>.

## Skills

The plugin ships auto-discovered skills that teach the agent how to work with
cngx and route it to the drift-free API sources (the MCP tools and the published
docs):

- **`cngx`** - the index: the three design principles and the grounding this
  plugin bundles.
- **`cngx-wire`** - build a screen or feature: discover the component, confirm
  its API, and compose it over configuring it.

## Notes

The bundled `.mcp.json` pins an explicit `@cngx/mcp` version rather than
floating `@latest`, so the agent grounds against a known release and the `npx`
cold-start is reproducible.
