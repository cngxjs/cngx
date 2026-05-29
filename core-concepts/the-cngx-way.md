<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# The CNGX Way

CNGX is a Signal-native composition library for Angular - declarative, communicative by construction, and built on plain signals and modern DOM. CDK and Material are opt-in primitives, not foundations: of the production source files, only a handful touch `@angular/cdk` (focus-trap, the `DataSource` contract, CDK-table for `@cngx/data-display/treetable`, the overlay engine in `@cngx/ui/overlay`); the popover stack uses CSS Anchor Positioning instead of `cdk/overlay`, listbox/menu/active-descendant are hand-rolled on signals instead of `ListKeyManager`, and the select family uses `createSelectionController<T>` instead of `SelectionModel`.

## Manifest

> **State is derived, not managed - and communication is architecture, not an afterthought.**

This axiom dictates every line of code in the library. Every directive and component is audited against these constraints:

- **Derivation:** If a value can be calculated, it **must** be a `computed()`. No manual state syncing.
- **Communication:** Every state change must be reflected in the reactive ARIA graph. A11y is a functional requirement of the logic, not a visual add-on.
- **Composition:** Functionality is added via `hostDirectives`. We favor small, pluggable units over inheritance or massive configuration objects.

## Package levels and atomic taxonomy

CNGX uses two orthogonal axes. The **package levels** are the import budget enforced by Sheriff. The **atomic taxonomy** (atom / molecule / organism) describes how a unit is composed inside a lib. See [Layered Design](layered-design.md) for the full table and the enforcement story.

### Package levels (enforced by Sheriff)

|Level|Library|Role|
|-|-|-|
|0|`@cngx/utils`|Framework-agnostic helpers. No Angular dep.|
|1|`@cngx/core`|Angular-aware primitives that do not render. DI tokens, `AsyncStatus`, `createTransitionTracker`, `createSelectionController`.|
|2|`@cngx/common`|Atoms and molecules. Single-responsibility directives across a11y, interactive, popover, display, card, data, dialog, layout.|
|3|`@cngx/forms`, `@cngx/data-display`|Organisms in a feature domain. CDK allowed where it earns its weight; Material forbidden.|
|4|`@cngx/ui`|Organism layer that may opt into Material. Three entries do (`mat-stepper`, `mat-tabs`, `material`); the other ten do not.|

Imports flow strictly upward. A cross-level violation fails CI lint.

### Atomic taxonomy (inside a lib)

- **Atom.** One directive, one responsibility. No CDK, no Material. Examples: `CngxRovingTabindex`, `CngxActiveDescendant`, `CngxFocusTrap`, `CngxListbox`, `CngxCheckboxIndicator`.
- **Molecule.** Composes atoms (and occasionally a CDK utility) into a focused behavior. Example: `CngxListboxTrigger` (listbox + popover anchor + ARIA wiring).
- **Organism.** Composes molecules and atoms into a self-contained feature unit with its own template and state surface. Examples: `CngxSelect`, `CngxTreeSelect`, `CngxTreetable`, `CngxTabGroup`, `CngxStepper`.

**Only organisms are decompose-eligible.** The planned eject workflow splits an organism along a **brain** seam (host directive + DI tokens, stays in the lib and stays updateable) and a **skin** seam (template + CSS, ejected into the consumer). Atoms and molecules are terminal: they have no skin to eject.

## What CNGX is not

- **Not a style kit.** Structural CSS plus CSS custom properties (with sensible fallback defaults). No "look" to fight against. The Material bridge under `@cngx/themes/material/` is opt-in.
- **Not a state store.** No global data layer. CNGX gives you the primitives to keep local component state predictable and derived.
- **Not a Material replacement.** Where Material is the right answer, CNGX instruments it (`@cngx/ui/mat-stepper`, `@cngx/ui/mat-tabs`) via attribute directives that attach a Signal-native brain to the existing Material markup. See [Instrumentation Pattern](instrumentation-pattern.md).

## What CNGX is

- **An atom-up architecture.** Everything starts with single-responsibility directives. Composition over inheritance, no God-Components.
- **A reactive A11y layer.** ARIA (`aria-busy`, `aria-disabled`, `aria-describedby`, `aria-live`, `aria-required`, `aria-invalid`) is part of the `computed()` graph from day one. Live regions are always in the DOM; describedby IDs are always present, visibility toggles via `aria-hidden`.
- **A DI-first toolkit.** Logic units (controllers, factories, panel hosts, announcers) are injected via tokens. The select family alone exposes 18 DI override tokens and 17 template slots. Every part is replaceable via the standard Angular DI tree.

## Documentation Map

|Chapter|Operational Focus|
|:-|:-|
|**The Three Pillars**|Implementation rules for derivation, communication, and composition.|
|**Layered Design**|Strict Sheriff boundaries and dependency rules between Level 0 and Level 4.|
|**Signal-First Internals**|Conventions for `computed`, `linkedSignal`, `untracked`, `afterNextRender`.|
|**Async State Machine**|The `CngxAsyncState` protocol and the six-state `AsyncStatus` lifecycle.|
|**Instrumentation Pattern**|How CNGX attaches a Signal-native brain to Angular Material (`@cngx/ui/mat-*`).|
