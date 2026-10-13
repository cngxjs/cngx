# @cngx/core schematics

`ng add` for every `@cngx/*` package. Build-time tooling: it runs in Node under
the Angular CLI, never in an app bundle. `@cngx/core` owns the onboarding; every
other package ships a one-line shim that delegates to it.

## Layout

```
projects/core/schematics/
  collection.json        ng-add
  engine/                the functional core, one barrel (index.ts)
    fs/                  Tree adapters: memory (specs) and node (CLI runs)
    plan/                Change model, ChangePlan, provenance, report
    edit/                pure TS, template and style edits
    apply/               applyChangePlan: the one effectful step, a Rule
    manifest/            package.json reading, lockstep pins
    migrate/             rename table, planRenames and the Codemod contract
    prompt/              prompt flow over @inquirer (shell adapter)
    render/              todo list and summary, listr2 or plain lines
    shim/                delegateNgAdd, the body of every package shim
    versions.ts          versions.json with the local-build fallback
  ng-add/
    index.ts             the single-stage shell
    schema.json          options; x-prompt only for preset
    detect/              detectProject(tree, workspace): ProjectFacts
    steps/               pure plan<Step>(facts, answers, versions) per concern
    shell/               questions, git state
  migrations/
    migrations.json      the ng update collection, one entry per release
    migration.ts         createMigration: renames, codemods, manifest re-runs
    <version>/index.ts   one migration per release
  testing/               fixture apps and runRule for specs
projects/<lib>/schematics/
  collection.json, tsconfig.json, ng-add/index.ts   the shim
```

## Rules

- **One barrel.** Code outside `engine/` imports `engine` only, never a module
  path inside it; shims import nothing else from core (`eslint.config.js`
  enforces both).
- **Functional core, imperative shell.** `detect/` and `steps/` are pure: no
  classes, no `this`, no I/O, no `Date` or `process`; time, git and the
  environment enter as parameters. Effects live in `engine/apply`, the
  renderer, the prompt adapter and `ng-add/shell/`.
- **The plan is the single source.** A step returns a `StepResult`
  (`changes` plus `skipped`); the todo list, `--dry-run` output, the summary
  and `.cngx/install.json` are projections of the one `ChangePlan`. A change
  whose effect is already in place is skipped under the same id, so a second
  run plans nothing and writes nothing.
- **Notes are not changes.** A step that refuses or leaves work to the user
  plans a `note`; it is listed apart and never triggers the confirm.
- **Every spec first.** Each module has a sibling `*.spec.ts`; steps assert
  they do not mutate their (deep-frozen) inputs.

## Adding an onboarding step

1. Add the facts it needs to `detect/detect.ts` (with a fixture case in
   `detect.spec.ts`), so the step can decide plan versus skip without reading
   files.
2. Write `steps/<step>.ts` as `(facts, answers, versions) => StepResult` and
   its spec against `createFacts` / `createAnswers` from `testing/onboarding.ts`.
3. Append it to `STEPS` in `ng-add/index.ts`, extend the fixture matrix in
   `ng-add/index.spec.ts`, and update the per-preset snapshots.
4. A new answer gets a `schema.json` property, a field on `NgAddOptions` and
   `OnboardingAnswers`, and a question in `shell/questions.ts` only when
   detection leaves it open.

A change kind the engine does not know yet goes into `plan/change.ts` with its
apply mapping, report file and renderer target; the exhaustive switches fail
the type check until all three exist.

## Generators and migrations

`ng-add` is the only generator today. A generator is a new folder with an
`index.ts` entry (the build bundles every `<folder>/index.ts`) and a
`collection.json` entry.

`ng update @cngx/core` runs `migrations/migrations.json`, named by the
`ng-update.migrations` key next to the `packageGroup`. A release with a
breaking change adds a migration:

1. `migrations/<version>/index.ts` returns `createMigration({ version,
   renames, codemods, bundleDir: __dirname })` (the build bundles every
   `migrations/<folder>/index.ts`).
2. Renames are data: a `RenameTable` on top of `EMPTY_RENAME_TABLE` for
   classes, selectors, inputs, outputs, `exportAs` names, tokens and import
   paths. `planRenames` turns it into one edit per file plus a note for
   every spot it cannot reach. Anything a table cannot say is a `Codemod`
   that reads the renamed tree and plans changes.
3. A `migrations.json` entry `migration-v<version>` with the version and
   `./<version>/index#migrate`. A second breaking change in the same release
   adds its own entry `migration-v<version>-<slug>` with the folder
   `<version>-<slug>`, so every breaking PR brings a new key.
4. A spec next to the entry and a fixture pair under
   `testing/fixtures/migrations/<folder>/{before,after}` holding only the
   files that differ from the stock app.

Every migration also re-runs the install steps `.cngx/install.json` records
(the theme, and the helper README once the MCP version moved) and records the
new release in it. It never writes back a file that is gone; it names it.

## Build and test

|Command|What|
|-|-|
|`npm run test:schematics`|specs, vitest in Node (`ng test core` excludes the folder)|
|`npm run build:<lib>`|`ng build <lib>` then `scripts/build-schematics.mjs <lib>`|
|`npm run schematics:tokens`|regenerate `steps/theme-tokens.generated.ts` from `system-tokens.css`|
|`npm run test:scripts`|dist smoke run, bundle budgets, token drift, publish gate|

`build-schematics.mjs` type-checks, then bundles each entry with esbuild (cjs,
minified). `@angular-devkit/*`, `@schematics/angular`, `typescript` and
`@angular/compiler` stay external: they come from the consumer's CLI install.
Budgets: 256 KB minified / 90 KB gzip per entry, 20 KB per shim.
`scripts/publish.mjs` writes `dist/core/schematics/versions.json` (the cngx,
`@cngx/mcp` and `@cngx/eslint-plugin` pins, plus the `@angular/core` range
`@cngx/core` peers on, which `ng add` refuses an older app against) and ships a
lib's bundle only when its source `package.json` declares `schematics`.

## CLI behaviour worth knowing

- `ng add` strips `interactive`, `dryRun`, `force`, `defaults`, `registry`,
  `verbose` and `skipConfirmation` before the rule runs, so the schema uses
  none of those names. `prompts` and `yes` are the schematic's own switches.
- The devkit schema registry fills every unset array option with `[]`; an
  empty list therefore reads as "not given".
- `ng add <pkg> --dry-run` for a package that is not installed never reaches a
  rule. Preview with `ng add`, then `ng g @cngx/core:ng-add --dry-run`.
- Prompts run inside the rule after the CLI's install spinner has finished,
  and collapse to one answer line each. The shim fallback (core not placed by
  the package manager yet) installs core and runs its ng-add as a
  `RunSchematicTask`; prompts render the same way there.
- A provider goes on its own line of the root providers array (an object
  typed `ApplicationConfig`, the `@NgModule` argument or the inline
  `bootstrapApplication` config) when the planned file holds exactly one and
  the call's imports bind cleanly. Otherwise `addRootProvider` places it: it
  covers standalone app configs and root NgModules alike, aliases a clashing
  import, and appends to the last provider line.
- Material's own ng-add writes a `mat.theme((...))` map with `density: 0` into
  the scss global stylesheet, or into a new `src/material-theme.scss` placed
  first in the build styles of a css app. The bridge entry cngx adds follows
  the stylesheet that imports `cngx.css`, because it emits
  `@layer cngx.components`.

## Trying a build against a real app

Scratch apps must live outside this workspace: `ng new` refuses to run inside
it, and an install there resolves the repo's tree. Use npm 11 (npm 10 fails
on a fresh Angular 21.2 install). Publish staged copies of `dist/*` to a local
registry (verdaccio on `127.0.0.1:4873`, `@cngx/*` without an uplink), point
the app at it with an `.npmrc` line `@cngx:registry=http://localhost:4873/`,
then run `npx ng add @cngx/<lib>@<version> --registry http://localhost:4873`.
The repo `.npmrc` pins the `@cngx` scope to npmjs, so `npm view` from inside
the repo reads npmjs even with `--registry`.
