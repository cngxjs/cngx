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
- **`cngx-async`** - wire loading/error/success state: the async state machine,
  projecting a branch, and bridging transitions to toasts/alerts/banners.
- **`cngx-forms`** - wire a form: the Signal-Forms-first field pattern, the
  select-family decision tree, the Reactive-Forms adapter, and error surfaces.
- **`cngx-from-material`** - migrate an Angular Material screen: the `mat-*` to
  cngx symbol mapping and the idiom shifts the move requires.
- **`cngx-doctor`** - act on a doctor finding: read the machine finding contract
  and apply the fix it names.
- **`cngx-theme`** - theme a consumer app: import the theme bundle so directive
  styling renders, then set brand tokens via the `--cngx-*` custom properties.

## Doctor

The doctor is a deterministic project-wiring scan that catches the mistakes
ESLint's per-file scope cannot see - the ones that need a whole-project view. It
ships inside this plugin and runs automatically through the guard hook (below);
you rarely invoke it by hand.

To run it manually against a project, call the engine from the installed plugin
root:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cngx-doctor.mjs" [projectDir] [--json]
```

A standalone `@cngx/doctor` npm package with a `bin` entry - the form a consumer
CI job would depend on directly - is a later release; today the scan is delivered
as this plugin's guard hook.

It checks three project-level wirings and exits non-zero when any trips:

- **`toaster-without-withtoasts`** - a `CngxToaster` / `CngxAlerter` / `CngxBanner`
  (or the `*On` bridges) is used but the matching
  `provideFeedback(withToasts()/withAlerts()/withBanners())` root opt-in is
  missing, so the feedback surface has no host to render into.
- **`track-b-css-not-imported`** - a cngx directive whose visual theming lives in
  the Track-B stylesheet is imported, but no app style entry imports
  `@cngx/themes/cngx.css`, so it renders unstyled.
- **`floating-fallback-missing`** - `@floating-ui/dom` is installed but
  `provideFloatingFallback()` is never called, so browsers without CSS Anchor
  Positioning get no fallback.

Default output is human-readable; `--json` emits the machine contract (an array
of `{ id, message, fixHint, severity, file? }` findings) that the guard hook and
future tooling read. Exit code is `0` when clean, non-zero when findings exist.
Each finding mirrors the `@cngx/eslint-plugin` metadata shape, so a doctor
finding is explainable identically to a lint finding.

## Guard hook

A `PostToolUse` hook runs the doctor automatically after the agent edits a
`@cngx/*`-importing `.ts`/`.html` file. It gates cheaply first - it stays silent
for any other tool, file type, or a file that imports no `@cngx/*` symbol,
before any scan - then runs the same engine over a per-project cached snapshot
(walked once, updated per changed file thereafter) and surfaces any finding as
feedback the agent can act on. Clean edits produce no output.

## Notes

The bundled `.mcp.json` pins an explicit `@cngx/mcp` version rather than
floating `@latest`, so the agent grounds against a known release and the `npx`
cold-start is reproducible.
