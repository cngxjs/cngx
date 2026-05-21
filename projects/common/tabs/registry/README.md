# Tabs Registry

Shared id-to-directive resolution for the tabs and stepper families. Wraps a `Signal<readonly T[]>` (typically a `contentChildren` query) as a `Signal<Map<string, T>>` keyed by `id()`, with structural equality so an unchanged child set never cascades downstream computeds. Used by `<cngx-tab-group>`, `<cngx-stepper>`, and `<cngx-mat-stepper>`; exposed as a DI factory so consumers can swap the resolution policy (WeakMap, telemetry, custom equality).

## Import

```ts
import {
  CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  createDirectiveByIdMap,
  type CngxDirectiveByIdMapFactory,
  type CngxDirectiveByIdMapOptions,
} from '@cngx/common/tabs';
```

## Quick start

Standard wiring inside an organism: inject the factory token, call it with the `contentChildren` signal, and consume the resulting `Map` from any `computed()`.

```ts
import { contentChildren, inject } from '@angular/core';
import { CNGX_DIRECTIVE_BY_ID_MAP_FACTORY, CngxTab } from '@cngx/common/tabs';

class MyTabGroup {
  private readonly tabs = contentChildren(CngxTab);

  private readonly tabById = inject(CNGX_DIRECTIVE_BY_ID_MAP_FACTORY)({
    source: this.tabs,
  });

  readonly activeTab = computed(() => this.tabById().get(this.activeId()));
}
```

The directive type only has to expose an `id(): string` accessor - the registry is not tied to `CngxTab` and the steppers reuse it for `CngxStep`.

Override globally to swap the policy (for example, instrument every lookup):

```ts
provideEnvironmentInitializer(() => {
  // Use the default factory but wrap it with logging.
});

// or, in providers:
{
  provide: CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  useValue: ((opts) => {
    const inner = createDirectiveByIdMap(opts);
    return computed(() => {
      const map = inner();
      console.debug('[tabs] resolved', map.size, 'ids');
      return map;
    });
  }) satisfies CngxDirectiveByIdMapFactory,
}
```

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the factory token, options, and signature types.
- Sibling primitives in `@cngx/common/tabs`: `CngxTab`, `CngxTabGroupPresenter`, `CNGX_TAB_GROUP_HOST`, `CNGX_TAB_PANEL_HOST`.
- Consumed by `@cngx/ui/tabs`, `@cngx/ui/stepper`, and `@cngx/ui/mat-stepper`.
