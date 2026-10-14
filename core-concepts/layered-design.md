<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Layered Design

<aside class="cc-tldr">

Five levels. Imports flow upward only. Sheriff and ESLint enforce it at lint time.

</aside>

CNGX is organized into five levels (0 through 4). Each level has a specific dependency budget, a specific scope, and a specific reason to exist.

The hierarchy is enforced in two places:

- Sheriff, via the workspace-root `sheriff.config.ts` (the single decision point for per-library import allow-lists).
- `no-restricted-imports` blocks in `eslint.config.js`, which carry the external-package constraints Sheriff cannot express.

A cross-level violation fails the lint stage in CI.

---

## The five levels

### Level table

|Level|Library|What lives here|
|-|-|-|
|0|`@cngx/utils`|Framework-agnostic utilities. Source files import zero `@angular/*` packages. Pure functions, types, tree helpers, RxJS interop helpers.|
|1|`@cngx/core`|Angular-aware primitives that do not render. DI tokens, coercion helpers, async state machine, transition tracker, selection controller, key combos.|
|2|`@cngx/common`|Atoms and molecules, plus pure-CNGX organisms. Single-responsibility directives across a11y, interactive, popover, display, card, data, dialog, layout, chart, tabs, stepper. CDK touched in exactly two spots (`a11y/focus-trap`, `data/data-source`). Never imports `@angular/material`.|
|3|`@cngx/forms`, `@cngx/data-display`, `@cngx/interop`|Organisms in a feature domain, plus the bridges from external async ecosystems. `@cngx/forms` (controls, validators, field bridges, select family, filter-builder, input) has zero CDK touchpoints. `@cngx/data-display/treetable` uses `@angular/cdk/table`; selection and expansion are signal models. `@cngx/interop` projects TanStack Query results (`query`) and NgRx SignalStore state (`signals`) onto `CngxAsyncState`. None of them imports `@angular/material`.|
|4|`@cngx/ui`|The organism layer, 26 secondary entries. CDK and Material are opt-in per entry: CDK in `overlay` (via `cdk/overlay` + `cdk/portal`) and `sidenav`, Material in the four bridges `mat-accordion`, `mat-paginator`, `mat-stepper`, `mat-tabs`. The other twenty entries need neither CDK nor Material.|

---

## Dependency direction

Imports flow strictly upward.

Level N may import Levels 0 through N-1. Never Levels N+1 or higher.

### Graph

<div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 640" width="100%">
  <title>@cngx package dependency graph</title>
  <desc>Seven published packages. ui at the top in L4, forms / interop / data-display in L3, common in L2, core in L1, utils at the base in L0. Arrows point downward, encoding import direction.</desc>
  <defs>
    <marker id="arrow-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#1D9E75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#7F7C70" stroke-opacity="0.7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <g font-family="-apple-system, system-ui, sans-serif" font-size="12" fill="#85827A" opacity="0.7" text-anchor="middle" dominant-baseline="central">
    <text x="56" y="88">L4</text>
    <text x="56" y="208">L3</text>
    <text x="56" y="328">L2</text>
    <text x="56" y="448">L1</text>
    <text x="56" y="568">L0</text>
  </g>
  <g stroke="#9A978C" stroke-opacity="0.4" stroke-width="0.5" stroke-dasharray="4,6">
    <line x1="76" y1="148" x2="624" y2="148"/>
    <line x1="76" y1="268" x2="624" y2="268"/>
    <line x1="76" y1="388" x2="624" y2="388"/>
    <line x1="76" y1="508" x2="624" y2="508"/>
  </g>
  <g fill="none" stroke-width="1">
    <line x1="270" y1="116" x2="170" y2="180" stroke="#1D9E75" stroke-opacity="0.7" marker-end="url(#arrow-teal)"/>
    <line x1="340" y1="116" x2="340" y2="180" stroke="#1D9E75" stroke-opacity="0.7" marker-end="url(#arrow-teal)"/>
    <line x1="410" y1="116" x2="510" y2="180" stroke="#1D9E75" stroke-opacity="0.7" marker-end="url(#arrow-teal)"/>
    <line x1="110" y1="236" x2="300" y2="300" stroke="#7F7C70" stroke-opacity="0.55" marker-end="url(#arrow-gray)"/>
    <line x1="570" y1="236" x2="380" y2="300" stroke="#7F7C70" stroke-opacity="0.55" marker-end="url(#arrow-gray)"/>
    <line x1="340" y1="236" x2="340" y2="300" stroke="#7F7C70" stroke-opacity="0.55" marker-end="url(#arrow-gray)"/>
    <line x1="340" y1="356" x2="340" y2="420" stroke="#7F7C70" stroke-opacity="0.55" marker-end="url(#arrow-gray)"/>
    <line x1="340" y1="476" x2="340" y2="540" stroke="#7F7C70" stroke-opacity="0.55" marker-end="url(#arrow-gray)"/>
  </g>
  <g font-family="-apple-system, system-ui, sans-serif" text-anchor="middle" dominant-baseline="central">
    <g>
      <rect x="240" y="60" width="200" height="56" rx="8" fill="#085041" stroke="#5DCAA5" stroke-width="0.5"/>
      <text x="340" y="82" font-size="14" font-weight="500" fill="#9FE1CB">@cngx/ui</text>
      <text x="340" y="100" font-size="12" fill="#5DCAA5">Organisms, CDK/Material opt-in</text>
    </g>
    <g>
      <rect x="10" y="180" width="200" height="56" rx="8" fill="#3C3489" stroke="#AFA9EC" stroke-width="0.5"/>
      <text x="110" y="202" font-size="14" font-weight="500" fill="#CECBF6">@cngx/forms</text>
      <text x="110" y="220" font-size="12" fill="#AFA9EC">Selects, validators, field</text>
    </g>
    <g>
      <rect x="240" y="180" width="200" height="56" rx="8" fill="#3C3489" stroke="#AFA9EC" stroke-width="0.5"/>
      <text x="340" y="202" font-size="14" font-weight="500" fill="#CECBF6">@cngx/interop</text>
      <text x="340" y="220" font-size="12" fill="#AFA9EC">TanStack, NgRx bridges</text>
    </g>
    <g>
      <rect x="470" y="180" width="200" height="56" rx="8" fill="#3C3489" stroke="#AFA9EC" stroke-width="0.5"/>
      <text x="570" y="202" font-size="14" font-weight="500" fill="#CECBF6">@cngx/data-display</text>
      <text x="570" y="220" font-size="12" fill="#AFA9EC">Treetable, cdk/table</text>
    </g>
    <g>
      <rect x="240" y="300" width="200" height="56" rx="8" fill="#712B13" stroke="#F0997B" stroke-width="0.5"/>
      <text x="340" y="322" font-size="14" font-weight="500" fill="#F5C4B3">@cngx/common</text>
      <text x="340" y="340" font-size="12" fill="#F0997B">Atoms + molecules, signals</text>
    </g>
    <g>
      <rect x="240" y="420" width="200" height="56" rx="8" fill="#444441" stroke="#B4B2A9" stroke-width="0.5"/>
      <text x="340" y="442" font-size="14" font-weight="500" fill="#D3D1C7">@cngx/core</text>
      <text x="340" y="460" font-size="12" fill="#B4B2A9">Tokens, primitives, async</text>
    </g>
    <g>
      <rect x="240" y="540" width="200" height="56" rx="8" fill="#444441" stroke="#B4B2A9" stroke-width="0.5"/>
      <text x="340" y="562" font-size="14" font-weight="500" fill="#D3D1C7">@cngx/utils</text>
      <text x="340" y="580" font-size="12" fill="#B4B2A9">Pure TS, tree, signals</text>
    </g>
  </g>
</svg>

</div>

### Level 0 - `@cngx/utils`

`@cngx/utils` has no Angular runtime dependency. Source files contain no `@angular/*` imports.

It can be lifted into any TypeScript context (Node scripts, tests, framework-agnostic packages). The package still declares `@angular/core` as a peer dep for version-alignment hygiene with the rest of the workspace.

### Level 1 - `@cngx/core`

`@cngx/core` adds Angular but does not render.

It is the home of:

- DI tokens (`CNGX_STATEFUL`, `CNGX_SELECTION_CONTROLLER_FACTORY`, ...)
- The `CngxAsyncState` shape
- `createTransitionTracker`, `createSelectionController`, and other plain factories

### Level 2 - `@cngx/common`

`@cngx/common` is where atoms live. An atom is a single-behavior directive that derives one aspect of the design system and communicates it via ARIA and CSS custom properties.

Examples: `CngxRovingTabindex`, `CngxFocusTrap`, `CngxListbox`, `CngxPopover`, `CngxIcon`, `CngxChip`, `CngxCheckboxIndicator`.

Two atoms intentionally reach into CDK because there is no cheaper way to express the contract:

- `CngxFocusTrap` wraps CDK's `FocusTrap`.
- The data-source surface uses CDK's `DataSource` base class.

Material is forbidden by ESLint at this level.

### Level 3 - `@cngx/forms`, `@cngx/data-display` and `@cngx/interop`

`@cngx/forms` and `@cngx/data-display` host **organisms in a feature domain**. `@cngx/interop` sits beside them and bridges external async ecosystems into the cngx async contract.

The select family (`@cngx/forms/select`) composes `CngxListbox`, `CngxActiveDescendant`, `CngxPopover`, `CngxFormFieldPresenter`, and several factories into nine self-contained dropdown surfaces:

- `CngxSelect`
- `CngxMultiSelect`
- `CngxCombobox`
- `CngxTypeahead`
- `CngxTreeSelect`
- `CngxReorderableMultiSelect`
- `CngxActionSelect`
- `CngxActionMultiSelect`
- The consumer-assembled `CngxSelectShell`

`@cngx/forms` has zero CDK touchpoints. Listbox keyboard handling, active-descendant, and selection state are hand-rolled on top of `@cngx/common` primitives.

`@cngx/data-display/treetable` is the one place where CDK earns its weight at Level 3. It consumes `@angular/cdk/table`; selection and expansion are signal models (`model<ReadonlySet<string>>`).

`@cngx/interop` ships two entries, each an adapter onto `CngxAsyncState`:

- `query` - `fromQuery` projects a TanStack Query result.
- `signals` - `withCngxAsyncState` is an `@ngrx/signals` store feature.

Both foreign packages are optional peer dependencies. The adapters render nothing; every cngx async surface consumes their output natively.

None of the three libs imports `@angular/material`.

### Level 4 - `@cngx/ui`

`@cngx/ui` is the organism layer. Its 26 secondary entries compose atoms and molecules from the lower levels into self-contained features: layout, overlay, feedback, stepper, tabs, accordion, paginator, sidenav, breadcrumb, timeline, command palette, data-grid accordion and more.

It is also the only lib that may import `@angular/material`, and the opt-in is per entry:

- Material: the four bridges `mat-accordion`, `mat-paginator`, `mat-stepper`, `mat-tabs`. Each one re-uses the brain of its pure-CNGX twin.
- CDK: `overlay` uses `cdk/overlay` + `cdk/portal` as its engine, `sidenav` takes its focus trap from `cdk/a11y`.

The remaining twenty entries need neither CDK nor Material.

<aside class="cc-note">

**Note.** An atom or molecule does not belong in `@cngx/ui`, whatever toolkit it touches. It belongs in `@cngx/common`. An entry lives in `@cngx/ui` because it is an organism, not because it uses CDK or Material.

</aside>

---

## Lib identity rule

A library is defined by **what it hosts**, not by which framework toolkit it happens to use:

### Per-lib charter

- **`@cngx/common`** - atoms, molecules, plus pure-CNGX organisms that do not fit a feature domain (e.g. `CngxMenu`, `CngxChart`).

    CDK in exactly two spots (`a11y/focus-trap`, `data/data-source`). Never imports `@angular/material`.
- **`@cngx/forms`** - forms-related organisms (controls, validators, field bridges, the entire select family, filter-builder, input).

    Zero CDK touchpoints across the lib. Listbox/active-descendant/selection state is rolled by hand on top of `@cngx/common`.
- **`@cngx/data-display`** - organisms whose job is to display tabular or hierarchical data. `treetable` uses `@angular/cdk/table`; selection is a signal model. Never imports `@angular/material`.
- **`@cngx/interop`** - adapters from external async ecosystems (TanStack Query, NgRx SignalStore) onto `CngxAsyncState`. No UI.
- **`@cngx/ui`** - the organism layer. CDK in `overlay` and `sidenav`. Material only in the four bridges `mat-accordion`, `mat-paginator`, `mat-stepper`, `mat-tabs`.

### Placement test

A pure-CNGX data-display organism without a Material twin belongs in `@cngx/data-display`, not `@cngx/ui`.

Conversely, a Forms-related organism that happens to wrap a Material control belongs in `@cngx/forms`, with the Material import isolated behind a bridge.

---

## Atomic levels inside a lib

Within a single library, components are classified by composition depth:

### Classification

- **Atom** - one directive, one responsibility. No CDK, no Material. Reads inputs, derives outputs, contributes to host ARIA. Example: `CngxRovingTabindex`, `CngxListbox`, `CngxCheckboxIndicator`.
- **Molecule** - composes atoms (and possibly CDK utilities) to produce a small, focused behavior. Example: `CngxListboxTrigger` (combines listbox + popover anchor + ARIA wiring).
- **Organism** - composes molecules and atoms into a self-contained feature unit. Has its own template, often its own panel, its own state surface. Example: `CngxSelect`, `CngxTreeSelect`, `CngxTreetable`.

### Decompose scope

**Only organisms are decompose-eligible.**

The atomic-decompose schematic ejects the structural and thematic CSS of an organism into the consumer's project. The brain (host directive, DI tokens, factories) stays in the library.

Atoms and molecules are terminal. Copying them adds no value because they have no skin to eject.

---

## Secondary entries

Every library is shipped via `ng-packagr` with `sideEffects: false`.

Each feature folder is its own ng-packagr secondary entry, with its own `ng-package.json` and `public-api.ts`. This lets consumers import surgically:

### Import shape

```typescript
import { CngxListbox } from '@cngx/common/interactive';
import { CngxSelect } from '@cngx/forms/select';
import { CngxSidenav } from '@cngx/ui/sidenav';
```

### Path alias source of truth

The path alias map in `tsconfig.base.json` is the **single source of truth**.

Each `tsconfig.lib.json` redirects intra-lib cross-secondary imports to the built `dist/<lib>/types/*.d.ts` so that the AOT compiler does not pull in unbuilt TypeScript.

---

## Build order

### Pipeline

```
utils -> core -> common -> interop -> forms -> data-display -> ui -> themes
```

### Sheriff classification

`npm run build:libs` runs them in this order. The local `examples` app consumes the source via tsconfig paths; production consumers consume the built `dist/` bundles.

The Sheriff `<entry>` wildcards in `sheriff.config.ts` auto-classify new secondaries. Adding a new feature folder under `projects/common/<name>` does not require a Sheriff config change.

Only the per-lib `lib:*` rules need an update when a brand-new top-level library is introduced.

---

## Why the levels exist

The hierarchy is not bureaucracy. It is a **dependency budget**:

### Budget per level

- `@cngx/utils` can never break SSR, never depend on the DOM, never require a runtime. It can be unit-tested with Vitest against bare Node.
- `@cngx/core` can never render. If it tried, it would need a template, which would tie it to `@angular/core`'s renderer surface and pull it out of "primitive" territory.
- `@cngx/common` and `@cngx/data-display` can never depend on Material.

    The `no-restricted-imports` block in `eslint.config.js` fails the lint stage on any `@angular/material` import.

    The rule exists because Material is heavy, opinionated, and changes on its own schedule. CNGX atoms and data-display organisms must remain portable across Material's lifecycle.
- `@cngx/ui` is the only place where Material's API drift can land, and even there only the four bridges `mat-accordion`, `mat-paginator`, `mat-stepper`, `mat-tabs` opt in. The rest of the library is insulated.

### Why insulation matters

This insulation is what makes the instrumentation pattern inside `@cngx/ui` possible at all.

The brain lives in a pure-CNGX twin (`@cngx/ui/accordion`, `@cngx/ui/paginator`, `@cngx/ui/stepper`, `@cngx/ui/tabs`) in an entry where Material cannot leak in.

The Material twin (`@cngx/ui/mat-accordion`, `@cngx/ui/mat-paginator`, `@cngx/ui/mat-stepper`, `@cngx/ui/mat-tabs`) is a thin bridge that re-uses the brain via host directives.
