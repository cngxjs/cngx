# Pack schema

The pack ships two kinds of reference data the agent reads alongside the cngx MCP
tools: **recipes** (how to compose cngx symbols) and a generated **theming-token**
reference. This document is the human companion to `recipe.schema.json`, the
machine-readable contract each recipe validates against.

## Recipe fields

Every `pack/recipes/*.md` carries YAML front matter with these fields. The
required set is enforced by `recipe.schema.json`; `pack-schema.spec.mjs` checks
this prose and the schema stay in sync.

|Field|Required|Meaning|
|-|-|-|
|`title`|yes|Short imperative name of what the recipe wires.|
|`whenToUse`|yes|The consumer situation this recipe answers.|
|`symbols`|yes|The `@cngx/*` exports the recipe composes (array of strings).|
|`wiring`|yes|The how - the composition steps that connect the symbols.|
|`a11y`|no|Accessibility notes specific to this composition.|
|`theming`|no|Which `--cngx-*` tokens matter here.|

## Curation criterion

Pack v1 is async-state-machine-first. A demo folder yields one recipe when at
least one of its examples exercises the cngx async state machine - its artifact
references one of `AsyncStatus`, `CngxAsyncState`, `createAsyncState`,
`createManualState`, `injectAsyncState`, `resolveAsyncView`, `buildAsyncStateView`,
`CngxAsyncContainer`, `CngxAsyncClick`, `CngxAsync`, or the `CngxAlertOn` /
`CngxToastOn` / `CngxBannerOn` transition bridges. That folder's async example is
the representative: a `basic`/`happy-path` slug wins over an `async`/`state` slug,
which wins over the shortest title.

The async wiring - loading, pending, refreshing, success, error, commit - is the
hardest surface to get right and the most valuable to teach, so it anchors pack
v1. Static atoms, variant permutations, and demo-chrome-only stories stay out
until a later milestone. The rule is checkable: grep any recipe's source story
for the async surface above.

## Provenance

`pack-manifest.json` records, per generated artifact, the source input and its
content hash at generation time. The drift-check recomputes those hashes and
fails when a shipped artifact falls behind its source.
