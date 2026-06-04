# Tree Controller

Signal-native state controller for hierarchical data. Owns the expansion set, derives flat and visible projections of a source tree, and serves O(1) id- and value-based lookups for keyboard nav, selection, and rendering. Not a component, not a renderer: callers wire the controller into their own template (or into `CngxHierarchicalNav`, `CngxTreeSelect`, a custom grid) and bind the resulting signals.

## Import

```ts
import {
  createTreeController,
  createTreeAdItems,
  CNGX_TREE_CONTROLLER_FACTORY,
  CNGX_TREE_CONFIG,
  provideTreeConfig,
  provideTreeConfigAt,
  injectTreeConfig,
  withDefaultNodeIdFn,
  withDefaultLabelFn,
  withDefaultKeyFn,
  withDefaultInitiallyExpanded,
  withTreeCacheLimit,
  type CngxTreeController,
  type CngxTreeControllerOptions,
  type CngxTreeConfig,
} from '@cngx/common/interactive';
```

## Quick start

Register app-wide defaults once at bootstrap, then instantiate one controller per consumer in an injection context.

```ts
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideTreeConfig(
      withDefaultNodeIdFn<MyDomain>((v) => v.uuid),
      withDefaultKeyFn<MyDomain>((v) => v.uuid),
      withDefaultLabelFn<MyDomain>((v) => v.name),
    ),
  ],
});
```

```ts
// nav.component.ts
@Component({ /* ... */ })
export class NavComponent {
  readonly nodes = input.required<readonly CngxTreeNode<MyDomain>[]>();
  protected readonly tree = createTreeController({ nodes: this.nodes });
  protected readonly adItems = createTreeAdItems(this.tree);
}
```

```html
<ul
  role="tree"
  cngxActiveDescendant
  [items]="adItems()"
  [cngxHierarchicalNav]="tree"
  tabindex="0"
>
  @for (n of tree.visibleNodes(); track n.id) {
    <li role="treeitem" [attr.aria-expanded]="tree.isExpanded(n.id)()">
      {{ n.label }}
    </li>
  }
</ul>
```

`createTreeController` must be called inside an injection context (constructor, field initializer, `runInInjectionContext`) so it can read `CNGX_TREE_CONFIG`.

## `createTreeController` options

| Option | Type | Notes |
|-|-|-|
| `nodes` | `Signal<readonly CngxTreeNode<T>[]>` | Source tree. Re-derives on every change. |
| `nodeIdFn` | `(value, path) => string` | Required unless `withDefaultNodeIdFn` supplies one. Must be stable across sort/filter. |
| `labelFn` | `(value) => string` | Falls back to config default, then `String(value)`. |
| `keyFn` | `(value) => unknown` | Membership key for `findByValue` / selection. Falls back to config default, then identity. |
| `initiallyExpanded` | `'all' \| 'none' \| readonly string[]` | Evaluated once at construction. Later tree changes do not re-apply. |
| `cacheLimit` | `number` | Bound the `isExpanded(id)` signal cache. Default: unlimited. |

Resolution order for every optional field: per-options > `provideTreeConfig` > library default.

## `CngxTreeConfig` defaults

App-wide fallbacks injected via `CNGX_TREE_CONFIG`. Every field is optional.

| Field | Type | Library default |
|-|-|-|
| `defaultNodeIdFn` | `(value, path) => string` | none (dev-mode error if also missing per-options) |
| `defaultLabelFn` | `(value) => string` | `String(value)` |
| `defaultKeyFn` | `(value) => unknown` | identity |
| `defaultInitiallyExpanded` | `'all' \| 'none' \| readonly string[]` | `'none'` |
| `cacheLimit` | `number` | unlimited |

## Feature factories

`provideTreeConfig(...)` and `provideTreeConfigAt(...)` accept the following `with*` features. Each one merges into the resolved `CngxTreeConfig`; the last writer wins per field.

| Factory | Sets | Use for |
|-|-|-|
| `withDefaultNodeIdFn<T>(fn)` | `defaultNodeIdFn` | One app-wide domain id convention (e.g. `(v) => v.uuid`). |
| `withDefaultLabelFn<T>(fn)` | `defaultLabelFn` | Localized or computed display label. |
| `withDefaultKeyFn<T>(fn)` | `defaultKeyFn` | Membership key shared with selection / RF integration. |
| `withDefaultInitiallyExpanded(mode)` | `defaultInitiallyExpanded` | Default seed for every controller in scope. |
| `withTreeCacheLimit(n)` | `cacheLimit` | Cap the `isExpanded(id)` signal cache. See the field docs for the reference-stability trade-off. |

`provideTreeConfigAt(...)` is the component-scoped variant; drop it in `viewProviders` to override the root config for a sub-tree.

## `CNGX_TREE_CONTROLLER_FACTORY`

The DI token that resolves the factory used by every consumer. Defaults to `createTreeController`. Override in `providers` / `viewProviders` to wrap the plain factory for telemetry, audit logging, or server-synced expansion state.

```ts
providers: [
  {
    provide: CNGX_TREE_CONTROLLER_FACTORY,
    useValue: <T>(opts: CngxTreeControllerOptions<T>) => {
      const ctrl = createTreeController(opts);
      return { ...ctrl, expand: (id) => { logExpand(id); ctrl.expand(id); } };
    },
  },
],
```

The plain `createTreeController` import stays available for tests and ad-hoc usage; the token is the right indirection when consumers (like `CngxTreeSelect`) need to honor a swap.

## `createTreeAdItems`

Helper that projects a controller's `visibleNodes` into the `ActiveDescendantItem[]` shape consumed by `CngxActiveDescendant.items`, with structural-equality memoization to skip re-renders on irrelevant tree re-emissions.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for full type signatures and tokens.
- `CngxHierarchicalNav` (sibling directive in `@cngx/common/interactive`): wires `ArrowLeft` / `ArrowRight` to a tree controller via a pluggable W3C strategy.
- `CngxTreeSelect` in `@cngx/forms/select`: the primary consumer, pairs the controller with `CngxSelectionController` and the select-family panel host.
