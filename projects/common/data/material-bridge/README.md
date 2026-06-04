# Material Bridge

Single shared factory that wires a cngx presenter (`activeIndex` signal) bidirectionally against a Material parent like `<mat-tab-group>` or `<mat-stepper>`. Material types never enter the signature: the consuming directive maps Material's own events and property accessors to a host-agnostic shape at the boundary, so `@cngx/common/data` stays free of `@angular/material` (Sheriff Level-2 invariant).

## Import

```ts
import { createMaterialBidirectionalSync } from '@cngx/common/data';
```

## Quick start

A consumer directive that lives in `@cngx/ui` (or any Material-aware layer) holds the Material reference and the cngx presenter, then calls the factory once in its constructor:

```ts
import { Directive, DestroyRef, inject, Injector } from '@angular/core';
import { map } from 'rxjs/operators';
import { MatTabGroup } from '@angular/material/tabs';
import { createMaterialBidirectionalSync } from '@cngx/common/data';
import { CngxTabs } from '@cngx/common/...';

@Directive({ selector: 'mat-tab-group[cngxTabsBridge]' })
export class CngxMatTabsBridge {
  private readonly host = inject(MatTabGroup);
  private readonly presenter = inject(CngxTabs);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    createMaterialBidirectionalSync({
      presenterIndex: this.presenter.activeIndex,
      readSelectedIndex: () => this.host.selectedIndex ?? 0,
      writeSelectedIndex: (idx) => (this.host.selectedIndex = idx),
      selectionChange$: this.host.selectedIndexChange.asObservable(),
      onMaterialSelection: (idx) => this.presenter.select(idx),
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }
}
```

For `MatStepper`, map the event payload at the boundary instead of pushing Material types into the factory:

```ts
selectionChange$: this.stepper.selectionChange.pipe(map((e) => e.selectedIndex)),
```

## What the bridge wires

Two flows, both equality-guarded so a write that re-emits through the partner channel does not re-route.

| Direction | Trigger | Guard |
|-|-|-|
| presenter -> Material | `effect()` on `presenterIndex` | skips when `readSelectedIndex()` already equals the desired index |
| Material -> presenter | `selectionChange$` subscription | skips when `presenterIndex()` already equals the emitted index, then forwards to `onMaterialSelection` |
| Material reconcile | runs after `onMaterialSelection` | force-writes Material back to `presenterIndex()` when the presenter held its value (pessimistic-commit hold, or any contract that refuses a select) and Material had eager-advanced on click |

The reconciliation step closes Material's MDC eager-advance gap: the MDC click handler advances `selectedIndex` synchronously before the subscription fires, so a presenter that refuses the select would otherwise leave the visual ahead of the semantic state.

Both sides clean up through the supplied `DestroyRef`. The presenter-side `effect()` runs through `runInInjectionContext(injector, ...)`, so the call site does not need to be inside an injection context itself; only a valid `Injector` and `DestroyRef` are required.

There is no `commitState` gate. Pessimistic-commit handlers hold `presenter.activeIndex` at the origin until the commit settles, so the equality guard alone suppresses the Material write; optimistic-commit handlers advance immediately, which a `pending`-keyed gate would incorrectly suppress.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for `CngxMaterialBidirectionalSyncOptions`.
- cngx data primitives: `../README.md` (`CngxAsyncState`, `createCommitController`, presenter contracts).
- `@cngx/ui/material` and the per-component Material bridges under `@cngx/themes/material/` for actual Material-aware consumers.
