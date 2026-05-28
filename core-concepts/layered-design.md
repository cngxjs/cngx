<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Layered Design

CNGX is organized into five levels. Each level has a specific dependency budget, a specific scope, and a specific reason to exist. The hierarchy is enforced by Sheriff (workspace-level `sheriff.config.ts`) and by `no-restricted-imports` blocks in `eslint.config.js`. A cross-level violation fails the lint stage in CI.

## The five levels

| Level | Library                             | What lives here                                                                                                                                                                                                             |
|-|-|-|
| 0     | `@cngx/utils`                       | Framework-agnostic utilities. No Angular dependency. Pure functions, types, tree helpers, RxJS interop helpers.                                                                                                             |
| 1     | `@cngx/core`                        | Angular-aware primitives that do not render. DI tokens, coercion helpers, async state machine, transition tracker, selection controller, key combos.                                                                        |
| 2     | `@cngx/common`                      | Atoms and molecules. Single-responsibility directives (a11y, interactive, popover, display, card, data, dialog, layout, chart, tabs, stepper). Never imports `@angular/material`.                                           |
| 3     | `@cngx/forms`, `@cngx/data-display` | Organisms in a feature domain. Forms organisms (select family, field bridges, validators). Data-display organisms (treetable). CDK is allowed; Material is forbidden at this level. |
| 4     | `@cngx/ui`                          | Organisms that require Material. Layout (sidenav, container), overlay (popover panel), material wrappers (mat-stepper, mat-tabs), feedback shell (toasts, banners, alerts), empty-state, skeleton, speak.                   |

## Dependency direction

Imports flow strictly upward. Level N may import Levels 0 through N-1; never Levels N+1 or higher.

```
             ui
            /  \
        forms  data-display
            \  /
           common
             |
            core
             |
           utils
```

`@cngx/utils` has no Angular runtime dependency - source files contain no `@angular/*` imports. It can be lifted into any TypeScript context (Node scripts, tests, framework-agnostic packages). The package still declares `@angular/core` as a peer dep for version-alignment hygiene with the rest of the workspace.

`@cngx/core` adds Angular but does not render. It is the home of DI tokens (`CNGX_STATEFUL`, `CNGX_SELECTION_CONTROLLER_FACTORY`, …), the `CngxAsyncState` shape, `createTransitionTracker`, `createSelectionController`, and other plain factories.

`@cngx/common` is where atoms live. An atom is a single-behavior directive - no CDK overlay, no Material - that derives one aspect of the design system and communicates it via ARIA and CSS custom properties. Examples: `CngxRovingTabindex`, `CngxFocusTrap`, `CngxListbox`, `CngxPopover`, `CngxIcon`, `CngxChip`, `CngxCheckboxIndicator`.

`@cngx/forms` and `@cngx/data-display` host **organisms in a feature domain**. The select family (`@cngx/forms/select`) composes `CngxListbox`, `CngxActiveDescendant`, `CngxPopover`, `CngxFormFieldPresenter`, and several factories into eight self-contained dropdown components (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxReorderableMultiSelect`, `CngxActionSelect`, `CngxActionMultiSelect`). None of them touch Material. CDK is fair game (`@angular/cdk/a11y` for live regions, for example).

`@cngx/ui` is for organisms that **need Material** or whose primary purpose is a Material wrapper. If a component can be built without `@angular/material`, it does not belong in `@cngx/ui` - it belongs in `@cngx/common`.

## Lib identity rule

A library is defined by **what it hosts**, not by which framework toolkit it happens to use:

- **`@cngx/common`** - atoms, molecules, plus pure-CNGX organisms that do not fit a feature domain (e.g. `CngxMenu`, `CngxChart`). Never imports `@angular/material`.
- **`@cngx/forms`** - Forms-related organisms (controls, validators, field bridges, the entire select family). CDK only.
- **`@cngx/data-display`** - organisms whose job is to display tabular or hierarchical data. Currently CDK-only (`treetable`); the lib is defined by *what it hosts*, not by which toolkit it picks.
- **`@cngx/ui`** - organisms that genuinely require Material (overlay, layout, feedback shell, empty-state, material wrappers).

A pure-CNGX data-display organism without a Material twin belongs in `@cngx/data-display`, not `@cngx/ui`. Conversely, a Forms-related organism that happens to wrap a Material control belongs in `@cngx/forms`, with the Material import isolated behind a bridge.

## Atomic levels inside a lib

Within a single library, components are classified by composition depth:

| Term         | Definition                                                                                                                                                                                   |
|-|-|
| **Atom**     | One directive, one responsibility. No CDK, no Material. Reads inputs, derives outputs, contributes to host ARIA. Example: `CngxRovingTabindex`, `CngxListbox`, `CngxCheckboxIndicator`.      |
| **Molecule** | Composes atoms (and possibly CDK utilities) to produce a small, focused behavior. Example: `CngxListboxTrigger` (combines listbox + popover anchor + ARIA wiring).                           |
| **Organism** | Composes molecules and atoms into a self-contained feature unit. Has its own template, often its own panel, its own state surface. Example: `CngxSelect`, `CngxTreeSelect`, `CngxTreetable`. |

**Only organisms are decompose-eligible.** The atomic-decompose schematic ejects the structural and thematic CSS of an organism into the consumer's project while the brain (host directive, DI tokens, factories) stays in the library. Atoms and molecules are terminal - copying them adds no value because they have no skin to eject.

## Secondary entries

Every library is shipped via `ng-packagr` with `sideEffects: false`. Each feature folder is its own ng-packagr secondary entry, with its own `ng-package.json` + `public-api.ts`. This lets consumers import surgically:

```typescript
import { CngxListbox } from '@cngx/common/interactive';
import { CngxSelect } from '@cngx/forms/select';
import { CngxSidenav } from '@cngx/ui/sidenav';
```

The path alias map in `tsconfig.base.json` is the **single source of truth**. Each `tsconfig.lib.json` redirects intra-lib cross-secondary imports to the built `dist/<lib>/types/*.d.ts` so that the AOT compiler does not pull in unbuilt TypeScript.

## Build order

```
utils → core → common → forms / data-display → ui
```

`npm run build:libs` runs them in this order. The dev-app consumes the source via tsconfig paths; production consumers consume the built `dist/` bundles. The Sheriff wildcards (`projects/<lib>/<entry>`) auto-classify new secondaries - adding a new feature folder under `projects/common/<name>` does not require a Sheriff config change.

## Why the levels exist

The hierarchy is not bureaucracy. It is a **dependency budget**:

- `@cngx/utils` can never break SSR, never depend on the DOM, never require a runtime. It can be unit-tested with Vitest against bare Node.
- `@cngx/core` can never render. If it tried, it would need a template, which would tie it to `@angular/core`'s renderer surface and pull it out of "primitive" territory.
- `@cngx/common` can never depend on Material. If you import `@angular/material` here, the lint stage fails. The rule exists because Material is heavy, opinionated, and changes on its own schedule - CNGX atoms must remain portable across Material's lifecycle.
- `@cngx/ui` is the only place where Material's API drift can land. The rest of the library is insulated.

This insulation is what makes the dual-rendering pattern (CDK twin + Material twin in `@cngx/data-display`) possible at all: the brain lives at a level where neither rendering strategy can leak in, and each twin is a thin skin at its appropriate level.
