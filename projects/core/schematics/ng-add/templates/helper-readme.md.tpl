# cngx in this project

`ng add` set up cngx {{version}} here and wrote this file. A later `ng add`
run regenerates it, so edits made here are not kept.

## Installed

{{packages}}

## MCP server

Your coding agent asks the `cngx` MCP server (`@cngx/mcp@{{mcpVersion}}`)
about components, inputs, slots, theme tokens and DI tokens instead of
guessing them. It runs locally through `npx`, answers offline from the cngx
API snapshot it bundles, and needs no account or key.

Configured in:

{{configs}}

A marked cngx block in {{instructions}} tells the agent to ask the server.

### Tools

<!-- prettier-ignore-start -->
|Tool|What it answers|Try asking|
|-|-|-|
{{tools}}
<!-- prettier-ignore-end -->

### Resources

<!-- prettier-ignore-start -->
|URI|Content|
|-|-|
{{resources}}
<!-- prettier-ignore-end -->

### Prompts

<!-- prettier-ignore-start -->
|Prompt|Use|
|-|-|
{{prompts}}
<!-- prettier-ignore-end -->

## Check that it runs

{{verify}}

## Turn it off

Delete the `cngx` entry from each config file listed above, and the block
between `<!-- cngx:agents -->` and `<!-- /cngx:agents -->` in {{instructions}}.
Nothing else in the project depends on the server.

A later `ng add` remembers the removal through `.cngx/install.json` and
leaves both out, the `full` preset included. To bring them back, run
`ng add` with the editor named, for example `--ai-tools claude`.

{{plugin}}## Clients outside this project

`ng add` writes only project files. To use the server in Claude Desktop or
in every Cursor project, add the same entry to that client's own config by
hand (`claude_desktop_config.json`, `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "cngx": { "command": "npx", "args": ["-y", "@cngx/mcp@{{mcpVersion}}"] }
  }
}
```

Docs: https://cngxjs.github.io/cngx/
