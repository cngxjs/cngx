# The cngx Way

cngx is the composition layer between Angular CDK and Angular Material — declarative, Signal-first, and communicative by construction. It is not a wrapper around Material, not a re-skin of CDK, and not a kitchen-sink component kit. It is a library of small, focused units that read state, derive everything else, and tell the user (and the screen reader) what changed.

## Manifest

> **Zustand wird abgeleitet, nicht verwaltet — und Kommunikation ist Architektur, kein Nachgedanke.**

State is derived, not managed — and communication is architecture, not an afterthought. This single sentence is the load-bearing axiom of the library. Every directive, every component, every utility is auditable against it.

If a value can be calculated from other signals, it is a `computed()`. If a state change happens, the user is told — visually, semantically, and to assistive technology. If two things look similar, they compose; they do not inherit, and they do not negotiate via options objects.

## What cngx is not

- Not a styling library. Visual tokens are CSS custom properties with fallback defaults; consumers theme via `--cngx-*` vars.
- Not a state container. There is no store, no reducer, no global service of truth. State lives where it is produced; everything downstream derives from it.
- Not opinionated about routing, forms data model, or HTTP. It bridges Angular Signal Forms and Reactive Forms uniformly via `[field]` + `CNGX_FORM_FIELD_CONTROL`. RxJS is allowed at the boundary (HTTP, WebSocket, DOM events); inside, everything is Signals.
- Not a Material replacement. cngx components that need Material wrap it explicitly (`@cngx/ui/*`, `@cngx/data-display/mat-*`). The rest is CDK-only or framework-agnostic.

## What cngx is

- An atom-up component library. Single-responsibility directives are the foundation; molecules wire atoms together; organisms compose molecules into a feature unit. Every level is decompose-eligible at the organism boundary.
- A communication layer. A11y attributes (`aria-busy`, `aria-disabled`, `aria-describedby`, `aria-live`, `aria-expanded`, `aria-invalid`) are part of the `computed()` graph from day one — never bolted on during audit.
- A consistent set of DI seams. Every controller (selection, commit, tree, display-binding, focus, chip-removal, flat-nav) ships behind a factory token (`CNGX_*_FACTORY`) so consumers can swap behavior without forking the component.
- A typed surface. No `any`. No untyped forms. No silent overloads. Public API symbols follow a strict prefix convention (`provide*`, `with*`, `inject*`, `create*`).

## How to read this section

The remaining core-concepts chapters expand the manifest into operational rules:

| Chapter | What you take from it |
|-|-|
| **The Three Pillars** | The non-negotiables: derivation, communication, composition. Anti-patterns to recognize. |
| **Layered Design** | The lib hierarchy (Level 0–4) and what belongs where. |
| **Signal-First Internals** | How signals, `computed`, `effect`, `linkedSignal`, `equal` fns, and transition trackers compose inside cngx. |
| **Async State Machine** | `CngxAsyncState`, the status enum, producers, consumers, and transition bridges. |
| **Instrumentation Pattern** | Dual-rendering (presenter + CDK skin + Material skin), `hostDirectives`, and the decompose contract. |

You can read them in any order, but the three pillars are load-bearing for everything else.
