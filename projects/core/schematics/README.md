# @cngx/core schematics

`ng add` for every `@cngx/*` package. Build-time tooling: it runs in Node under
the Angular CLI, never in an app bundle. `@cngx/core` owns the onboarding; every
other package ships a one-line shim that delegates to it. The shim folds its
lib into a given `--libs`, so `ng add @cngx/<lib>` always installs and
records `<lib>`. It reads the installed core version before it loads core:
the same release delegates in the run and hands core its own package and
core to pin, so the pins sit in core's plan and a declined confirm leaves
`package.json` as it was; missing or older pins both, installs the shim's
core and runs its ng-add as a follow-up task; newer is followed without any
pin, so a shim never downgrades core.

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
    render/              todo list, summary and terminal options, listr2 or plain lines
    shim/                delegateNgAdd, the body of every package shim
    versions.ts          versions.json with the local-build fallback
  ng-add/
    index.ts             the single-stage shell
    schema.json          options, no x-prompt (every question runs in the rule)
    detect/              detectProject(tree, workspace): ProjectFacts in detect.ts,
                         composed from workspace, styles, eslint, ai-tooling, bootstrap,
                         app-shell (root component, outlets, stock spec against
                         scaffold-catalog.generated.ts), scaffold (untouched ng new
                         App, starter fingerprints, index.html, favicon)
    steps/               pure plan<Step>(facts, answers, versions) per concern
    templates/           .tpl text bundled by the esbuild text loader: the helper README
    files/starter/       the starter's app.ts, app.html, stylesheet and favicon; shipped
                         as files next to the bundle (build-schematics copies every
                         <schematic>/files folder) and read by the shell at run time
    shell/               questions, preflight checklist, git state, install manifest reader (absent / unreadable / read)
  migrations/
    migrations.json      the ng update collection, hand-written entries only
    migration.ts         createMigration: renames, codemods, manifest re-runs
    <version>/index.ts   one migration per release with breaking changes
    refresh/index.ts     the migration of every other release (keyed at publish)
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

1. Add the facts it needs to `ProjectFacts` in `detect/detect.ts`, read by
   the topical module they belong to (`workspace.ts`, `styles.ts`,
   `eslint.ts`, `ai-tooling.ts`, `bootstrap.ts`, each with its spec) and
   composed in `detectProject`, so the step can decide plan versus skip
   without reading files.
2. Write `steps/<step>.ts` as `(facts, answers, versions) => StepResult` and
   its spec against `createFacts` / `createAnswers` from `testing/onboarding.ts`.
3. Add it to `planSteps` in `ng-add/index.ts` (apply order), extend the fixture matrix in
   `ng-add/index.spec.ts`, and update the per-preset snapshots.
4. A new answer gets a `schema.json` property (a list or boolean as a `oneOf`
   in the branch order the smoke guard checks), a field on `NgAddFlags`,
   `NgAddOptions` and `OnboardingAnswers`, a case in `parseNgAddOptions`, and
   a question in `shell/questions.ts` only when detection leaves it open.

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

1. `migrations/<version>/index.ts` returns `createMigration({ renames,
   codemods, bundleDir: __dirname })` (the build bundles every
   `migrations/<folder>/index.ts`). The release it names comes from its
   `migrations.json` entry, which the CLI hands to the run.
2. Renames are data: a `RenameTable` on top of `EMPTY_RENAME_TABLE` for
   classes, selectors, inputs, outputs, `exportAs` names, tokens and import
   paths. `planRenames` turns it into one edit per file plus a note for
   every spot it cannot reach. Anything a table cannot say is a `Codemod`
   that reads the renamed tree and plans changes.
3. A `migrations.json` entry `migration-v<version>` with the version and
   `./<version>/index#migrate`. A second breaking change in the same release
   adds its own entry `migration-v<version>-<slug>` with the folder
   `<version>-<slug>`, so every breaking PR brings a new key. The guard
   (`scripts/migrations-well-formed.mjs`) derives the key from the entry's
   `version`, so the slug is lowercase letters, digits and hyphens.
4. A spec next to the entry with a case that runs `migrate` or
   `createMigration`, and a fixture pair under
   `testing/fixtures/migrations/<folder>/{before,after}` holding only the
   files that differ from the stock app; `after` must differ from `before`
   and a `.gitkeep` alone is no fixture. The migration-gate reads only the
   `!` in a PR title, so a breaking change must carry it.

No release uses a rename table yet; the refresh entry runs the rename engine
with `EMPTY_RENAME_TABLE`, so `planRenames` and the codemod hooks are the
contract for the first breaking release, not dead code.

Every migration also re-runs the install steps `.cngx/install.json` records
for each project (the theme once the cngx version moved, the helper README
once the MCP version moved, planned once from the libs and steps of every
record) and records the new release in each record. It never writes back a file
that is gone; it names it. Every hand-written migration goes through
`createMigration`, so it re-checks the manifest steps as well; there is no
second path that skips them.

The Angular CLI runs the entries whose version lies above the installed
release and up to the target, so a release reaches an app only through an
entry keyed to it. The source `migrations.json` holds only the hand-written
keys. At release time `scripts/publish.mjs` adds
`migration-v<release>-refresh` (factory `./refresh/index#migrate`) to
`dist/core/schematics/migrations/migrations.json` for a release that brings
no entry of its own; a release with its own migration gets none. Before
anything is published, publish checks the source collection: it must parse,
and every entry for the release must name a factory whose `index.ts`
exists. Publish then builds every lib before the first `npm publish` and
checks the dist collection the same way against the bundled `index.js`, so a
refusal never leaves part of the release on the registry. `npm run
publish:dry` runs both checks and prints the entry it would add.

## Build and test

|Command|What|
|-|-|
|`npm run test:schematics`|specs, vitest in Node (`ng test core` excludes the folder)|
|`npm run build:<lib>`|`ng build <lib>` then `scripts/build-schematics.mjs <lib>`|
|`npm run schematics:tokens`|regenerate `steps/theme-tokens.generated.ts` from `system-tokens.css`|
|`npm run schematics:mcp`|regenerate `steps/mcp-capabilities.generated.ts` (the helper README capability table) from the `@cngx/mcp` registrations|
|`npm run schematics:scaffold`|regenerate `detect/scaffold-catalog.generated.ts` (the `ng new` files an app is compared against exactly) from the installed `@schematics/angular` templates: the toolchain's own (CLI 21) and each `@schematics/angular-<major>` npm alias devDependency (CLI 22); a new CLI major is one alias, one `scaffold-<major>*` fixture set and one regenerate|
|`npm run test:scripts`|dist smoke run, bundle budgets, token drift, publish gate|

`build-schematics.mjs` type-checks, then bundles each entry with esbuild (cjs,
minified). `@angular-devkit/*`, `@schematics/angular`, `typescript` and
`@angular/compiler` stay external: they come from the consumer's CLI install.
Import TypeScript as `typescript`, never through
`@schematics/angular/third_party/...`: that vendored copy is gone in CLI 22,
and the build fails on any bundle `require` that is neither a Node builtin nor
one of those externals. Each `dist/<lib>/schematics/` carries a
`package.json` with `"type": "commonjs"` (and an `!schematics/package.json`
line in the ng-packagr `.npmignore`, so it is packed), which keeps the
bundles CommonJS under a package root with `"type": "module"`.
Budgets: 256 KB minified / 90 KB gzip per entry, 20 KB per shim.
`scripts/publish.mjs` writes `dist/core/schematics/versions.json` (the cngx,
`@cngx/mcp` and `@cngx/eslint-plugin` pins, plus the `@angular/core` range
`@cngx/core` peers on, which `ng add` refuses an older app against and warns
an app above its highest major about), stamps the
`refresh` entry into the dist migrations collection, and ships a lib's bundle
only when its source `package.json` declares `schematics`. Both files come
from `stampSchematicsDist`, which `scripts/pack-libs.mjs` runs on the staged
core as well, so a packed core carries the same `versions.json` and refresh
entry as a published one (versions from the workspace, no registry call).
An unstamped `dist/` (version `0.0.0-PLACEHOLDER`, e.g. through `npm link`)
pins no `@cngx/*` version: `ng add` keeps the declared ranges and plans one
note naming `pack-libs`, and a shim follows the installed core or stops when
there is none. The placeholder is joined at runtime, since the stamping
rewrites every literal of it in the bundles.

## CLI behaviour worth knowing

- `ng add` strips `interactive`, `dryRun`, `force`, `defaults`, `registry`,
  `verbose` and `skipConfirmation` before the rule runs, so the schema uses
  none of those names. `prompts` and `yes` are the schematic's own switches.
  The context's `interactive` stays `true` either way (the workflow never
  passes the flag on), so the shell reads `--interactive=false`,
  `--no-interactive` and `--defaults` from `process.argv` through the pure
  `readPromptFlags`, and honours `interactive: false` from a programmatic
  caller.
- Before the package is installed, `ng add` parses the command line without
  the schema's option types. A list flag reaches the rule as one string
  (`--ai-tools claude,vscode` is `"claude,vscode"`) and `--lint=false` as the
  string `"false"`; only a second `ng add` of an installed package sees typed
  values. `schema.json` therefore admits both forms (a list's string branch
  comes first, a boolean's boolean branch), and `parseNgAddOptions` turns
  either into `NgAddOptions` once at the ng-add entry.
- The recorded `libs` are a floor: `withLibsFloor` (`ng-add/shell/questions.ts`)
  adds the libs the last install recorded and every `@cngx/<lib>` the app
  declares that is not only a peer of the others, and `libsFloorNote` says
  what it kept. A re-run never removes a package; removal is manual.
- The comma form is the only multi-value spelling. The CLI keeps the last
  value of a repeated flag (`--libs core --libs forms`) or a space-separated
  list (`--libs core forms`) and warns.
- A list flag has no `[]` default: the registry fills none for a `oneOf`
  property, so an unset list arrives as `undefined`. The parser also reads a
  programmatic `[]` as "not given".
- `ng add <pkg> --dry-run` for a package that is not installed never reaches a
  rule. Preview with `ng add`, then `ng g @cngx/core:ng-add --dry-run`.
- Prompts run inside the rule after the CLI's install spinner has finished,
  and collapse to one answer line each. The shim fallback (core not placed by
  the package manager yet) installs core and runs its ng-add as a
  `RunSchematicTask`; prompts render the same way there.
- With feedback on, the `app-shell` step places `<cngx-banner-outlet />` and
  `<cngx-toast-outlet />` in the root component that `main.ts` bootstraps
  (the banner above the `ng new` placeholder block, so it shows above the
  welcome page, else right above `<router-outlet>`, else at the end; the
  toast at the end) and both classes in the component
  or root NgModule `imports`; alert stacks are scoped and never placed. An
  unedited stock `app.spec.ts` (an exact match against the scaffold catalog)
  gets the feedback providers; the unedited `ng new --standalone=false`
  spec, which declares `App` in its own TestBed, also gets both outlet
  classes in the TestBed `imports`, only where `@angular/build` 21 is
  installed or a range admitting only major 21 is declared (from 22.2 its
  unit-test builder compiles `App` without `AppModule`). Next to any other
  spec, and next to any NgModule spec without that build, no outlet
  is placed and one note names the outlets and what the spec needs, so
  `ng add` never leaves a red `ng test`. An outlet this project's record placed that
  is gone stays out unless `--feedback` is passed; `ng update` only notes a
  missing one.
- `starter` is an answer no question asks: `--preset=full` turns it on,
  `--no-starter` (or `--starter=false`) off, any other preset leaves it off.
  A record without it reads as off, so `ng update` and a re-run of an older
  `full` install never write a starter.
- With the starter on, the `starter` step runs before `app-shell`: over an
  untouched standalone scaffold (an exact match against the scaffold
  catalog, per file and variant, of any CLI major it holds) next to a
  stock, provided or missing spec it replaces `app.ts`, `app.html` and the
  stylesheet as whole files, each an `edit-file` whose `edit` re-checks the
  catalog entry at apply time, appends `body { margin: 0 }` to the global
  styles and, over an untouched `index.html`, writes `public/favicon.svg`
  and points the icon link at it. Each starter file records a
  `cngx:fingerprint` of its render; a re-run whose render matches skips it,
  one with other answers names it in a note. The outlets step then skips
  the outlets the starter carries and still provides the stock spec.
  `scripts/__tests__/starter-compile.test.mjs` compiles the starter the
  built ng-add writes with `strictTemplates` against `dist/`.
- A provider goes on its own line of the root providers array (an object
  typed `ApplicationConfig`, the `@NgModule` argument or the inline
  `bootstrapApplication` config) when the planned file holds exactly one and
  the call's imports bind cleanly. Otherwise `addRootProvider` places it: it
  covers standalone app configs and root NgModules alike, aliases a clashing
  import, and appends to the last provider line. A root config whose
  `providers` is not an array literal (a variable, a call, a shorthand), one
  that spreads another object without a `providers` array, or a config
  variable built by `mergeApplicationConfig` is never edited: the plan holds
  one note with every missing provider and its imports to paste.
- Material's own ng-add writes a `mat.theme((...))` map with `density: 0` into
  the scss global stylesheet, or into a new `src/material-theme.scss` placed
  first in the build styles of a css app. The bridge entry cngx adds follows
  the stylesheet that imports `cngx.css`, because it emits
  `@layer cngx.components`. A `define-theme` or M2 object is bridged in its
  own file instead; `insertStyleImport` places the bridge `@use` ahead of the
  first `@import` there, the `cngx.css` `@import` after the leading block.

## Trying a build against a real app

`node scripts/consumer-fixture.mjs --angular 21 --variant schematics` does
the whole round trip against the tarballs of `scripts/pack-libs.mjs`: a fresh
app, `ng add @cngx/core` twice (the second must change nothing),
`ng add @cngx/forms --libs core` (exact pins for utils, core, common, forms),
`ng update @cngx/core --migrate-only` twice (the second finds nothing), then
`ng build` and a browser load. It serves the tarballs from a local registry
for the `@cngx` scope inside the script. `--stale-core <tgz | previous>` adds
a sandbox with an older core installed, where `ng add @cngx/forms` must
replace it in the same run; `previous` packs the newest registry release
below the tarballs.

For anything the fixture does not cover, scratch apps must live outside this workspace: `ng new` refuses to run inside
it, and an install there resolves the repo's tree. Use npm 11 (npm 10 fails
on a fresh Angular 21.2 install). Publish staged copies of `dist/*` to a local
registry (verdaccio on `127.0.0.1:4873`, `@cngx/*` without an uplink), point
the app at it with an `.npmrc` line `@cngx:registry=http://localhost:4873/`,
then run `npx ng add @cngx/<lib>@<version> --registry http://localhost:4873`.
The repo `.npmrc` pins the `@cngx` scope to npmjs, so `npm view` from inside
the repo reads npmjs even with `--registry`.
