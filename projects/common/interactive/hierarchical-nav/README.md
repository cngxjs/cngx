# Hierarchical Nav

Keyboard-navigation directive for hierarchical tree widgets. Wires `ArrowRight` / `ArrowLeft` to a pluggable strategy that talks to a `CngxTreeController` and the host's `CngxActiveDescendant`. Vertical motion (`ArrowUp` / `ArrowDown`, `Home` / `End`, typeahead) stays with AD; this directive only adds the horizontal axis of the W3C treeview pattern.

## Import

```ts
import {
  CngxHierarchicalNav,
  CNGX_HIERARCHICAL_NAV_STRATEGY,
  createW3CTreeStrategy,
  type CngxHierarchicalNavAction,
  type CngxHierarchicalNavContext,
  type CngxHierarchicalNavStrategy,
} from '@cngx/common/interactive';
```

## Quick start

```ts
@Component({
  selector: 'app-file-tree',
  imports: [CngxActiveDescendant, CngxHierarchicalNav],
  template: `
    <ul
      role="tree"
      cngxActiveDescendant
      [items]="adItems()"
      [cngxHierarchicalNav]="tree"
      (expand)="onExpand($event)"
      (collapse)="onCollapse($event)"
      tabindex="0"
    >
      @for (node of tree.visibleNodes(); track node.id) {
        <li [id]="node.id" [attr.role]="'treeitem'">…</li>
      }
    </ul>
  `,
})
export class FileTree {
  readonly nodes = signal<CngxTreeNode<FileNode>[]>([…]);
  readonly tree = createTreeController({
    nodes: this.nodes,
    nodeIdFn: (v) => v.id,
  });
  readonly adItems = createTreeAdItems(this.tree);
}
```

The directive attaches on the same host as `CngxActiveDescendant`, injects the AD instance with `{ host: true, optional: true }`, and degrades silently when AD is absent or nothing is highlighted.

## Strategy contract

A strategy is two synchronous steps. Each receives a context, may mutate the controller or AD, and returns the action the directive should announce.

```ts
interface CngxHierarchicalNavStrategy {
  onArrowRight<T>(ctx: CngxHierarchicalNavContext<T>): CngxHierarchicalNavAction;
  onArrowLeft<T>(ctx: CngxHierarchicalNavContext<T>): CngxHierarchicalNavAction;
}
```

### Context

| Field | Type | Notes |
|-|-|-|
| `controller` | `CngxTreeController<T>` | Owns expansion state and structural lookups. |
| `ad` | `CngxActiveDescendant` | Guaranteed non-null when the step is invoked. |
| `activeId` | `string` | Snapshot of `ad.activeId()` at key-press time. |

### Action

| Kind | Payload | Directive reaction |
|-|-|-|
| `expand` | `{ id }` | Emits `(expand)`, calls `preventDefault`. |
| `collapse` | `{ id }` | Emits `(collapse)`, calls `preventDefault`. |
| `movedToChild` | `{ id }` | Emits `(movedToChild)`, calls `preventDefault`. |
| `movedToParent` | `{ id }` | Emits `(movedToParent)`, calls `preventDefault`. |
| `noop` | - | No emission, no `preventDefault`. |

Move actions are state-change-truthful: the strategy is expected to call `ad.highlightByValue` and downgrade to `noop` when the highlight did not actually change (e.g. a disabled target was skipped).

## Default strategy: `createW3CTreeStrategy`

Implements the [W3C APG treeview pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

- `ArrowRight` on a collapsed parent expands it. On an already-open parent it moves to the first child. On a leaf it is a no-op.
- `ArrowLeft` on an open node collapses it. On a closed node (or leaf) with a parent it moves to the parent. On a root leaf it is a no-op.

Bound to `CNGX_HIERARCHICAL_NAV_STRATEGY` as the default `providedIn: 'root'` factory. No setup required to get APG behaviour.

## DI override

Register a replacement strategy when the consumer needs different semantics (expand-only without traversal, exotic drag-drop flows, locale-specific axes).

```ts
bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: CNGX_HIERARCHICAL_NAV_STRATEGY,
      useFactory: (): CngxHierarchicalNavStrategy => ({
        onArrowRight: (ctx) => {
          const node = ctx.controller.findById(ctx.activeId);
          if (!node?.hasChildren) {
            return { kind: 'noop' };
          }
          ctx.controller.expand(ctx.activeId);
          return { kind: 'expand', id: ctx.activeId };
        },
        onArrowLeft: () => ({ kind: 'noop' }),
      }),
    },
  ],
});
```

Scope the override to a subtree by listing the token in a component's `providers` or `viewProviders` array instead of the root injector.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, and the full strategy / context / action types.
- `createTreeController` for the expansion-state owner this directive drives.
- `CNGX_TREE_CONFIG` / `provideTreeConfig` for app-wide tree defaults (id, label, key, initial expansion, cache bound).
