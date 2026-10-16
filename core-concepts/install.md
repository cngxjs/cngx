<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Install

<aside class="cc-tldr">

Run `ng add @cngx/ui` (or any other `@cngx/*` package). One run pins the packages, adds the theme, wires the root providers and the lint rules, records what it did in `.cngx/install.json`, and installs once at the end. A second run changes nothing.

</aside>

Every published `@cngx/*` package ships an `ng add` schematic. `@cngx/core`
owns the onboarding; the other packages delegate to it, so `ng add @cngx/forms`
and `ng add @cngx/ui` run the same flow and produce the same files.

```bash
ng add @cngx/ui
```

The run reads the app first, asks only what it cannot detect, lists the
planned changes, applies them, prints a summary, and starts one package
install. Nothing outside the project is written.

---

## What a run does

1. **Detect.** The schematic reads the workspace: the Angular version, the
   build styles and whether they are CSS or Sass, the app config (standalone
   `app.config.ts`, a root NgModule, or a `providers` array written straight
   into `bootstrapApplication(App, {...})` in `main.ts`), the source locale, an Angular Material
   theme, an ESLint flat config, editor folders (`.claude`, `.cursor`,
   `.vscode`), and an earlier `.cngx/install.json`.
2. **Preflight.** A short checklist before the cngx questions: the app's
   Angular version against the one `@cngx/core` supports, the project and
   whether it counts as fresh or existing, and the git state. Uncommitted
   changes or a missing repository are flagged, since the cngx changes then
   have no clean `git diff` to review against. The `package.json` and
   lockfile edits of the package install `ng add` runs first do not count.
   The version comes from the installed `@angular/core`, else from the
   `@angular/core` range in `dependencies` or `devDependencies`. An app older
   than the supported Angular shows its failed line, then the run stops
   before anything is planned. A specifier that carries no version
   (`catalog:`, `workspace:*`, a dist-tag) with nothing installed is a warn
   line, and the run goes on; the `@angular/cdk` pin then becomes a note.
   A project without a `build` target in `angular.json` fails its project
   line and stops the run the same way. A `package.json` that does not
   parse, an `angular.json` without projects, or a build style entry whose
   file is missing stops the run with one line naming the file.
3. **Ask.** With a terminal attached it asks the open questions (below). A
   flag on the command line answers its question; without a terminal the
   preset answers, or on a re-run the answers the last install recorded.
4. **Plan.** Every step contributes changes to one plan. The list you see,
   the `--dry-run` output, the summary and the manifest are all read from
   that plan, so they cannot disagree. Notes (what a step refused or left to
   you) follow the list; they are not tasks.
5. **Confirm.** An app that already has components beyond the root one
   (anywhere under its source root, outside `node_modules` and `dist`), its
   own providers, a config written into `bootstrapApplication(App, {...})`,
   or another UI library (Material, PrimeNG, Tailwind, Bootstrap) counts as
   existing and gets one `Apply these changes?` before anything is written.
   That question needs a terminal: under CI, without a terminal, or with
   `--no-prompts`, the plan applies and one line says which of them kept
   the question away. `--yes` skips the question and the line. A fresh app gets no
   confirmation.
6. **Apply and summarise.** The summary lists the files touched, the notes
   (what a step refused or left to you), the steps already in place, and the
   next steps.
7. **Install.** One package install at the end, for every dependency the
   plan added.

---

## Presets

|Preset|What it sets up|
|-|-|
|`minimal`|The packages only. No theme, no providers, no lint rules. Asks none of the questions below; flags and the preset answer them.|
|`recommended` (default)|The packages, the theme, the accessibility preference providers and the lint rules.|
|`full`|`recommended` plus the German language pack, the root feedback services (toasts, alerts, banners), the popover positioning fallback, and the MCP setup for every editor folder found in the project.|

```bash
ng add @cngx/ui --preset=minimal
```

---

## Questions

The run asks only what detection leaves open, only with a terminal
attached, and nothing at all for `minimal`:

- **Packages.** Which `@cngx/*` packages to install. Their `@cngx` peers
  follow automatically.
- **Theme.** Only when `@angular/material` is installed: the Material theme
  through the cngx bridge, the cngx default theme, or no theme file.
- **Language.** Only when `@cngx/core` is selected: English only, or German
  with the English fallback.
- **Runtime switch.** Only for German: switch between English and German at
  runtime instead of a fixed language.
- **Lint rules.** Only when an ESLint flat config exists: add the cngx
  rules to it. The entry lands only on a stack the plugin runs in (see
  the ESLint row below); otherwise the step leaves a note with the next
  command.
- **Feedback services.** Only when `@cngx/ui` is selected: provide toasts,
  alerts and banners at the root.
- **AI tooling.** Which editors (Claude Code, Cursor, VS Code) get the cngx
  MCP server. The editors whose folder the project has are preselected,
  except one whose cngx server you removed since the last install. Picking
  an editor here brings its removed server back, like `--ai-tools`. See
  [AI tooling](#ai-tooling).

---

## Flags

Every answer has a flag. A flag skips its question.

|Flag|Values|Effect|
|-|-|-|
|`--preset`|`minimal`, `recommended`, `full`|How much of the onboarding to apply.|
|`--libs`|`utils`, `core`, `common`, `interop`, `forms`, `data-display`, `ui`, comma-separated (`--libs core,forms`)|The packages to install. Default: all of them. `@cngx/themes` needs `core`, `common`, `forms`, `data-display` and `ui` (`cngx.css` imports their CSS); a set without one of them gets a note naming the missing packages and no theme.|
|`--theme`|`cngx`, `material`, `none`|The generated theme file.|
|`--i18n`|`en`, `de`|The built-in copy.|
|`--runtime-switch`|`--runtime-switch`, `--no-runtime-switch`|Wire the language pack for switching at runtime.|
|`--lint`|`--lint`, `--no-lint`|Add `@cngx/eslint-plugin` to the flat config.|
|`--a11y-preferences`|`--a11y-preferences`, `--no-a11y-preferences`|Provide the density, text scale, motion and contrast axes with persistence.|
|`--feedback`|`--feedback`, `--no-feedback`|Provide toasts, alerts and banners at the root (needs `@cngx/ui`).|
|`--floating-fallback`|`--floating-fallback`, `--no-floating-fallback`|Install `@floating-ui/dom` and provide the popover positioning fallback (needs `@cngx/common`).|
|`--ai-tools`|`claude`, `cursor`, `vscode`, comma-separated (`--ai-tools claude,vscode`)|The editors to set up the cngx MCP server and agent instructions for. Answers the AI tooling question.|
|`--yes`|`--yes`|Apply to an existing app without the confirmation.|
|`--prompts`|`--prompts`, `--no-prompts`, default `true`|`--no-prompts` answers every question from flags, the recorded answers of a re-run and the preset defaults.|
|`--quiet`|`--quiet`|Print only the summary, not the planned changes.|

A boolean flag also takes `=true` or `=false` (`--lint=false`). A list flag
takes its values in one comma-separated argument: repeating the flag
(`--libs core --libs forms`) or separating the values with spaces
(`--libs core forms`) keeps only the last value.

For CI and scripted runs, pass the answers and skip the questions:

```bash
ng add @cngx/ui --preset=recommended --no-prompts --yes --skip-confirmation
```

`--skip-confirmation` belongs to the Angular CLI (it skips the CLI's own
install prompt); `--yes` skips the schematic's confirmation on an existing
app. A run without a terminal never asks, so `--no-prompts` matters mostly
under a pseudo-terminal.

---

## What it writes

|Target|When|What|
|-|-|-|
|`package.json`|always|Every selected `@cngx/*` package and its peers, pinned to the exact release; `@cngx/themes` when a theme is chosen; `@angular/cdk` at the app's Angular range when a package needs it; `@floating-ui/dom` for the fallback; `@cngx/eslint-plugin` as a devDependency for the lint rules, and `@angular-eslint/template-parser` on the `angular-eslint` version line when the app declares `angular-eslint` 19 or later but not the parser. `@angular/material` is never added.|
|Global styles|theme chosen|An import of `@cngx/themes/cngx.css` ahead of every cngx layer.|
|`cngx-layers.css`|theme chosen, Tailwind v4|Next to the first global stylesheet of the build: one `@layer` statement that puts the cngx layers between Tailwind preflight and the Tailwind utilities. See [Tailwind](#tailwind).|
|First global stylesheet|theme chosen, Tailwind v4|An import of `./cngx-layers.css` before every other `@import`.|
|`src/cngx-theme.css`|cngx theme|Every system token, commented out at its default, with what it controls. Uncomment a token to override it.|
|`src/cngx-theme.scss`|Material theme with a `mat.theme()` map|The bridge from the Material system tokens to the cngx tokens. A `define-theme` or M2 theme object is bridged in the file that defines it instead: the bridge `@use` goes after the last leading `@use` there, ahead of every `@import`, since Sass rejects a `@use` that follows one.|
|`angular.json`|theme chosen|The theme file added to the build styles, after the stylesheet that imports `cngx.css`.|
|App config, root NgModule or inline config in `main.ts`|per answer|`provideA11yPreferences(withPersistence())`, `provideDirection('rtl')` for a right-to-left source locale, `provideFeedback(withToasts(), withAlerts(), withBanners())`, `provideFloatingFallback(computePosition, [flip(), shift()])`, `provideCngxI18n(withPack(...))`.|
|`cngx-language.ts`|German with runtime switch|Next to the file holding the root providers (`src/cngx-language.ts` for an inline config in `main.ts`): a `cngxLanguagePack` signal. Set it to switch every cngx string at runtime. When the app already provides `provideCngxI18n(...)` without that signal, the provider is not rewritten: the file is still created and a note names the one edit, `withPack(cngxLanguagePack)` imported from `./cngx-language`.|
|ESLint flat config|lint rules|`...cngx.configs.recommended` in the exported array of `eslint.config.js`, `.mjs`, `.cjs`, `.ts`, `.mts` or `.cts`. It needs ESLint 9 or later and a TypeScript parser (`typescript-eslint`, `@typescript-eslint/parser` or `angular-eslint`): the cngx rules lint TypeScript through the app's own setup. The plugin also loads `@angular-eslint/template-parser` 19 or later; with `angular-eslint` declared it is added on that version line. Every case it cannot wire gets one note with the next command and no edit or dependency: ESLint below 9 (raise `eslint` to `^9` in devDependencies and reinstall; with `angular-eslint`, `ng update angular-eslint` moves its packages, without it `ng add angular-eslint` sets up ESLint 9), no flat config, no TypeScript parser or no template parser (`ng add angular-eslint`), a template parser line below 19 (`ng update angular-eslint`, or raise the parser itself), a legacy `.eslintrc*` config (`npx @eslint/migrate-config <file>`). Run `ng add @cngx/core` again afterwards. A config it cannot edit safely gets a note to add the entry by hand.|
|`.cngx/install.json`|always|The install manifest (below).|
|MCP configs, agent block, `.cngx/README.md`|editors chosen|See [AI tooling](#ai-tooling).|

Every generated source, style and Markdown file carries a provenance stamp
naming the step and the cngx release that wrote it. A file that already
exists and was not written by cngx is never overwritten; the step plans a note and leaves it to you.

---

## Tailwind

Tailwind v4 puts its rules in the cascade layers `theme`, `base`,
`components` and `utilities`, and declares them in the expanded body of the
global stylesheet. The CSS bundler places every imported file ahead of that
body, so `cngx.css` declares its layers first and every cngx layer ends up
below Tailwind. Preflight in `base` then zeroes the padding, margin and
border of every cngx component.

On a Tailwind v4 app the schematic writes `cngx-layers.css` next to the
first global stylesheet in the build `styles` and imports it there, before
every other import. The bundle starts with that file, so the order holds
even when Tailwind or a Material theme lives in another style entry:

```scss
@import './cngx-layers.css';
@import 'tailwindcss';
@import '@cngx/themes/cngx.css';
```

```css
@layer theme, base, cngx, components, utilities;
```

The resulting order is `theme, base, cngx.*, components, utilities, app`:
preflight stays below cngx, a utility class such as `p-8` on a cngx
component still wins, and your `app` layer comes last. Classes a Tailwind
plugin puts into `components` also beat cngx when both style the same
element; that is the consumer's class winning over the library default.

The statement has to live in its own file. Written inline at the top of
`styles.scss` it still lands after every imported file, so it comes too
late to order anything.

Tailwind v3 (`@tailwind base;` and friends) emits unlayered rules. They beat
every cngx layer, utilities and preflight alike, and no layer statement
changes that, so the schematic writes no file and plans a note instead.
Upgrading to v4 is the way to get preflight below cngx.

It also plans a note, and writes nothing, when no global stylesheet imports
`tailwindcss` directly (Tailwind behind another file of your own) or when a
`cngx-layers.css` it did not write is already there. Add the import by hand
in both cases.

Without the schematic, create the file and the import by hand as shown
above. Keep the import first in the first global stylesheet: after `@use`
and `@forward`, before any other `@import`.

---

## Previewing with `--dry-run`

```bash
ng add @cngx/ui --dry-run
```

When the package is not installed yet, the CLI has to install it before any
schematic runs, so a `--dry-run` on a fresh app shows only that dependency
step. Once a `@cngx/*` package is in `node_modules`, preview the full plan
with the generator directly:

```bash
ng g @cngx/core:ng-add --dry-run
```

---

## Package managers without peer auto-install, and `@cngx/utils`

npm installs peer dependencies, so `ng add @cngx/ui` finds `@cngx/core` in
place and runs the onboarding in the same process. Package managers that do
not install peers, and `ng add @cngx/utils` (which has no `@cngx/core` peer
by design), take a fallback path: the first run adds `@cngx/core`, installs,
then runs core's `ng add` as a follow-up task. That costs one extra install;
the questions and the result are the same.

---

## Running it again

`ng add` is safe to repeat. A change whose effect is already in place is
reported as skipped, so a second run on an onboarded app plans nothing and
writes nothing, `.cngx/install.json` included.

To add something later, run it again with the new answer:

```bash
ng add @cngx/core --feedback
```

A re-run with the preset the last install used starts from the answers it
recorded in `.cngx/install.json`: a run without flags or a terminal keeps
the German pack or the editors you chose earlier, and a question shows them
as its default. A flag or an answer in the terminal still changes one. A
re-run with another preset starts from that preset's defaults instead, and
the plan says so in a note.

A newer cngx release comes in through `ng update @cngx/core`, not through
`ng add` (see [Update](update.html)). `ng add @cngx/<package>@<newer>` on
an installed app installs one package at the new release while the rest of
the group stays on the old one, and npm refuses the mismatched
cross-package peers with `ERESOLVE`.

---

## The install manifest

`.cngx/install.json` records the inputs of the last real install: the cngx,
`@cngx/mcp` and `@cngx/eslint-plugin` versions, the Angular version, the
preset, every answer, and the steps that are satisfied, each with its
provenance. A `facts` snapshot of what detection saw is kept for reading; it
is never compared. Commit the file: `ng update` reads it to re-run the
recorded steps (see [Update](update.html)).

A manifest that was edited into a shape cngx does not recognise reads as no
previous install, and the next run writes a fresh one.

---

## AI tooling

For the editors picked in the AI tooling question (or passed with
`--ai-tools`; without a terminal the `full` preset picks every editor folder
it finds), the run registers the pinned `@cngx/mcp` server in each chosen
editor's project config, next to any server already there:

|Editor|MCP config|Instructions|
|-|-|-|
|Claude Code|`.mcp.json`|`CLAUDE.md` (root or `.claude/`) when one exists, else `AGENTS.md`|
|Cursor|`.cursor/mcp.json`|`AGENTS.md`|
|VS Code|`.vscode/mcp.json`|`AGENTS.md`|

The instruction file gets a block between `<!-- cngx:agents -->` and
`<!-- /cngx:agents -->` that tells the agent to ask the server instead of
guessing an API. An existing `cngx` server entry is never rewritten; when it
pins a different `@cngx/mcp` version, the plan list names both pins.

`.cngx/README.md` documents the setup: the installed packages, where the
server is configured, its tools, resources and prompts, how to check that it
runs, and how to turn it off. It is regenerated when its inputs change and is
never written over a file cngx did not generate.

Removing the `cngx` entry or the block is remembered through the manifest: a
later run, the `full` preset included, leaves them out, and the AI tooling
question no longer preselects that editor. Pick the editor in the question,
or name it, to bring them back:

```bash
ng add @cngx/core --ai-tools claude,vscode
```

[Agent Tooling](agent-tooling.html) describes what the server answers.

---

## Manual install

Without the schematic, install what your code imports and its peers:

```bash
npm install @cngx/ui @cngx/themes @angular/cdk
```

Import the default theme once in the global stylesheet:

```css
@import '@cngx/themes/cngx.css';
```

Then add the root providers you need to `app.config.ts`, for example
`provideA11yPreferences(withPersistence())` from `@cngx/core` and
`provideFeedback(withToasts())` from `@cngx/ui/feedback`. Add
`@angular/material` only if you import one of the `mat-*` entries.

---

## After the install

Run the doctor. It checks the project wiring a schematic cannot see from the
files alone, such as a toaster used without its root provider:

```bash
npx @cngx/doctor
```
