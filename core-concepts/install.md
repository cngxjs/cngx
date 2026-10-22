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
and `ng add @cngx/ui` run the same flow and produce the same files. The package
you name is always installed and recorded: `ng add @cngx/forms --libs core`
installs `core` and `forms`.

```bash
ng add @cngx/ui
```

The run reads the app first, asks only what it cannot detect, lists the
planned changes, applies them, prints a summary, and starts one package
install. Nothing outside the project is written.

## Supported Angular versions

Every `@cngx/*` package peers on Angular `>=21.1.0 <23.0.0`: Angular 21.1
through 22.x, with `@angular/cdk` and `@angular/material` on the same range.
The optional `@ngrx/signals` peer of `@cngx/interop` takes NgRx 21 or 22
(`^21.0.0 || ^22.0.0`): NgRx minors do not follow Angular's. 21.1 is the floor because Signal Forms only binds controls
through `[formField]` and focuses them through `focusBoundControl()` from 21.1
on, and `cngx-form-field` builds on both. Use the Node version your Angular
asks for: `^20.19 || ^22.12 || >=24` for Angular 21, `^22.22.3 || ^24.15 || >=26`
for Angular 22.

The preflight refuses an app below 21.1 and warns, without stopping, on an
Angular major above 22.

The `@angular/cdk` peer spans both majors, and npm installs a missing peer at
the newest version its range allows, which on an Angular 21 app is a CDK that
needs Angular 22. `ng add @cngx/core` declares the CDK at your app's Angular
range in the same install as the cngx packages. On an app without the CDK,
start with `ng add @cngx/core`, or install `@angular/cdk` at your Angular major
first (see [Manual install](#manual-install)): the CLI installs any other
`@cngx/*` package before its `ng add` runs, the same way a plain
`npm install` would, and that install would fetch the newer CDK. `@angular/material` is
never installed for you; the bridge only themes an app that already has it.

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
   changes, a missing repository, a missing git and a failing `git status`
   each get their own warn line, since the cngx changes then have no clean
   `git diff` to review against. The `package.json` and lockfile edits of
   the package install `ng add` runs first do not count, also when the app
   sits in a subfolder of its repository.
   The version comes from the installed `@angular/core`, else from the
   `@angular/core` range in `dependencies` or `devDependencies`; the line
   names the installed version when it read one, and says so when the
   installed `package.json` cannot be read. An app older
   than the supported Angular shows its failed line, then the run stops
   before anything is planned. A specifier that carries no version
   (`catalog:`, `workspace:*`, a dist-tag) with nothing installed is a warn
   line, and the run goes on; the `@angular/cdk` pin then becomes a note.
   An app on an Angular major above the highest one the `@cngx/core` peer
   range names gets a warn line right below the Angular line: the run goes
   on, but cngx has not been verified on that major.
   A project without a `build` target in `angular.json` fails its project
   line and stops the run the same way. In a workspace with several
   applications and no `--project`, the run takes `defaultProject`, else
   the first application; the project line is then a warn that names the
   pick and the other applications, and the run goes on. Pass
   `--project <name>` to choose. A local stylesheet listed under the build
   `styles` but missing on disk fails its own preflight line and stops the
   run before anything is planned or asked. A `package.json` that does not
   parse or an `angular.json` without projects stops the run with one line
   naming the file.
3. **Ask.** With a terminal attached it asks the open questions (below). A
   flag on the command line answers its question; without a terminal the
   preset answers, or on a re-run the answers the last install recorded.
4. **Plan.** Every step contributes changes to one plan. The list you see,
   the `--dry-run` output, the summary and the manifest are all read from
   that plan, so they cannot disagree. Notes (what a step refused or left to
   you) follow the list; they are not tasks. Before an `Apply these
   changes?` and under `--dry-run` the list prints as plain plan lines
   instead of ticked tasks, since nothing has run yet. The `@cngx/*`
   packages that move to one release read as one line (`Add 8 @cngx
   packages at <version>`), in the plan and in the steps already in place;
   packages that share a reason beyond the lockstep one keep it on that line
   (`utils, core; replaces ^0.0.9`), and packages with different reasons stay
   on their own lines;
   on a coloured terminal the markers and reasons
   take the Angular CLI's colours.
5. **Confirm.** An app that already has components beyond the root one
   (anywhere under its source root; `node_modules`, `.angular`, `.git` and
   `.cngx` are skipped at any depth, `dist`, `out-tsc` and `coverage` only
   directly under the source root, and spec and declaration files never
   count), its
   own providers, a config written into `bootstrapApplication(App, {...})`,
   or another UI library (Material, PrimeNG, Tailwind, Bootstrap) counts as
   existing and gets one `Apply these changes?` before anything is written.
   That question needs a terminal on both stdout and stdin, read the way the
   Angular CLI reads it (`CI=1` or `CI=true` counts as CI, `NG_FORCE_TTY`
   overrides both): under CI, without a terminal, or with
   `--no-prompts`, `--interactive=false` or `--defaults`, the plan applies
   and one line says which of them kept the question away. `--yes` skips the question and the line. A fresh app gets no
   confirmation.
6. **Apply and summarise.** The summary opens with `cngx applied <n>
   changes.` (`cngx planned <n> changes.` under `--dry-run`), counts the
   steps already in place and names the next steps. The plan list above it
   already named every change and note, so the summary does not repeat them;
   under `--quiet` the summary is all that prints (unless a confirmation
   follows: then the plan list prints first, so the question has something
   to answer) and lists the files touched,
   the notes (what a step refused or left to you) and the warnings, such as
   a local build without a usable `versions.json`. A planned change that found its edit already in the file
   when it ran (an import an earlier change wrote, say) counts as already in
   place, not as a change.
7. **Install.** One package install at the end, for every dependency the
   plan added.

---

## Presets

|Preset|What it sets up|
|-|-|
|`minimal`|The packages only. No theme, no lint rules, and no providers apart from `provideDirection('rtl')` for a right-to-left source locale. Asks none of the questions below; flags and the preset answer them.|
|`recommended` (default)|The packages, the theme, the accessibility preference providers and the lint rules.|
|`full`|`recommended` plus the root feedback services (toasts, alerts, banners), the popover positioning fallback, the cngx starter page in place of the Angular welcome page, and the MCP setup for every editor folder found in the project. English throughout; `--i18n de` adds the German pack.|

```bash
ng add @cngx/ui --preset=minimal
```

---

## Questions

The run asks only what detection leaves open, only with a terminal
attached, and after the preflight checklist has printed:

- **Preset.** Which preset to start from, unless `--preset` names one. It
  defaults to the preset this project's install record names, else
  `recommended`, and the same default applies without a terminal. `minimal`
  asks nothing after it.
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
  alerts and banners at the root, and place the toast and banner outlets in
  the root component so they have somewhere to render.
- **AI tooling.** Which editors (Claude Code, Cursor, VS Code) get the cngx
  MCP server. The editors the project shows signs of are preselected
  (`CLAUDE.md` or `.claude/` for Claude Code, `.cursorrules` or `.cursor/`
  for Cursor, `.vscode/` for VS Code), except one whose cngx server you
  removed since the last install. Without a terminal only `--preset=full`
  sets them up. Picking
  an editor here brings its removed server back, like `--ai-tools`. See
  [AI tooling](#ai-tooling).

---

## Flags

Every answer has a flag. A flag skips its question.

|Flag|Values|Effect|
|-|-|-|
|`--project`|a project name from `angular.json`|The application to onboard. Without it the run takes `defaultProject`, else the first application, and says which one it picked when there are several.|
|`--preset`|`minimal`, `recommended`, `full`|How much of the onboarding to apply.|
|`--libs`|`utils`, `core`, `common`, `interop`, `forms`, `data-display`, `ui`, comma-separated (`--libs core,forms`)|The packages to install. Default: all of them. `@cngx/themes` needs `core`, `common`, `forms`, `data-display` and `ui` (`cngx.css` imports their CSS); a set without one of them gets a note naming the missing packages and no theme.|
|`--theme`|`cngx`, `material`, `none`|The generated theme file.|
|`--i18n`|`en`, `de`|The built-in copy.|
|`--runtime-switch`|`--runtime-switch`, `--no-runtime-switch`|Wire the language pack for switching at runtime.|
|`--lint`|`--lint`, `--no-lint`|Add `@cngx/eslint-plugin` to the flat config.|
|`--a11y-preferences`|`--a11y-preferences`, `--no-a11y-preferences`|Provide the density, text scale, motion and contrast axes with persistence.|
|`--feedback`|`--feedback`, `--no-feedback`|Provide toasts, alerts and banners at the root (needs `@cngx/ui`).|
|`--floating-fallback`|`--floating-fallback`, `--no-floating-fallback`|Install `@floating-ui/dom` and provide the popover positioning fallback (needs `@cngx/common`).|
|`--starter`|`--starter`, `--no-starter`|Replace the Angular welcome page of an untouched `ng new` standalone app with the cngx starter page. On by default with `--preset=full` only, never asked.|
|`--ai-tools`|`claude`, `cursor`, `vscode`, comma-separated (`--ai-tools claude,vscode`)|The editors to set up the cngx MCP server and agent instructions for. Answers the AI tooling question.|
|`--yes`|`--yes`|Apply to an existing app without the confirmation.|
|`--prompts`|`--prompts`, `--no-prompts`, default `true`|`--no-prompts` answers every question from flags, the recorded answers of a re-run and the preset defaults.|
|`--interactive`, `--defaults`|`--interactive=false`, `--no-interactive`, `--defaults`|Angular CLI flags; either one also turns the schematic's questions off, like `--no-prompts`.|
|`--quiet`|`--quiet`|Print only the summary, not the planned changes; an existing app asked to confirm still sees the plan first.|

A boolean flag also takes `=true` or `=false` (`--lint=false`). A list flag
takes its values in one comma-separated argument: repeating the flag
(`--libs core --libs forms`) or separating the values with spaces
(`--libs core forms`) keeps only the last value. A value outside a flag's
list, an empty entry (`--libs core,,ui`) or an entry given twice stops the
run before anything is planned, with one line naming the flag and the
values it takes.

For CI and scripted runs, pass the answers and skip the questions:

```bash
ng add @cngx/ui --preset=recommended --no-prompts --yes --skip-confirmation
```

`--skip-confirmation` belongs to the Angular CLI (it skips the CLI's own
install prompt); `--yes` skips the schematic's confirmation on an existing
app. A run without a terminal never asks, so `--no-prompts` matters mostly
under a pseudo-terminal. The CLI's `--interactive=false` and `--defaults`
turn the questions off the same way.

---

## What it writes

|Target|When|What|
|-|-|-|
|`package.json`|always|Every selected `@cngx/*` package and its peers, pinned to the exact release; `@cngx/themes` when a theme is chosen; `@angular/cdk` at the app's Angular range when a package needs it (behind `catalog:` or `workspace:*`, at the installed Angular's `major.minor`); `@floating-ui/dom` for the fallback; `@cngx/eslint-plugin` as a devDependency for the lint rules, and `@angular-eslint/template-parser` on the `angular-eslint` version line when the app declares `angular-eslint` 19 or later but not the parser. `@angular/material` is never added.|
|Global styles|theme chosen|An import of `@cngx/themes/cngx.css` ahead of every cngx layer.|
|`cngx-layers.css`|theme chosen, Tailwind v4|Next to the first global stylesheet of the build: one `@layer` statement that puts the cngx layers between Tailwind preflight and the Tailwind utilities. See [Tailwind](#tailwind).|
|First global stylesheet|theme chosen, Tailwind v4|An import of `./cngx-layers.css` before every other `@import`.|
|`src/cngx-theme.css`|cngx theme|Every system token, commented out at its default, with what it controls. Uncomment a token to override it.|
|`src/cngx-theme.scss`|Material theme with a `mat.theme()` map|The bridge from the Material system tokens to the cngx tokens. A `define-theme` or M2 theme object is bridged in the file that defines it instead: the bridge `@use` goes after the last leading `@use` there, ahead of every `@import`, since Sass rejects a `@use` that follows one.|
|`angular.json`|theme chosen|The theme file added to the build styles, after the stylesheet that imports `cngx.css`.|
|App config, root NgModule or inline config in `main.ts`|per answer|`provideA11yPreferences(withPersistence())`, `provideDirection('rtl')` for a right-to-left source locale, `provideFeedback(withToasts(), withAlerts(), withBanners())`, `provideFloatingFallback(computePosition, [flip(), shift()])`, `provideCngxI18n(withPack(...))`.|
|Root component template and its `imports`|feedback|`<cngx-banner-outlet />` as the first line above the `ng new` placeholder block, so it shows above the welcome page instead of below it, and `<cngx-toast-outlet />` at the end after the block, so deleting the placeholder below its opening comment keeps both; without that block the banner outlet goes right above `<router-outlet>`, else at the end; `CngxBannerOutlet` and `CngxToastOutlet` from `@cngx/ui/feedback` in the component `imports`, or in the root NgModule `imports` of an NgModule app. Only where the spec next to the root component stays green: none, the untouched standalone `ng new` spec, or the untouched `ng new --standalone=false` spec with `@angular/build` 21; next to any other spec, and next to any NgModule spec without that build, cngx leaves both outlets out with a note. Placed once; an outlet you remove after the install stays out until you pass `--feedback` again, and once an install placed them cngx does not ask for them again, also when it can no longer edit the root component; a note then says that they were removed, or, where it cannot read the template any more, why it cannot tell. A root component cngx cannot follow from `main.ts` or cannot edit safely gets a note with the snippet and the reason instead, see [Outlets left to you](#outlets-left-to-you). Alert stacks are not placed: they are scoped, so they go where the alerts belong. `ng update` only notes a missing outlet.|
|`src/app/app.ts`, `app.html`, `app.css` or `app.scss`|`full` (or `--starter`), untouched `ng new` standalone app|The cngx starter page in place of the Angular welcome page: the `Hello, <name>` heading and `title` signal the stock spec asserts, a card for each thing the answers installed to try (toasts, banners and an alert with feedback, the accessibility panel with the a11y preferences, an English and German toggle with the runtime language switch), the toast and banner outlets with feedback, and `<router-outlet />` with routing. Written only over the exact `ng new` scaffold, see [The starter page](#the-starter-page).|
|Global styles|starter written|The starter's page styles at the end, after a `cngx:fingerprint` line: `body { margin: 0 }`, the headings, the top bar and the footer, every rule scoped under `<root selector> > .shell`. They live here so the component stylesheet stays inside the 4 kB component style budget of `ng new`.|
|`public/favicon.svg`, `src/index.html`|starter written, `index.html` untouched, no `favicon.svg` yet|The cngx mark as the app icon, and the icon link pointed at it instead of `favicon.ico`, which stays on disk.|
|`app.spec.ts` of the root component|feedback, unedited `ng new` spec|`providers: [provideFeedback(withToasts(), withBanners())]` in its `TestBed.configureTestingModule`, so the stock spec still renders `App` with the outlets in it. The `ng new --standalone=false` spec declares `App` in that TestBed, so it also gets `CngxBannerOutlet` and `CngxToastOutlet` in the TestBed `imports`, and both import lines; only with `@angular/build` 21. Next to any other spec cngx places no outlet, see [Outlets left to you](#outlets-left-to-you).|
|`cngx-language.ts`|German with runtime switch|Next to the file holding the root providers (`src/cngx-language.ts` for an inline config in `main.ts`): a `cngxLanguagePack` signal. Set it to switch every cngx string at runtime. When the app already provides `provideCngxI18n(...)` without that signal, the provider is not rewritten: the file is still created and a note names the one edit, `withPack(cngxLanguagePack)` imported from `./cngx-language`.|
|ESLint flat config|lint rules|`...cngx.configs.recommended` in the exported array of `eslint.config.js`, `.mjs`, `.cjs`, `.ts`, `.mts` or `.cts`, the one in the project root first, else the workspace one. A commented-out plugin import does not count as wired. It needs ESLint 9 or later and a TypeScript parser (`typescript-eslint`, `@typescript-eslint/parser` or `angular-eslint`): the cngx rules lint TypeScript through the app's own setup. The plugin also loads `@angular-eslint/template-parser` 19 or later; with `angular-eslint` declared it is added on that version line. Every case it cannot wire gets one note with the next command and no edit or dependency: ESLint below 9 (raise `eslint` to `^9` in devDependencies and reinstall; with `angular-eslint`, `ng update angular-eslint` moves its packages, without it `ng add angular-eslint` sets up ESLint 9), no flat config, no TypeScript parser or no template parser (`ng add angular-eslint`), a template parser line below 19 (`ng update angular-eslint`, or raise the parser itself), a legacy `.eslintrc*` config (`npx @eslint/migrate-config <file>`). Run `ng add @cngx/core` again afterwards. A config it cannot edit safely gets a note to add the entry by hand.|
|`.cngx/install.json`|always|The install manifest (below).|
|MCP configs, agent block, `.cngx/README.md`|editors chosen|See [AI tooling](#ai-tooling).|

Every generated source, style and Markdown file carries a provenance stamp
naming the step and the cngx release that wrote it. A file that already
exists and was not written by cngx is never overwritten; the step plans a note and leaves it to you.

---

## The starter page

`--preset=full` replaces the Angular welcome page with a cngx starter page
that shows what the run installed, working. It writes it only when all of
these hold, and leaves the app as `ng new` wrote it otherwise:

- The app is standalone. An NgModule app gets the outlets only, without a
  spec next to its root component or next to the untouched
  `ng new --standalone=false` spec on `@angular/build` 21.
- `src/app/app.ts`, `app.html` and the stylesheet are exactly what `ng new`
  wrote with Angular CLI 21 or 22 (routing on or off, CSS or SCSS), compared
  after the project name and selector are put in and line endings
  normalised; a Prettier pass over them is fine, one changed character is
  not. An app created on CLI 21 and updated to 22 keeps its 21 files, and
  those count too. An inline template, inline styles, Sass or Less never
  match. The files are checked again right before they are written.
- `src/app/app.spec.ts` is the spec `ng new` wrote with either CLI, that
  spec with the feedback providers cngx adds, or missing; any other spec
  keeps the welcome page it tests.
- The global stylesheet is what `ng new` wrote (CSS or SCSS), the cngx
  theme import aside, so a `recommended` install before still counts.
- `@cngx/common` and `@cngx/ui` are selected.
- `--starter=false` (or `--no-starter`) is not passed. The other presets
  leave the starter off unless `--starter` is passed.

The page is English. It is yours to edit: each file records a
`cngx:fingerprint` line, so a re-run recognises its own starter, also after
your formatter rewrote it, and never writes it again. A starter you replaced
stays replaced, and `ng update` never writes or restores one. When the
starter is written, the outlets come with it; the stock `app.spec.ts` still
gets the feedback providers. Every other case is in
[Starter left out](#starter-left-out).

---

## Outlets left to you

cngx places the outlets only where it can run the edit and read the result
back: before it writes, it applies the exact edit to the template and the
`imports` host in memory and checks that both outlets and both classes are
there and every edited source still parses. Everywhere else it writes
nothing into the component, its template or its spec, and the note names
the snippet and one of these reasons, with the class and the file it
stopped at for `<Class>` and `<file>`:

- `<file> does not exist`: the `browser` (or `main`) entry of the build target points at no file.
- `<file> has no bootstrapApplication(<Component>) or bootstrapModule(<NgModule>) call cngx can read`: the call is missing, commented out, or bootstraps something other than a class name.
- `<Class>, bootstrapped from <file>, is declared neither there nor in a file a relative import leads to`: the class comes from a package or a path alias, or a re-export cngx does not follow (an aliased one, or more than four hops).
- `<Class> in <file> has no @NgModule decorator`: the root NgModule carries no `@NgModule(...)` cngx can read.
- `the @NgModule decorator of <Class> in <file> lists no bootstrap component`: `bootstrap: [App]` is missing or not an array literal.
- `<Class> in <file> has no @Component decorator`: the root component carries no `@Component(...)`, for example one called through a namespace (`@core.Component`).
- `the decorator of <Class> in <file> takes no object literal`: the decorator takes a variable or a call.
- `the decorator of <Class> in <file> holds a spread, a computed key or a numeric key, so cngx cannot tell what it sets`: `...shared`, `['imports']` or `1: true` in the decorator object.
- `the decorator of <Class> in <file> is written twice or sets a property more than once`: two `@Component` or `@NgModule` decorators, or a key such as `imports` written twice.
- `the @Component decorator of <Class> in <file> sets neither template nor templateUrl`.
- `the @Component decorator of <Class> in <file> sets both template and templateUrl`.
- `the template or templateUrl of <Class> in <file> is not a string literal`: a constant or an expression.
- `the inline template of <Class> in <file> interpolates ${...}, which cngx does not edit as text`.
- `<file>, the templateUrl of <Class>, does not exist`.
- `the template of <Class> in <file> does not parse as an Angular template`: also a template the outlets do not read back in after the edit.
- `the inline template of <Class> in <file> is a quoted string, which cngx does not rewrite into a multi-line template`: a `'...'` or `"..."` template that lacks an outlet; a backtick template is edited in place.
- `the imports of <Class> in <file> are not a plain array literal`: `imports: SHARED`, a shorthand `imports`, or `imports: [...] as const`; also an `imports` array the classes do not read back in after the edit.
- `<file> does not parse as TypeScript, so cngx edits neither it nor <Class>`: the root component or the root NgModule has a syntax error; cngx reads such a file only as far as the parser recovers, so it does not write into it.
- `<Class> in <file> is bound to something other than the <Class> class of @cngx/ui/feedback`: the file already declares (a namespace or an interface included) or imports a `CngxBannerOutlet` or `CngxToastOutlet` of its own, also another `@cngx/ui/feedback` export aliased to that name or the whole entry imported under it.

The spec next to the root component counts too. cngx edits two specs: the
untouched standalone `ng new` spec gets the feedback providers, and the
untouched `ng new --standalone=false` spec, which declares `App` in its own
TestBed, also gets `CngxBannerOutlet` and `CngxToastOutlet` in that
TestBed's `imports`. When the spec is neither of them nor one of them as
cngx left it, cngx places no outlet and edits no spec, since the outlets
would inject `CngxToaster` and `CngxBanner` into a TestBed that may not
provide them and `ng test` would fail. The note then reads
`<file> is not an untouched ng new spec, so cngx places no outlet a TestBed there may lack`,
followed by the outlets snippet and what the spec needs. A missing spec is
no reason to stop.

The NgModule spec is edited only where `@angular/build` 21 is installed,
or, before the install, where `package.json` declares a range that admits
major 21 alone (`^21.2.0`, `~21.2.3`, `21.2.3`). From 22.2 its unit-test
builder compiles only the specs and what they import, so `App` compiles
without `AppModule` and every element from it, `<router-outlet>` and the
outlets alike, is unknown
([angular/angular-cli#34231](https://github.com/angular/angular-cli/issues/34231)).
The fix is set for 22.3; cngx keeps 22 closed until it has run that
release. Anywhere else, an installed manifest it cannot read and a range
that spans majors included, the NgModule spec gets no outlet, a custom one
too, and the note reads
`<file> belongs to an NgModule app without @angular/build 21 installed; from 22.2 its unit-test builder compiles the root component there without its NgModule (angular/angular-cli#34231), so cngx places no outlet`,
followed by the snippet, what the TestBed needs and the import of the root
NgModule to add to the spec (`import './app-module';`), which lets the test
build compile `App` with it.

Fix what the reason names and run `ng add @cngx/core --feedback` again, or
paste the snippet yourself.

---

## Starter left out

The starter is written only over the untouched `ng new` scaffold. Where it
is not, cngx writes nothing into the App component, its template, its
stylesheet, `index.html` or the public folder, and a note names one of
these reasons, with the file for `<file>`:

- `the starter composes @cngx/common and @cngx/ui; select both to get it`: `--libs` left one of them out.
- `<file>, its template or its stylesheet is not the untouched ng new scaffold, so the starter is not written over it`: one character differs from what `ng new` wrote, the template or the styles are inline, or the stylesheet is Sass or Less.
- `<file> is not the untouched ng new global stylesheet, so the starter, whose page styles go there, is not written`: the global stylesheet holds more than what `ng new` wrote and the cngx theme import.
- `the build lists no global stylesheet, so the starter, whose page styles go there, is not written`.
- `<file> is not the untouched ng new spec, so the starter, which replaces the page that spec renders, is not written`: the spec next to the root component differs from what `ng new` wrote (the feedback providers cngx adds aside).
- `<file> holds the cngx starter of an earlier run with other answers; cngx does not rewrite it`: a re-run with other answers (feedback, a11y preferences, the runtime language switch) keeps the starter it finds.
- `<file> is not the untouched ng new file, so the starter leaves its icon link and favicon.svg alone`: the starter is written, the icon stays Angular's.
- `<file> exists and is not the cngx favicon, so the starter leaves it and the icon link alone`: the public folder already holds a `favicon.svg`.
- `the build copies no public folder, so the starter leaves the icon link and favicon.svg alone`: the build `assets` list no folder copied as a whole.

A starter an earlier install wrote and you replaced since is skipped
without a note.

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

The package reads the installed `@cngx/core` version first. An older core is
replaced the same way: the package pins core to its own release, installs,
and runs the new core's `ng add`, all in one `ng add`. A newer core is never
downgraded: the run says so and follows the installed core, which pins every
selected package to its own release.

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

A re-run never removes a package. The libs the last install recorded and
every `@cngx/<lib>` the app's `package.json` declares are the floor: a
narrower `--libs` adds nothing to remove, and the plan says which packages it
keeps (`Keep the recorded packages`). A package that is only a peer of the
others is installed through them and not recorded. `@cngx/themes`,
`@cngx/mcp` and `@cngx/eslint-plugin` are no lib: the theme answer and the
tooling steps decide them. To remove a package, delete it from `package.json`
and from `projects.<name>.answers.libs` in `.cngx/install.json`.

A newer cngx release comes in through `ng update @cngx/core`, not through
`ng add` (see [Update](update.html)). `ng add @cngx/<package>@<newer>` on
an installed app installs one package at the new release while the rest of
the group stays on the old one, and npm refuses the mismatched
cross-package peers with `ERESOLVE`.

---

## The install manifest

`.cngx/install.json` holds one record per project, under `projects`, keyed
by the project name in `angular.json`:

```json
{
  "schemaVersion": 2,
  "projects": {
    "my-app": { "cngxVersion": "...", "preset": "recommended", "answers": {}, "steps": [] }
  }
}
```

Each record keeps the inputs of that project's last real install: the cngx,
`@cngx/mcp` and `@cngx/eslint-plugin` versions, the Angular version, the
preset, every answer, and the steps that are satisfied, each with its
provenance. A `facts` snapshot of what detection saw is kept for reading; it
is never compared. `ng add --project <name>` writes only that project's
record and leaves the others as they are. What is shared by the workspace,
`package.json`, `.cngx/README.md` and the editor configs, follows every
record: the README lists the libs of all of them. Commit the file: `ng update`
reads it to re-run the recorded steps of every project (see
[Update](update.html)).

A file cngx cannot read (hand-edited into another shape, cut off, or from an
earlier schema) is never taken for a missing one. `ng add` keeps it as
`.cngx/install.json.unreadable` (`-2`, `-3` when that name is taken), starts
the file over with a record of the current project only, and says so in the
plan (`Start a new install record`), naming the reason: not UTF-8 text, not
valid JSON, or not an install record this release reads. `ng update` names
it with the same reason and leaves it alone.

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

Without the schematic, install the CDK (and Material, if you use a `mat-*`
entry) at your Angular major first, then what your code imports:

```bash
npm install @angular/cdk@^21     # your Angular major: ^21 or ^22
npm install @cngx/ui @cngx/themes
```

In one command, npm would resolve the CDK the cngx packages peer on to the
newest release their range allows, which may need a newer Angular than yours.

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
