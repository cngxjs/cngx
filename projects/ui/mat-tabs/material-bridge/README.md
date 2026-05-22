# Mat Tabs Material Bridge

Material-side adapter that translates an Angular Material `MatTab` into a cngx `CngxTabHandle`, plus the typed façade for every Material-internal surface `[cngxMatTabs]` couples to. Lives at the seam between `@angular/material/tabs` and `@cngx/common/tabs` so the presenter brain in `@cngx/common/tabs` can read Material's per-tab state through the Signal graph without touching `MatTab` directly.

## Import

```ts
import {
  createMatTabHandle,
  CNGX_MAT_TAB_HANDLE_FACTORY,
  type CngxMatTabHandleFactory,
  MaterialPrivateSurfaces,
} from '@cngx/ui/mat-tabs';
```

## Quick start

The factory is consumed by `[cngxMatTabs]` per registered `<mat-tab>`. Consumers do not call it directly. Override the factory via DI to layer behaviour (telemetry, deterministic test ids, server-synced ids):

```ts
providers: [
  {
    provide: CNGX_MAT_TAB_HANDLE_FACTORY,
    useValue: ((tab, idSeed, injector) => {
      const setup = createMatTabHandle(tab, idSeed, injector);
      reportTabRegistered(setup.handle.id);
      return setup;
    }) satisfies CngxMatTabHandleFactory,
  },
]
```

The supplied `idSeed` is a `nextUid` closure - process-wide monotonic, so `${id}-errors` descriptor ids stay unique across coexisting `[cngxMatTabs]` instances. Overrides may call it, ignore it, or replace it.

## What the bridge wires

| Surface | Source | Cngx side |
|-|-|-|
| `handle.id` | `idSeed()` | Stable per-tab identifier, label-independent |
| `handle.label` | `matTab.textLabel` | `computed` retriggered by `_stateChanges` |
| `handle.disabled` | `matTab.disabled` | `computed` retriggered by `_stateChanges` |
| `handle.errorAggregator` | writable slot | Pumped by `[cngxMatTabError]`, exposed `.asReadonly()` |
| State change trigger | `matTab._stateChanges` | `toSignal(..., { equal: () => false })` |

`equal: () => false` is load-bearing. `_stateChanges` is a `Subject<void>`, so the default `Object.is(undefined, undefined)` dedup would swallow every emission and the dependent computeds would never recompute.

## Private surfaces

`MaterialPrivateSurfaces` is the single grep target for every Material-internal surface the family couples to. Both type façades for leading-underscore fields (`_stateChanges`, `_iconOverrides`, `_completedOverride`) and Material's internal CSS selectors (`.mat-mdc-tab`, `.mat-mdc-tab-header`, `.mat-mdc-tab-label-container`) live there. A Material-version upgrade audit grep starts at this namespace plus the `tabs-accepted-debt §5` and `stepper-accepted-debt §1, §4` entries. The namespace is re-exported from `@cngx/ui/mat-tabs` so cross-package consumers (`@cngx/ui/mat-stepper`) can resolve nested members through the path-alias.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full factory signature, DI token, and `MaterialPrivateSurfaces` members.
- `@cngx/common/tabs` - the headless presenter brain that consumes `CngxTabHandle`.
- `@cngx/ui/mat-tabs` - the directive package this bridge is part of (`[cngxMatTabs]`, `[cngxMatTabError]`, overflow adapter, registry).
