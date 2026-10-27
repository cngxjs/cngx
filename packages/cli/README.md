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

## License

MIT
