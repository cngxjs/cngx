# Instrumentation Pattern — The Material Bridge

cngx solves a recurring problem: a feature has the same brain but needs two different skins — a CDK-only skin (lightweight, no Material dependency) and a Material skin (full Material theming, dialog, ripple, density). The naive solutions all fail:

- **Class inheritance** ties the two skins into one class hierarchy and bleeds Material types into the CDK twin.
- **Configuration flags** (`[useMaterial]="true"`) push the cartesian product into runtime, kill tree-shaking, and force every consumer to opt out of Material somehow.
- **Forks** double the maintenance cost and let the two skins drift apart silently.

cngx uses **dual-rendering with a presenter directive**. One brain, two skins, one source of truth.

## The pattern

The pattern has three pieces:

| Piece | Role |
|-|-|
| **Presenter** | A `hostDirective` that owns all state, all logic, all DI tokens, and all `computed` derivations. It does not render. |
| **CDK skin** | A thin component that applies the presenter as a `hostDirective` and renders the CDK-only template. Lives at the appropriate level (typically `@cngx/common` or `@cngx/data-display`). |
| **Material skin** | A second thin component that applies the **same** presenter as a `hostDirective` and renders the Material template. Lives in `@cngx/ui` or in a `mat-*` sibling secondary entry. |

The presenter exposes its surface (`signal`s, `computed`s, `output`s, methods) via the `hostDirective` mechanism. Both skins read the same surface; neither skin knows about the other.

## Reference implementation — treetable

The canonical dual-rendering pair lives in `@cngx/data-display`:

```typescript
// Presenter (the brain) — projects/data-display/treetable/treetable-presenter.ts
@Directive({
  selector: '[cngxTreetablePresenter]',
  exportAs: 'cngxTreetablePresenter',
})
export class CngxTreetablePresenter<T> {
  readonly data = input<readonly T[]>([]);
  readonly state = input<CngxAsyncState<T[]>>(...);

  readonly view = computed(() => this.resolveView());
  readonly sortedRows = computed(() => this.deriveSortedRows());
  // ...20+ computed derivations
}

// CDK skin — projects/data-display/treetable/treetable.component.ts
@Component({
  selector: 'cngx-treetable',
  hostDirectives: [
    { directive: CngxTreetablePresenter, inputs: ['data', 'state', ...], outputs: [...] }
  ],
  template: `<!-- CDK <cdk-table> -->`,
})
export class CngxTreetable<T> {
  protected readonly presenter = inject(CngxTreetablePresenter, { host: true });
}

// Material skin — projects/data-display/mat-treetable/material-treetable.component.ts
@Component({
  selector: 'cngx-mat-treetable',
  hostDirectives: [
    { directive: CngxTreetablePresenter, inputs: [...], outputs: [...] }
  ],
  template: `<!-- Material <mat-table> -->`,
})
export class CngxMaterialTreetable<T> {
  protected readonly presenter = inject(CngxTreetablePresenter, { host: true });
}
```

Both skins are interchangeable from the consumer's perspective: same inputs, same outputs, same behavior. The choice is the import path.

## When to use it

Dual-rendering is **organism-specific**. Apply it when:

- The component is composed enough to be called an organism (template, panel, or multi-region UI).
- A consumer might reasonably want either Material theming or zero Material dependency.
- The brain is non-trivial — typically 200+ LOC of state and derivations.

Do **not** apply dual-rendering to:

- Atoms or molecules. They have no skin worth ejecting; the gain is zero.
- Organisms with only one realistic rendering strategy. Forms field bridges (`CngxBindField`) work uniformly with both Material and native — they need no twin.
- Components where Material is mandatory. Material-wrapper organisms (`cngx-mat-stepper`, `cngx-mat-tabs`) live in `@cngx/ui` and have no CDK twin because their job *is* to wrap Material.

## How it differs from inheritance

Inheritance shares behavior by extending a base class:

```typescript
// ANTI-PATTERN — not what cngx does
class CngxTreetable<T> extends CngxTreetableBase<T> { ... }
class CngxMatTreetable<T> extends CngxTreetableBase<T> { ... }
```

This couples the two skins through a static type hierarchy. Adding a state to the base forces both skins to handle it. Removing one is a breaking change for the other. The base class becomes a junk drawer.

`hostDirectives` instead share behavior by **composition** at the DI level:

- The presenter is a plain `Directive` with no special status.
- Each skin declares it in `hostDirectives` with **explicit input/output forwarding**. The skin chooses what to expose.
- `inject(CngxTreetablePresenter, { host: true })` retrieves the presenter from the host element. The skin reads the presenter's signals like any other directive.

There is no `super`, no `protected` interface, no virtual dispatch. The presenter is a peer.

## CngxBindField — the universal forms bridge

The same pattern (presenter-as-brain, bridge-as-skin) shows up in forms. `CngxFormFieldPresenter` is the brain — it tracks `value`, `disabled`, `focused`, `empty`, `errorState`, `id`, and exposes a `markAsTouched` channel. The bridges are thin:

| Bridge | What it bridges to |
|-|-|
| `CngxBindField` | Universal — works with Material (`mat-select`, `matInput`), native inputs, custom `FormValueControl`, RF `ControlValueAccessor`. |
| `CngxListboxFieldBridge` | The raw `CngxListbox` atom (exotic value semantics — generic, multi-select-aware). |

`CngxBindField` does not inject the concrete control. It reads the presenter, derives `id` / `empty` / `focused` / `disabled` / `errorState`, and writes them onto the host element as host bindings. Any control gets field integration; no new bridge needed.

Native cngx form controls (`CngxSelect`, `CngxMultiSelect`, etc.) provide `CNGX_FORM_FIELD_CONTROL` directly — no bridge needed because they implement the field-control interface as their primary surface.

## Decompose contract

The dual-rendering pattern is also the **decompose contract**. The schematic-decompose tool ejects an organism's structural and thematic CSS into the consumer's project while leaving the brain in the library. The split is exactly the presenter/skin boundary:

| Stays in library | Ejected to consumer |
|-|-|
| Presenter directive (brain) | Skin component (`*.component.ts`) |
| DI tokens (`CNGX_*_FACTORY`) | Template (`*.component.html`) |
| Default factory functions | Structural CSS (`*.component.css`) |
| Shared utilities (`createSelectCore`, etc.) | Thematic CSS variables / tokens |

The consumer ends up with a thin component they own (skin) that depends on a brain they cannot accidentally fork (presenter). Future library updates to the brain land for free; future consumer changes to the skin do not break the library.

An organism is decompose-eligible when it satisfies all six of these authoring rules:

1. **Thin `@Component` body.** Class logic is kept minimal — the body reads almost like configuration: `hostDirective` declarations, input/output forwarding, and minimal glue. Cross-cutting behavior (commit lifecycle, scroll, intersection) lives in controller factories (`createCommitController`, `createTransitionTracker`).
2. **Explicit `hostDirectives` declarations.** Every input and output the consumer should be able to bind is listed in the host-directive forwarding block. Behavior comes from focused Level-2 atoms (`CngxActiveDescendant`, `CngxRovingTabindex`, `CngxFocusTrap`, …) — never from ad-hoc directives defined inline.
3. **DI-token contracts for every controller.** Cross-component wiring goes through `InjectionToken<SomeContract>` + `{ provide: TOKEN, useExisting: ParentClass }`. A sub-component never injects a concrete parent class — that creates a cyclic type dependency and blocks decomposition. Default factories live behind `CNGX_*_FACTORY` tokens with `providedIn: 'root'`.
4. **Structural CSS / thematic CSS split.** Structural styles (flex, grid, padding, layout) ship in their own file or block. Thematic styles (colors, font sizes, borders, focus rings) come from CSS custom properties with fallback defaults: `background: var(--cngx-select-panel-bg, var(--cngx-surface, #fff))`. Shared structural rules (skeletons, spinners, shimmer keyframes) live in shared files that the decompose schematic can leave linked or flatten on eject.
5. **~100-line template.** If the main template doesn't fit on one screen, sub-structures (panel bodies, option loops, state switches) get extracted into sub-components behind DI-token host contracts.
6. **Sub-token contracts and tokens.** Every visual element ships a corresponding `--cngx-*` CSS custom property with a sensible fallback default, so consumers can theme without forking. Sub-components (panel-shells, tree-panels) inject through their own host-contract token.

The "could I eject this template plus styles to a consumer project, leaving only host-directive imports linked from the library?" check is the single question that summarizes all six rules. If the answer is "no", too much logic lives in the class.

The select family is the reference state: 18 DI factory tokens, 17 public template slots, `provideCngxSelect` aggregator, structural `select-base.css` + per-skin trigger CSS. Treetable / mat-treetable is the canonical CDK + Material pair.

## Consumer ergonomics

From the consumer's side, the pattern is invisible:

```html
<!-- CDK consumer -->
<cngx-treetable [data]="rows" [state]="state" />

<!-- Material consumer -->
<cngx-mat-treetable [data]="rows" [state]="state" />
```

Same API, same behavior, different visual stack and different bundle size. Tree-shaking works because the brain is one directive and each skin imports the brain plus its own template — neither skin imports the other.

## What NOT to do

- Do not put rendering logic into the presenter. The presenter has no template. If you need to compute something visual, expose a `computed` and let the skin render it.
- Do not import Material from the presenter. The presenter lives at the level appropriate for the **lowest** skin (typically `@cngx/common` or `@cngx/data-display`) — never in `@cngx/ui`.
- Do not declare the presenter as `providedIn: 'root'`. It is a host directive, not a service.
- Do not share state across the two skins. Each skin instance has its own presenter instance (via `hostDirective`). If two skins need to share state, the consumer wires them via a service or a `[state]` input.
- Do not skip the `inputs`/`outputs` forwarding in the skin's `hostDirectives`. Angular requires every input/output to be listed explicitly — otherwise it stays internal to the presenter and the consumer cannot bind it.
