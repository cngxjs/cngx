<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Update

<aside class="cc-tldr">

Run `ng update @cngx/core`. Every `@cngx/*` package moves to the same release, and the migrations the target release ships run: each hand-written migration between the installed and the target release, plus the entry keyed to the target itself. Every release after 0.1.0-rc.8 carries that entry, so the install steps recorded in `.cngx/install.json` are re-checked on every update. The plan prints before anything changes and a summary follows, as with `ng add`.

</aside>

The `@cngx/*` packages release in lockstep: one version number for all eight.
Every package declares them as one `ng update` package group, named after
`@cngx/core`, which carries the migrations, so one command updates the set.

```bash
ng update @cngx/core
```

---

## The package group

Every `@cngx/*` package lists `@cngx/utils`, `@cngx/core`, `@cngx/common`,
`@cngx/interop`, `@cngx/forms`, `@cngx/data-display`, `@cngx/ui` and
`@cngx/themes` as its package group, and `@cngx/core` names the group. So
`ng update @cngx/forms` moves the same set as `ng update @cngx/core`: every
member the app depends on goes to the new release in one step, and the
cross-package peers stay in agreement. The migrations live in `@cngx/core`
and run whichever member you name.

---

## Migrations

`ng update` reads the migrations from the release it installs. They are the
hand-written migrations of every release with breaking changes, plus one
entry keyed to the target release itself: its own migration when it brings
one, otherwise a `refresh` entry that is added to the published package at
release time, renames nothing and only does the install re-runs. Every
release after 0.1.0-rc.8 carries that entry. The CLI runs the entries whose
version lies above the installed release and up to the target, compared
without the target's prerelease tag, in version order. A migration does
three things:

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

An update across several releases runs every hand-written migration in that
range and the target's entry. It runs no `refresh` entry of a release in
between: those ship only with their own release. Each entry prints its own
plan and summary headed by its release. The first one moves the manifest to
the target release; the ones after it find it in place, and their headline
says that this migration found nothing to change.

---

## Install re-runs from the manifest

When `.cngx/install.json` exists, every migration, a `refresh` included,
goes through every project it records, reads the answers of that record
(the preset, the theme, the language, the editors) and re-checks the steps
that depend on the release:

- The theme steps are checked once the cngx version moved, and reported.
- `.cngx/README.md`, which names the `@cngx/mcp` version, is regenerated once
  that version moved, once for the workspace, by the first record whose
  answers this release can read.
- Each record notes the new release.

A recorded project that is no longer in `angular.json` is named and its
record left as it is. A record whose answers this release cannot read is
named with its project and kept; `ng add @cngx/core --project <name>`
refreshes it. A manifest cngx cannot read is named too and left alone;
`ng add @cngx/core --project <name>` keeps it as a copy and starts a new
record.

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
  every breaking pull request brings its own key. `<version>` is the entry's
  `version`; `<slug>` is lowercase letters, digits and hyphens.
- The check reads only the `!` in the title. A breaking change without it is
  not caught, so mark every one.
- A change that cannot be migrated says so with a line
  `Migration: not migratable` in the pull request body, and the release notes
  describe the manual step.

A separate check makes sure each new key points at a real migration: an
exported factory, a spec with a case that runs it, and a before/after fixture
pair whose `after` differs from `before` (a `.gitkeep` alone does not
count). How to write one is described in
`projects/core/schematics/README.md`.
