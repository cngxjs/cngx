# The CNGX Way

CNGX is the composition layer between Angular CDK and Angular Material — declarative, Signal-native, and communicative by construction. It provides the architectural infrastructure to build complex UIs without the maintenance burden of cloned libraries or monolithic components.

## Manifest

> **State is derived, not managed — and communication is architecture, not an afterthought.**

This axiom dictates every line of code in the library. Every directive and component is audited against these constraints:

- **Derivation:** If a value can be calculated, it **must** be a `computed()`. No manual state syncing.
- **Communication:** Every state change must be reflected in the reactive ARIA graph. A11y is a functional requirement of the logic, not a visual add-on.
- **Composition:** Functionality is added via `hostDirectives`. We favor small, pluggable units over inheritance or massive configuration objects.

## The Level Hierarchy

The library is strictly partitioned into five levels. This ensures a clean separation between **headless logic** (the brain) and **visual representation** (the skin).

### [Levels 0 & 1] — Kernel & Core

The non-visual foundation. Pure TypeScript and Angular DI tokens.

- **Artefacts:** `AsyncStatus`, `CommitController`, `TransitionTracker`.
- **Constraint:** Zero DOM dependency. These are the state machines and protocols that drive the logic layers above.

### [Level 2] — Atoms (Headless Behaviors)

The functional building blocks, implemented as **directives**.

- **Artefacts:** `CngxKeyboardNav`, `CngxRovingTabindex`, `CngxActiveDescendant`, `CngxOverlay`.
- **The "Brain":** An atom handles _how_ an interaction works (e.g., focus management or keyboard navigation) but has no HTML or CSS. It manages the reactive ARIA attributes and internal state flows.

### [Level 3] — Molecules (Domain Logic)

Functional units that wire atoms to specific data patterns.

- **Artefacts:** `CngxListbox`, `CngxOption`, `CngxSortHeader`.
- **The "Bridge":** These units connect behavior (Level 2) to domain-specific needs (Forms, Data-Display). They are often headless or provide minimal structural templates.

### [Level 4] — Organisms (The Skin)

The ready-to-use components.

- **Artefacts:** `<cngx-select>`, `<cngx-tab-group>`, `<cngx-stepper>`.
- **The "Skin":** Organisms compose Level 2/3 presenters via `hostDirectives` and provide the specific HTML/CSS.
- **Ejection Point:** This is the only layer intended for the **Atomic Decompose** schematic. When a user decomputes an organism, they take ownership of the skin (HTML/CSS) while the brain (Level 2/3) remains updateable within the library.

## What CNGX is not

- **Not a style kit.** We provide structural CSS and CSS variables. We don't provide a "look" you have to fight against.
- **Not a state store.** We don't manage your global data. We provide the primitives to make your local component state predictable and derived.
- **Not a Material replacement.** We instrument and enhance Material where it fits (`@cngx/ui/mat-*`), providing a Signal-native interface for existing Material implementations.

## What CNGX is

- **An Atom-Up Architecture.** Everything starts with single-responsibility directives.
- **A Reactive A11y Layer.** ARIA is a live projection of the signal graph, ensuring WCAG compliance by default.
- **A DI-First Toolkit.** Logic units (Controllers) are injected via tokens, making every part of a component replaceable via the standard Angular DI tree.

## Documentation Map

| Chapter                     | Operational Focus                                                           |
| :-------------------------- | :-------------------------------------------------------------------------- |
| **The Three Pillars**       | Implementation rules for derivation, communication, and composition.        |
| **Layered Design**          | Strict Sheriff boundaries and dependency rules between Level 0 and Level 4. |
| **Signal Internals**        | Best practices for `computed`, `linkedSignal`, and `untracked` effects.     |
| **Async State Machine**     | The `CngxAsyncState` protocol and transactional commit/rollback cycles.     |
| **Instrumentation Pattern** | How CNGX directives "infect" and upgrade third-party components (Material). |
| **Atomic Decompose**        | How the schematic separates skin from brain for maximum customization.      |
