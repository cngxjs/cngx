This document defines the **Dual-Rendering Pattern**, the primary architectural strategy used by CNGX to provide multiple visual implementations (skins) for the same functional logic (brain).

# Dual-Rendering Pattern

CNGX solves a recurring problem: a feature has the same logic but needs two different visual stacks — a **CDK-native skin** (lightweight, zero Material dependency) and a **Material-native skin** (full Material design, ripples, density).

Conventional approaches like class inheritance or runtime configuration flags fail to provide clean tree-shaking and maintenance. CNGX uses **Dual-Rendering with a Presenter Directive**.

## The Pattern: One Brain, Two Skins

The pattern separates the "how it works" from the "what it looks like" by splitting the component into three distinct pieces:

| Piece             | Role                                                                                                                          | Location                                |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------- |
| **Presenter**     | A headless `Directive` that owns all Signals, state machines, DI tokens, and `computed` derivations. It has zero HTML or CSS. | `@cngx/common` or `@cngx/data-display`  |
| **CDK Skin**      | A thin `@Component` that applies the Presenter via `hostDirectives` and renders a CDK-only template.                          | Sibling to Presenter                    |
| **Material Skin** | A second thin `@Component` using the **same** Presenter, rendering a template optimized for Material.                         | `@cngx/ui` or a `mat-*` secondary entry |

## Reference Implementation: `treetable`

The canonical dual-rendering pair lives in `@cngx/data-display`:

```typescript
// 1. The Brain: Presenter (Headless)
@Directive({
  selector: '[cngxTreetablePresenter]',
  exportAs: 'cngxTreetablePresenter',
})
export class CngxTreetablePresenter<T> {
  readonly data = input<readonly T[]>([]);
  readonly view = computed(() => this.resolveView());
  // ... All business logic lives here
}

// 2. The Skin: CDK Component
@Component({
  selector: 'cngx-treetable',
  hostDirectives: [
    {
      directive: CngxTreetablePresenter,
      inputs: ['data'],
      outputs: ['expandChange'],
    },
  ],
  template: `<!-- Pure CDK implementation -->`,
})
export class CngxTreetable<T> {
  // Access the brain via host DI
  protected readonly presenter = inject(CngxTreetablePresenter, { host: true });
}

// 3. The Skin: Material Component
@Component({
  selector: 'cngx-mat-treetable',
  hostDirectives: [
    {
      directive: CngxTreetablePresenter,
      inputs: ['data'],
      outputs: ['expandChange'],
    },
  ],
  template: `<!-- Pure Material implementation -->`,
})
export class CngxMaterialTreetable<T> {
  protected readonly presenter = inject(CngxTreetablePresenter, { host: true });
}
```

## The Decompose Contract

Dual-rendering is the foundation of the **Atomic Decompose** schematic. Because the logic is entirely encapsulated in the Presenter, the Component (Skin) is essentially "disposable."

When a user runs `ng decompose`:

1. The schematic ejects the **Skin Component** (TS, HTML, CSS) into the consumer project.
2. The consumer now owns the visual representation.
3. The ejected component still imports and uses the **Presenter** from the library.
4. Logic updates in the library (Brain) continue to flow to the consumer's custom UI (Skin).

### Authoring Rules for Decompose-Readiness:

1. **Thin `@Component` body:** The class should be nearly empty, containing only `hostDirective` declarations and minimal glue code.
2. **Explicit Forwarding:** Every Input/Output intended for the consumer must be listed in the `hostDirectives` block.
3. **Token-based Communication:** Sub-components (like a Panel or a Header) must never inject the concrete Component class. They must inject a **DI Token contract** (`CNGX_HOST_TOKEN`) provided by the Presenter. This prevents cyclic dependencies and allows the Skin to be ejected cleanly.
4. **Structural vs. Thematic CSS:**
   - **Structural styles** (layout, flex, positioning) belong in a shared base file.
   - **Thematic styles** (colors, borders, fonts) belong in the specific skin component and use CSS variables.

## When to use Dual-Rendering

Apply this pattern only to **Organisms**.

- **Use it when:** A component is complex (200+ LOC), has a significant template, and there is a clear demand for both a Material-styled version and a framework-agnostic version.
- **Don't use it for:** Atoms or Molecules. They are too small to justify the overhead of a separate Presenter.

## What NOT to do

- **No Inheritance:** Never use `class X extends Y`. It creates rigid coupling. Use `hostDirectives` for composition.
- **No Rendering in the Brain:** The Presenter must never touch the DOM or contain visual logic (like manual pixel offsets). It only provides the signals for the Skin to consume.
- **No Global State:** Do not declare the Presenter as `providedIn: 'root'`. It must be tied to the lifecycle of the component instance via `hostDirectives`.
- **No Material in the Brain:** The Presenter must never import from `@angular/material`. It lives at a lower layer. Material types and imports belong strictly inside the Material Skin component.

### Summary

> "One source of truth, multiple visual expressions. Dual-rendering ensures that our core logic remains stable and maintainable, while our UI remains flexible and decompressible."
