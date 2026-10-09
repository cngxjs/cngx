# E1 schematics spike (Phase 0)

Results of the Phase 0 spike for `ng add` / `ng update`. Folded into the
schematics README or deleted in Phase 1.

Environment: Node 22.23.1, Angular CLI 21.2.2, scratch app from
`ng new e1-app --defaults --skip-git --style=scss --ssr=false`, `@cngx/*`
published as `0.1.0-spike.2` to a local verdaccio.

## Summary

|Question|Answer|
|-|-|
|Local registry|verdaccio works; publish from staged copies, not through `publish.mjs`|
|`ng add @cngx/ui` resolves `@cngx/core`|Yes, in the same run (npm installs core as a peer)|
|In-rule prompts and the CLI spinner|Clean, in both stages: the CLI install step completes before the rule runs; answers echo on one line; logs stay flat (joint TTY session 2026-10-09)|
|Material scaffold theme shape|`mat.theme((...))` map API, no `$theme` (confirmed)|
|`--dry-run` reaches the rule|Only when the package is already installed; tasks never run; the rule cannot see the flag|
|Two-stage flow|Works: install, then `ng-add-setup` with the new packages resolvable|
|`HostTree` over `NodeJsSyncHost`|Works with `readWorkspace` and `addRootProvider` unchanged|
|`@angular/compiler` inside the schematic|Resolves from the consumer install (ESM, loaded through `require`)|
|Bundle size|+246 KB packed / +814 KB unpacked on `@cngx/core` once shipped; 493 KB of it is avoidable; no release ships it before the manifest declares `schematics`|
|Material vars-only fidelity|Open: needs a joint browser session (see below)|
|`HostSink` write-back|Works; commits a `HostTree` without own action iteration|

Decisions for the owner before Phase 1 are listed at the end.

## Local registry

verdaccio 6 (`npx -y verdaccio@6 --config ./config.yaml`) in a gitignored
folder, listening on `127.0.0.1:4873`. Config: `@cngx/*` local only
(`access`, `publish`, `unpublish: $all`, no uplink), `**` proxied to
npmjs.

`scripts/publish.mjs` is not usable for this: a non-dry run requires a clean
worktree and bumps the root `package.json`. The spike stages instead: copy
each `dist/<lib>` to `stage/<version>/<lib>`, set `version` and the
`0.0.0-PLACEHOLDER` peers, write `schematics/versions.json` through
`createSchematicsVersions`, run `replaceVersionInDist`, then

```bash
npm publish --registry http://localhost:4873 --tag latest --//localhost:4873/:_authToken=spike
```

Two traps:

- The repo `.npmrc` pins `@cngx:registry=https://registry.npmjs.org/`.
  `npm publish --registry` wins over it (verified: no `spike` version on
  npmjs for any of the 8 packages), but `npm view @cngx/x --registry ...`
  from inside the repo silently reads npmjs. Run `npm view` with the scoped
  key overridden or from outside the repo.
- `npm pack` + `file:` installs were not needed; verdaccio staging took
  seconds per wave.

The scratch app cannot live inside the cngx workspace: `ng new` refuses
("not available when running the Angular CLI inside a workspace") and an
`npm install` there resolves the repo's tree. Keep it outside the repo.

npm 10.9.8 fails installing a fresh Angular 21.2 app (`Cannot read
properties of null (reading 'edgesOut')`, arborist, in the `jsdom` ->
optional `canvas` peer). npm 11.21.0 installs it. The spike ran every
`ng add` with npm 11 first on `PATH`.

## `ng add @cngx/ui` delegation

```bash
ng add @cngx/ui --registry http://localhost:4873 --skip-confirmation
```

Without a `schematics` key in the package manifest the CLI answers "The
package does not provide any `ng add` actions". The build does not write the
key until Phase 4, so the spike staging added
`"schematics": "./schematics/collection.json"` to the staged copies only.
With it:

```
cngx ng-add: stage one (version 0.1.0-spike.2)
UPDATE package.json (886 bytes)
✔ Packages installed successfully.
cngx ng-add-setup: detection {"projects":["e1-app"],"project":"e1-app","material":false,"cngxUtils":true,"isTTY":false,"interactive":true,"dryRun":false}
CREATE .cngx/spike.json (243 bytes)
```

`package.json` after the run:

```json
"@cngx/core": "0.1.0-spike.2",
"@cngx/ui": "^0.1.0-spike.2",
"@cngx/utils": "0.1.0-spike.2"
```

npm 7+ installs `@cngx/core` as a peer of `@cngx/ui`, so the shim takes the
`externalSchematic` path in the same run; the "install core first" fallback
(`RunSchematicTask('@cngx/core', 'ng-add')`) is covered by the dist smoke
test only. The CLI writes the entry package with a caret
(`^0.1.0-spike.2`); Phase 4 has to rewrite it to the exact lockstep version.
The other `@cngx/*` pins are exact, and an older pin the app already
declares is replaced and logged.

## `--dry-run`

`ng add` strips `interactive`, `dryRun`, `force`, `defaults`, `registry`,
`verbose` and `skipConfirmation` before calling the schematic
(`@angular/cli/src/commands/add/cli.js:544`). Options with those names
would always arrive as their schema defaults, so the schema no longer
declares them; the rule cannot tell a dry run from a real one through
options.

- Package not installed: `ng add @cngx/ui --dry-run` never reaches a rule.
  The CLI dry-runs its own `npm view` and fails with "Unable to load package
  information from registry."
- Package installed: the rule runs on a virtual tree, nothing is written,
  and every task is suppressed. Stage two (`ng-add-setup`) never runs, so a
  dry run shows only stage one.

Consequence for Phase 2/4: the dry-run description of the full plan cannot
rely on stage two. Either stage one describes the whole plan (detection on
the pre-install tree) when it detects a dry run, or the option gets a name
the CLI does not strip (for example `--plan`). Same for prompts: honour a
non-stripped option (for example `--prompts=false`) plus `process.stdout.isTTY`.

`ng-add-setup` is `private: true`; `ng g @cngx/core:ng-add-setup` answers
"Schematic not found", which is the intended behaviour.

## Two-stage flow

Task order recorded by the test runner and confirmed in the real run:
`node-package` (install) -> `run-schematic` (`ng-add-setup`). Stage two sees
the installed `@cngx/utils` (`cngxUtils: true` in the detection log) and runs
on the committed tree. Under a TTY the `preset` `x-prompt` fires before stage
one:

```
? Which cngx setup do you want?
  minimal - dependencies only
❯ recommended - dependencies, theme, a11y providers, lint
  full - recommended plus AI tooling and the German language pack
```

## In-rule prompts under the CLI

Joint session 2026-10-09 in a real terminal (iTerm, zsh), npm 11.21.0 first
in `PATH`, scratch apps outside the workspace. Two runs:

1. Two-stage, `0.1.0-spike.3`: `@inquirer` `select` in `ng-add-setup`,
   after the install task.
2. Single-stage probe, `0.1.0-spike.4`: the same `select` in the `ng-add`
   rule body, after detection and before any write, with one
   `NodePackageInstallTask` at the end. Built from
   `.internal/verdaccio/probe/single-stage-ng-add.ts` into the staged core
   copy only (`probe/publish-probe.mjs`); the branch source is unchanged.

Single-stage transcript (`ng add @cngx/ui@0.1.0-spike.4`):

```
✔ Determining Package Manager
  › Using package manager: npm
✔ Loading package information
✔ Confirming installation
✔ Installing package
✔ Which cngx setup do you want? recommended - dependencies, theme, a11y providers, lint
           cngx ng-add: single-stage probe (version 0.1.0-spike.4)
           cngx ng-add: detection {"projects":["e1-app-2"],"material":false,"isTTY":true}
✔ Which theme should cngx generate? cngx default
           cngx ng-add: theme answer "cngx" (prompted: true)
CREATE .cngx/spike.json (150 bytes)
UPDATE package.json (888 bytes)
✔ Packages installed successfully.
```

Findings:

- The CLI's listr steps all complete before the schematic runs, so no CLI
  spinner is active while an in-rule prompt is open, in either stage.
- The `@inquirer` prompt renders its full choice list and collapses to one
  `✔ question answer` line, the same shape as the CLI's own `x-prompt`.
- `context.logger` lines are indented by the CLI (about 11 columns in the
  rule body, 4 inside a `RunSchematicTask`) but never interleave with a
  prompt or a spinner. Cosmetic only.
- The CLI's own "Would you like to proceed?" confirmation pauses its
  spinner itself; it appeared on the second run only and is unrelated to
  the schematic.
- Not observed: `listr2` output and `--verbose`. Only the apply phase uses
  `listr2`, which runs after every prompt has been answered; to be checked
  in the Phase 2 smoke run.

Verdict: the single-stage shape (detect, prompt, write, one install task at
the end) runs clean under `ng add`.

## Node adapter (`HostTree` over `NodeJsSyncHost`) and `HostSink`

Probe against a copy of the scratch app:

```js
const host = new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(root));
const tree = new HostTree(host);
await readWorkspace(tree);                                  // ['e1-app']
const result = await lastValueFrom(callRule(addRootProvider('e1-app',
  ({ code, external }) => code`${external('provideA11yPreferences', '@cngx/core')}()`), tree, context));
await lastValueFrom(new HostSink(host).commit(result), { defaultValue: undefined });
```

Result: one overwrite action on `src/app/app.config.ts`, committed to disk,
import added. `callRule` needs a `SchematicContext`; a plain stub (`logger`,
`addTask`, `engine: null`) is enough for `addRootProvider`. Cosmetic:
`addRootProvider` appends to the last provider line
(`provideRouter(routes), provideA11yPreferences()`).

## `@angular/compiler`

Kept external. In the scratch app `require('@angular/compiler')` resolves
21.2.25 and `parseTemplate` is a function. The package is ESM-only
(`"type": "module"`); loading it from the CJS bundle relies on
`require(esm)`, which every Node version Angular 21 supports has enabled.

## Bundle size

|Artefact|Size|
|-|-|
|`dist/core/schematics` (unminified)|808 KB|
|`ng-add-setup/index.js` (unminified)|810 KB|
|`ng-add/index.js`|2 KB|
|`dist/ui/schematics`|12 KB|
|`@cngx/core` tarball without schematics|182 KB packed / 703 KB unpacked|
|`@cngx/core` tarball with schematics|428 KB packed / 1518 KB unpacked|
|`ng-add-setup` minified|601 KB (224 KB gzip)|
|`listr2` + `picocolors` minified|93 KB (28 KB gzip)|

Attribution of the minified stage two: `iconv-lite` 493 KB, `chardet`
37 KB, everything else under 11 KB each. Both come from the `editor`
prompt (`external-editor`) that the aggregate `@inquirer/prompts` drags in;
they do not tree-shake. Importing the single packages (`@inquirer/select`,
`@inquirer/checkbox`, `@inquirer/confirm`) instead of the aggregate should
drop the stage-two bundle to roughly 110 KB minified. The build already
minifies; the sizes above are from before that and `minify` alone took the
stage-two bundle from 810 KB to 602 KB.

`scripts/publish.mjs` builds the schematics only for a lib whose source
`package.json` declares `schematics`, so no release carries the bundle
before Phase 4 adds that key.

## Material scaffold

```bash
ng add @angular/material@21.2 --skip-confirmation --defaults
```

`src/styles.scss`, lines 6-19 (Material 21.2.14):

```scss
@use '@angular/material' as mat;

html {
  height: 100%;
  @include mat.theme(
    (
      color: (
        primary: mat.$azure-palette,
        tertiary: mat.$blue-palette,
      ),
      typography: Roboto,
      density: 0,
    )
  );
}
```

No `$theme` variable exists, so `cngx-material.theme($theme)` cannot be fed
from the scaffold. Confirms the need for a bridge input that takes the map
API, the `theme-system()` mixin planned for Phase 3.

## Open: joint sessions

These need a real terminal and a browser and are run together with the
owner, not delegated:

1. Material vars-only fidelity. A Material-scaffolded app with only the
   system and density bridges applied, side by side with the examples
   `/material-lab` widgets; list which component colours diverge. Decides
   whether Phase 3 stays system-only.

## Decisions for the owner before Phase 1

1. Prompt library: keep `@inquirer` but import the single-prompt packages
   (`@inquirer/select`, `@inquirer/checkbox`, `@inquirer/confirm`) and add
   them as devDependencies instead of `@inquirer/prompts`; `listr2` and
   `picocolors` stay. Confirmed by the joint TTY session (see "In-rule prompts
under the CLI").
2. Registry approach: verdaccio with staged copies, as above.
3. Dry run and prompt switches: the CLI strips `dryRun` and `interactive`,
   so the schema needs option names the CLI passes through (proposal:
   `plan` and `prompts`), and the dry-run plan must be computable in stage
   one.
4. Material bridge input shape: pending the joint browser session.
5. Scratch app location: outside the cngx workspace (the plan's in-repo
   scratch path does not work), installed with npm 11.
