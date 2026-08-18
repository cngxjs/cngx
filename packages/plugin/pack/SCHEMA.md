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

Pack v1 does not cover all stories. A story becomes a recipe when it demonstrates
one of:

- a Level-3 organism (one recipe per organism: the select family, treetable,
  stepper, tabs, dialog, and the other composed feature units), or
- a flagship atom that consumers reach for constantly (`CngxIcon`, `CngxButton`
  interactions, `CngxTag`, the form-field bridge).

Everything else - variant permutations, demo-chrome-only stories, internal
fixtures - stays out of pack v1. Breadth across the full story set is a later
milestone. The rule is checkable: a reviewer can point at any recipe and name
which clause admitted it.

## Provenance

`pack-manifest.json` records, per generated artifact, the source input and its
content hash at generation time. The drift-check recomputes those hashes and
fails when a shipped artifact falls behind its source.
