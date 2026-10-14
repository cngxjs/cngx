<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Update

<aside class="cc-tldr">

Run `ng update @cngx/core`. Every `@cngx/*` package moves to the same release, the migration of each release in between runs, and since every release carries one, the install steps recorded in `.cngx/install.json` are re-checked on every update. The plan prints before anything changes and a summary follows, as with `ng add`.

</aside>

The `@cngx/*` packages release in lockstep: one version number for all eight.
`@cngx/core` declares them as one `ng update` package group and carries the
migrations, so one command updates the set.

```bash
ng update @cngx/core
```

---

## The package group

`@cngx/core` lists `@cngx/utils`, `@cngx/core`, `@cngx/common`,
`@cngx/interop`, `@cngx/forms`, `@cngx/data-display`, `@cngx/ui` and
`@cngx/themes` as its package group. `ng update` moves every member the app
depends on to the new release in one step, so the cross-package peers stay
in agreement. Always update through `@cngx/core`: the group and the
migrations live there.

Preview the update without writing files:

```bash
ng update @cngx/core --dry-run
```

---

## Migrations

Every release carries a migration keyed to its version. `ng update` runs
the entries whose version lies above the installed release and up to the
target release, in order. A release with breaking changes brings its own
migration; every other release gets a `refresh` entry, added to the
published package at release time, that renames nothing and only does the
install re-runs. A migration does three things:

- **Renames.** Classes, selectors, inputs, outputs, `exportAs` names, DI
  tokens and import paths that a release renamed are rewritten in your
  TypeScript and templates. A spot the rename cannot reach safely is named in
  the summary instead of guessed.
- **Codemods.** A change a rename table cannot express (a moved argument, a
  split provider) is a code transform that plans its own edits.
- **Install re-runs.** See below.

Every change is listed before it is applied, the same way `ng add` lists its
plan. The summary after it names the files changed, the notes (what a step
left to you), how many steps were already in place, and the next steps.

The first migration, `0.1.0`, renames nothing: the breaking changes of the
release candidates before it are covered by the written migration guides.
Like a `refresh` entry, it re-checks the recorded install steps and records
the release in the manifest.

An update across several releases runs each entry once. The first one moves
the manifest to the target release; the ones after it find it in place and
plan nothing for it.

---

## Install re-runs from the manifest

When `.cngx/install.json` exists, every migration, a `refresh` included,
reads the answers it records (the preset, the theme, the language, the
editors) and re-checks the steps that depend on the release:

- The theme steps are checked once the cngx version moved, and reported.
- `.cngx/README.md`, which names the `@cngx/mcp` version, is regenerated once
  that version moved.
- The manifest records the new release.

A re-run never brings back a file you deleted; it names it. A README cngx did
not write stays as it is. An answer recorded by an older release that the
current one no longer understands makes the run skip the re-checks and say
so; run `ng add` again to record the current answers.

Without a manifest (an app installed by hand), the migrations still apply
their renames and codemods; there is just nothing to re-check.

The `@cngx/mcp` pin in the editor MCP configs is not moved by `ng update`. A
later `ng add` names a pin that differs from the current release; update the
entry by hand.

Running `ng update @cngx/core` again on the release the app already runs
selects no entry: the CLI only runs entries above the installed release.

Upgrade an installed app with `ng update @cngx/core`, never with
`ng add @cngx/<package>@<newer>`. `ng add` installs one package at the new
release while the rest of the group stays on the old one, and npm refuses
the mismatched cross-package peers with `ERESOLVE`.

---

## Breaking changes and contributors

The `ng update` path holds only if every breaking change brings its
migration. The cngx repository enforces that on pull requests:

- A pull request whose Conventional Commit title marks a breaking change
  with `!` (for example `feat(forms/select)!: rename the trigger slot`) must
  add a new key to `projects/core/schematics/migrations/migrations.json`.
- A key is one migration: `migration-v<version>` for the first breaking
  change of a release, `migration-v<version>-<slug>` for each further one, so
  every breaking pull request brings its own key.
- A change that cannot be migrated says so with a line
  `Migration: not migratable` in the pull request body, and the release notes
  describe the manual step.

A separate check makes sure each new key points at a real migration with a
spec and a before/after fixture pair. How to write one is described in
`projects/core/schematics/README.md`.
