# Contributing to CNGX

Thank you for your interest in contributing to the CNGX UI Component Libraries!

## Development Setup

### Prerequisites

- Node.js 20 (CI runs on Node 20)
- npm

### Installation

```bash
npm install
```

## Project Structure

The workspace is an Angular CLI monorepo (no nx) containing six published libraries and a demo application:

|Path|Package|Description|
|-|-|-|
|`projects/utils`|`@cngx/utils`|Framework-agnostic utilities, tree helpers, RxJS interop (no Angular dependency)|
|`projects/core`|`@cngx/core`|DI tokens plus signal, async-state, and selection primitives|
|`projects/common`|`@cngx/common`|Atoms and molecules: a11y, interactive controls, display, popover, chart, stepper, tabs|
|`projects/forms`|`@cngx/forms`|Form controls, validators, field bridges, and the select family|
|`projects/data-display`|`@cngx/data-display`|Data-display organisms (CDK TreeTable)|
|`projects/ui`|`@cngx/ui`|Organism layer: layout, overlay, stepper, tabs, feedback, empty-state, plus opt-in Material bridges|
|`examples`|-|Examples app - one story per rendered demo. Authoring contract: `scripts/examples-gen/README.md`|

Build order (dependency-driven): utils -> core -> common -> forms/data-display -> ui.

## Common Commands

### Development Server

Start the demo application locally:

```bash
npm start
```

Runs on `http://localhost:4200`. The `prestart` hook regenerates the docs JSON and the examples components first.

### Documentation

Generate and serve the compodocx API documentation:

```bash
npm run docs        # Generate docs into /docs
npm run docs:serve  # Generate and serve at http://localhost:8080
```

### Building

Build all libraries in dependency order (also builds the themes):

```bash
npm run build:libs
```

Build a specific library:

```bash
npm run build:utils
npm run build:core
# ... build:common, build:forms, build:data-display, build:ui
```

### Examples

The examples app under `examples/` is the canonical demo surface - one
`*.story.ts` per rendered example, mirroring the route. Story files live
under `examples/stories/<lib>/<category>/<demo>/<slug>.story.ts`; the matching
component under `examples/src/app/features/` is generated and gitignored.
`prebuild:examples` and `prestart:examples` run the generator automatically,
so editing a story and running `npm start` is the whole loop.

```bash
npm run examples:generate   # regenerate features/ + routes (runs on prebuild/prestart anyway)
npm run start:examples      # serve at http://localhost:4200
```

The story authoring contract - `DemoSpec` shape, artifact-vs-chrome split
(`template`/`setup` vs `templateChrome`/`setupChrome`), path-derived navigation,
tag fields - lives in `scripts/examples-gen/README.md`.

## Testing

Tests are not optional. Every new feature and every bugfix must ship with
tests, and the suite must be green before you open a PR.

### Unit tests (vitest)

Unit tests are the baseline for all library code. `npm test` runs the full
suite across all six libraries (non-watch):

```bash
npm test                 # all libraries, single run
npm run test:watch       # watch mode (utils)
npm run test:core        # single library (test:utils / test:common / test:forms / test:ui / test:data-display)
npm run test:scripts     # tests for scripts/ (separate vitest config)
```

Conventions: call `TestBed.flushEffects()` after signal mutations, use
`vi.useFakeTimers()` for debounce, and reuse the shared helpers from
`@cngx/testing`. Public reactive state, the `computed()` graph, and the
ARIA outputs (`aria-busy`/`aria-invalid`/`aria-describedby`) all belong under test.

### End-to-end tests (Playwright)

E2E tests cover rendered behaviour and visual flows. Write or update them when
you add or change a demo, an overlay/focus interaction, or anything with a
visual regression surface:

```bash
npm run e2e                       # root Playwright suite (playwright.config.ts)
npm run test:e2e:examples         # Playwright against the examples app
npm run test:e2e:examples:update  # refresh examples snapshots
```

### Linting

```bash
npm run lint       # eslint .
npm run lint:fix   # eslint --fix + prettier
```

Run lint and the unit tests locally before pushing - they catch what the
AOT build does not.

## Continuous Integration

CI (`.github/workflows/ci.yml`, Node 20) runs on pushes to `main` and on PRs:

`build:libs` -> `docs:json` -> `examples:generate` -> `lint` -> `test` -> `build:examples`.

E2E is not part of CI - run it locally when your change warrants it.

## Branching and Commit Workflow

We follow the same model the Angular and Angular Components monorepos use:
develop on a topic branch with atomic commits, then **squash-merge** the pull
request so `main` carries exactly one curated commit per PR. The changelog is
generated from those squash commits, so a clean PR title is a clean changelog
line.

### Branches

Always branch off `main` - never commit to `main` directly. Name the branch
`<type>/<short-kebab-summary>`, where `<type>` is the Conventional Commit type
of the work:

- `feat/stepper-chips-skin`
- `fix/checkbox-aria-errormessage`
- `docs/contributing-workflow`

One branch = one logical, reviewable change.

### Commits on your branch

Commit as atomically as you like while developing - small, focused commits are
encouraged for review and `git bisect`. Each commit message follows
**[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <subject>
```

- `type`: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`
- `scope`: the library path segment the change lives in (see Scopes)
- `subject`: imperative mood, lower case, no trailing period, no em-dash

These per-commit messages are for reviewers. They are collapsed on merge and do
not reach the changelog.

`npm install` wires a husky `commit-msg` hook that runs commitlint against the
scope allow-list, so a malformed message is rejected before it is committed. The
hard gate is the PR-title check in CI; the local hook just catches mistakes
earlier. Both read the same scope list (`scripts/changelog-scopes.mjs`).

### Scopes

Scope mirrors the source path under `projects/<lib>/<area>/`. Use `<lib>` or
`<lib>/<area>`:

- `utils`, `core`
- `common`, `common/interactive`, `common/stepper`, `common/display`, `common/a11y`, `common/data`, ...
- `forms`, `forms/input`, `forms/field`, `forms/select`, ...
- `data-display`, `data-display/treetable`
- `ui`, `ui/stepper`, `ui/overlay`, `ui/feedback`, `ui/mat-stepper`, ...
- `themes/material`

Non-library scopes - `examples`, `examples-gen`, `docs`, `ci`, `build`, `chore` -
are valid for commits but are excluded from the generated changelog; they are
not consumer-facing library changes.

### Pull request title is the changelog line

Because we squash-merge, the **PR title becomes the single commit on `main`**,
so the PR title must itself be a valid Conventional Commit:

- `feat(ui/stepper): add chips and breadcrumb skins`
- `fix(forms/input): close copy-value reset-timer race`

Write the PR title as the one sentence a consumer should read in the changelog.
The squash collapses your atomic branch commits behind it; they stay visible in
the merged PR on GitHub.

### Breaking changes

Mark breaking changes two ways, exactly as Angular does:

- Add `!` after the scope in the PR title: `refactor(data-display)!: switch treetable selection to model<ReadonlySet<string>>()`
- Add a `BREAKING CHANGE:` footer in the PR description explaining the migration.

The changelog generator surfaces these in a dedicated Breaking Changes section.

### Hard rules

- No em-dash anywhere in commit subjects, PR titles, or footers - use a plain `-`.
- No AI-attribution or `Co-authored-by` footers.
- One logical change per PR. Unrelated cleanups go in their own PR.

## Release Workflow

The changelog is built from the squash commits on `main` (one per merged PR),
grouped by type and scope. Run it after merges land:

### Changelog

`CHANGELOG.md` is generated by [git-cliff](https://git-cliff.org) (config:
`cliff.toml`). Each `v*` tag becomes its own dated section, grouped by type and
sorted by scope; non-library scopes and non-feature/-fix types are filtered out.

```bash
npm run changelog              # full regen, one section per tag
npm run changelog:unreleased   # prepend only the commits since the last tag
```

You rarely run these by hand - `publish:*` regenerates and commits the changelog
as part of cutting a release (see below).

### Publishing

Versioning and publishing go through a custom script:

```bash
npm run publish:patch  # Bump patch version & publish
npm run publish:minor  # Bump minor & publish
npm run publish:major  # Bump major & publish
npm run publish:dry    # Dry run to preview changes
```

This script handles:

- Updating versions in all `package.json` files
- Publishing to the registry
- Regenerating `CHANGELOG.md` for the new version (git-cliff `--tag`) and
  committing it together with the version bump
- Creating and pushing the git tag, which then points at a commit that already
  carries its own changelog section

## Pull Requests

Please use the provided Pull Request Template when submitting changes. Ensure your PR:

1. Has a title that is a valid Conventional Commit - it becomes the squash commit and the changelog line.
2. Is squash-merged into `main` (one commit per PR); branch commits stay on the PR.
3. Includes unit tests (vitest) for new features and bugfixes, plus Playwright e2e where the change is visual or interactive.
4. Passes `npm run lint` and `npm test` locally.
5. Updates documentation or the relevant demo story when behaviour changes.
